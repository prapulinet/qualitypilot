import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "../src/server.js";

const credentials = { email: "qa@qualitypilot.test", password: "TestOnly!123" };
async function fixture(run) {
  const server = createServer({ endpoint: "", token: "" });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = async (
    path,
    { method = "GET", body, token, headers = {} } = {},
  ) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
  const login = async () =>
    (await request("/api/demo/session", { method: "POST", body: credentials }))
      .body.token;
  try {
    await run({ request, login, base });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("catalog contract uses integer currency and unique IDs", async () =>
  fixture(async ({ request }) => {
    const { status, body } = await request("/api/demo/products");
    assert.equal(status, 200);
    assert.equal(body.currency, "USD");
    assert.equal(body.products.length, 3);
    assert.equal(new Set(body.products.map((p) => p.id)).size, 3);
    assert.ok(
      body.products.every(
        (p) => p.priceCents > 0 && Number.isSafeInteger(p.priceCents),
      ),
    );
  }));
test("login rejects malformed credentials and cart requires a valid session", async () =>
  fixture(async ({ request }) => {
    for (const body of [null, {}, { ...credentials, password: "wrong" }])
      assert.equal(
        (await request("/api/demo/session", { method: "POST", body })).status,
        401,
      );
    assert.equal((await request("/api/demo/cart")).status, 401);
    assert.equal(
      (await request("/api/demo/cart", { token: "invented" })).status,
      401,
    );
  }));
test("quantity boundaries preserve state on invalid mutation", async () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    for (const quantity of [1, 5]) {
      const response = await request("/api/demo/cart", {
        method: "POST",
        token,
        body: { productId: "keyboard", quantity },
      });
      assert.equal(response.status, 200);
      assert.equal(response.body.totalCents, quantity * 8900);
    }
    for (const quantity of [0, 6, -1, 1.2, "2", null])
      assert.equal(
        (
          await request("/api/demo/cart", {
            method: "POST",
            token,
            body: { productId: "keyboard", quantity },
          })
        ).status,
        400,
      );
    assert.equal(
      (await request("/api/demo/cart", { token })).body.totalCents,
      44500,
    );
    assert.equal(
      (
        await request("/api/demo/cart", {
          method: "POST",
          token,
          body: { productId: "missing", quantity: 1 },
        })
      ).status,
      404,
    );
  }));
test("separate sessions cannot see each other’s cart or orders", async () =>
  fixture(async ({ request, login }) => {
    const first = await login(),
      second = await login();
    assert.notEqual(first, second);
    await request("/api/demo/cart", {
      method: "POST",
      token: first,
      body: { productId: "lamp", quantity: 2 },
    });
    assert.equal(
      (await request("/api/demo/cart", { token: second })).body.items.length,
      0,
    );
    const order = await request("/api/demo/checkout", {
      method: "POST",
      token: first,
      body: { idempotencyKey: "ownership-test" },
    });
    assert.equal(order.status, 201);
    assert.equal(order.body.totalCents, 9800);
    assert.equal(
      (await request(`/api/demo/orders/${order.body.id}`, { token: first }))
        .status,
      200,
    );
    assert.equal(
      (await request(`/api/demo/orders/${order.body.id}`, { token: second }))
        .status,
      404,
    );
  }));
test("checkout is idempotent, clears cart and rejects empty checkout", async () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    assert.equal(
      (
        await request("/api/demo/checkout", {
          method: "POST",
          token,
          body: { idempotencyKey: "empty-checkout" },
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await request("/api/demo/checkout", {
          method: "POST",
          token,
          body: { idempotencyKey: "short" },
        })
      ).status,
      400,
    );
    await request("/api/demo/cart", {
      method: "POST",
      token,
      body: { productId: "keyboard", quantity: 1 },
    });
    await request("/api/demo/cart", {
      method: "POST",
      token,
      body: { productId: "lamp", quantity: 1 },
    });
    const first = await request("/api/demo/checkout", {
      method: "POST",
      token,
      body: { idempotencyKey: "retry-checkout" },
    });
    const retry = await request("/api/demo/checkout", {
      method: "POST",
      token,
      body: { idempotencyKey: "retry-checkout" },
    });
    assert.equal(first.status, 201);
    assert.equal(retry.status, 200);
    assert.deepEqual(first.body, retry.body);
    assert.equal(first.body.totalCents, 13800);
    assert.equal(
      (await request("/api/demo/cart", { token })).body.items.length,
      0,
    );
  }));
