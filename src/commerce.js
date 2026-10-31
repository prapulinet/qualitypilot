import { randomUUID } from "node:crypto";

export const products = Object.freeze([
  {
    id: "keyboard",
    name: "Orbit mechanical keyboard",
    priceCents: 8900,
    category: "Desk essentials",
    icon: "⌨",
  },
  {
    id: "headphones",
    name: "Studio wireless headphones",
    priceCents: 12900,
    category: "Focus collection",
    icon: "♫",
  },
  {
    id: "lamp",
    name: "Arc desk lamp",
    priceCents: 4900,
    category: "Desk essentials",
    icon: "◒",
  },
]);

export function createCommerce() {
  const sessions = new Map();
  const reply = (status, body) => ({ status, body });
  const cartView = (session) => {
    const items = [...session.cart].map(([id, quantity]) => ({
      ...products.find((p) => p.id === id),
      quantity,
    }));
    return {
      items,
      totalCents: items.reduce((sum, p) => sum + p.priceCents * p.quantity, 0),
      currency: "USD",
    };
  };
  return function handle(method, path, body, authorization = "") {
    const now = Date.now();
    for (const [key, value] of sessions)
      if (now - value.createdAt > 3600000) sessions.delete(key);
    if (path === "/api/demo/products" && method === "GET")
      return reply(200, { products, currency: "USD" });
    if (path === "/api/demo/session" && method === "POST") {
      if (
        body?.email !== "qa@qualitypilot.test" ||
        body?.password !== "TestOnly!123"
      )
        return reply(401, { error: "Invalid demo credentials." });
      if (sessions.size >= 100)
        return reply(429, { error: "Demo session limit reached." });
      const token = randomUUID();
      sessions.set(token, {
        cart: new Map(),
        orders: new Map(),
        keys: new Map(),
        createdAt: now,
      });
      return reply(201, { token, expiresInSeconds: 3600 });
    }
    const token = authorization.replace(/^Bearer /, "");
    const session = sessions.get(token);
    if (!session) return reply(401, { error: "Sign in to the demo first." });
    if (path === "/api/demo/session" && method === "DELETE") {
      sessions.delete(token);
      return reply(200, { signedOut: true });
    }
    if (path === "/api/demo/cart" && method === "GET")
      return reply(200, cartView(session));
    if (path === "/api/demo/cart" && method === "POST") {
      if (!products.some((p) => p.id === body?.productId))
        return reply(404, { error: "Product not found." });
      if (
        !Number.isSafeInteger(body.quantity) ||
        body.quantity < 1 ||
        body.quantity > 5
      )
        return reply(400, {
          error: "Quantity must be an integer from 1 to 5.",
        });
      session.cart.set(body.productId, body.quantity);
      return reply(200, cartView(session));
    }
    if (path === "/api/demo/cart" && method === "DELETE") {
      session.cart.clear();
      return reply(200, cartView(session));
    }
    if (path === "/api/demo/checkout" && method === "POST") {
      if (
        typeof body?.idempotencyKey !== "string" ||
        !/^[a-zA-Z0-9-]{8,80}$/.test(body.idempotencyKey)
      )
        return reply(400, {
          error: "Provide an 8–80 character idempotency key.",
        });
      if (session.keys.has(body.idempotencyKey))
        return reply(200, session.keys.get(body.idempotencyKey));
      if (session.cart.size === 0)
        return reply(409, { error: "Your cart is empty." });
      const order = {
        id: randomUUID(),
        ...cartView(session),
        createdAt: new Date().toISOString(),
        status: "demo-confirmed",
      };
      session.orders.set(order.id, order);
      session.keys.set(body.idempotencyKey, order);
      session.cart.clear();
      return reply(201, order);
    }
    if (path.startsWith("/api/demo/orders/") && method === "GET") {
      const order = session.orders.get(path.slice("/api/demo/orders/".length));
      return order
        ? reply(200, order)
        : reply(404, { error: "Order not found." });
    }
    return reply(404, { error: "Demo route not found." });
  };
}