test("logout invalidates the session", async () =>
  fixture(async ({ request, login }) => {
    const token = await login();
    assert.equal(
      (await request("/api/demo/session", { method: "DELETE", token })).status,
      200,
    );
    assert.equal((await request("/api/demo/cart", { token })).status, 401);
  }));
test("cross-origin mutations and misleading media types are rejected", async () =>
  fixture(async ({ request, base }) => {
    assert.equal(
      (
        await request("/api/demo/session", {
          method: "POST",
          body: credentials,
          headers: { origin: "https://untrusted.example" },
        })
      ).status,
      403,
    );
    const response = await fetch(`${base}/api/scenarios`, {
      method: "POST",
      headers: { "content-type": "application/json-malformed" },
      body: "{}",
    });
    assert.equal(response.status, 415);
  }));
test("static assets have strict CSP and do not expose arbitrary files", async () =>
  fixture(async ({ base }) => {
    const response = await fetch(base);
    assert.match(
      response.headers.get("content-security-policy"),
      /script-src 'self'/,
    );
    assert.equal(
      response.headers.get("content-security-policy").includes("unsafe-inline"),
      false,
    );
    assert.equal((await fetch(`${base}/app.js`)).status, 200);
    assert.equal((await fetch(`${base}/styles.css`)).status, 200);
    assert.equal((await fetch(`${base}/package.json`)).status, 404);
  }));
test("live regression records real results and exposes only known run IDs", async () =>
  fixture(async ({ request }) => {
    assert.equal(
      (
        await request("/api/runs", {
          method: "POST",
          body: { suite: "arbitrary-code" },
        })
      ).status,
      400,
    );
    const response = await request("/api/runs", {
      method: "POST",
      body: { suite: "regression" },
    });
    assert.equal(response.status, 201);
    assert.equal(response.body.total, 12);
    assert.equal(response.body.failed, 0);
    assert.equal(response.body.source, "live-local-http");
    assert.ok(
      response.body.results.every(
        (r) => r.status === "passed" && r.durationMs >= 0,
      ),
    );
    assert.equal(
      (await request("/api/runs")).body.runs[0].id,
      response.body.id,
    );
    assert.equal(
      (await request(`/api/runs/${response.body.id}`)).body.id,
      response.body.id,
    );
    assert.equal((await request("/api/runs/missing")).status, 404);
  }));
test("diagnostic failure is labeled and triage is grounded in its evidence", async () =>
  fixture(async ({ request }) => {
    const run = (
      await request("/api/runs", {
        method: "POST",
        body: { suite: "diagnostic" },
      })
    ).body;
    assert.equal(run.diagnostic, true);
    assert.equal(run.total, 13);
    assert.equal(run.failed, 1);
    const analysis = (await request(`/api/runs/${run.id}/analysis`)).body;
    assert.equal(analysis.source, "rule-based");
    assert.equal(analysis.reviewRequired, true);
    assert.equal(analysis.findings.length, 1);
    assert.match(analysis.findings[0].hypothesis, /deliberately/);
    assert.match(analysis.findings[0].evidence, /observed 3/);
  }));
test("suite requests are serialized to prevent resource races", async () =>
  fixture(async ({ request }) => {
    const responses = await Promise.all(
      Array.from({ length: 3 }, () =>
        request("/api/runs", { method: "POST", body: { suite: "regression" } }),
      ),
    );
    assert.equal(responses.filter((r) => r.status === 201).length, 1);
    assert.equal(responses.filter((r) => r.status === 409).length, 2);
  }));
