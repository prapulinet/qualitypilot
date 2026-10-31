import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

export async function executeSuite(baseURL, suite = "regression") {
  const started = performance.now();
  const results = [];
  let token;
  let otherToken;
  let order;
  const call = async (path, { method = "GET", body, auth = token } = {}) => {
    const response = await fetch(new URL(path, baseURL), {
      method,
      signal: AbortSignal.timeout(5000),
      headers: {
        "content-type": "application/json",
        ...(auth ? { authorization: `Bearer ${auth}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
  const check = async (name, category, fn) => {
    const time = performance.now();
    try {
      await fn();
      results.push({
        name,
        category,
        status: "passed",
        durationMs: Math.round(performance.now() - time),
      });
    } catch (error) {
      results.push({
        name,
        category,
        status: "failed",
        durationMs: Math.round(performance.now() - time),
        error: error.message.slice(0, 2000),
      });
    }
  };
  const credentials = {
    email: "qa@qualitypilot.test",
    password: "TestOnly!123",
  };
  try {
    await check("Health endpoint is available", "smoke", async () => {
      assert.equal((await call("/api/health")).status, 200);
    });
    await check(
      "Catalog exposes three products with integer prices",
      "contract",
      async () => {
        const response = await call("/api/demo/products");
        assert.equal(response.status, 200);
        assert.equal(response.body.products.length, 3);
        assert.ok(
          response.body.products.every(
            (p) => Number.isSafeInteger(p.priceCents) && p.priceCents > 0,
          ),
        );
      },
    );
    await check(
      "Unauthenticated cart access is rejected",
      "access",
      async () => {
        assert.equal((await call("/api/demo/cart", { auth: "" })).status, 401);
      },
    );
    await check("Invalid credentials are rejected", "negative", async () => {
      assert.equal(
        (
          await call("/api/demo/session", {
            method: "POST",
            body: { ...credentials, password: "wrong" },
          })
        ).status,
        401,
      );
    });
    await check("Demo user can sign in", "positive", async () => {
      const response = await call("/api/demo/session", {
        method: "POST",
        body: credentials,
      });
      assert.equal(response.status, 201);
      token = response.body.token;
      assert.ok(token);
    });
    if (suite !== "smoke") {
      await check("Empty checkout is rejected", "negative", async () => {
        assert.equal(
          (
            await call("/api/demo/checkout", {
              method: "POST",
              body: { idempotencyKey: randomUUID() },
            })
          ).status,
          409,
        );
      });
      await check(
        "Invalid quantities do not change the cart",
        "boundary",
        async () => {
          for (const quantity of [0, -1, 6, 1.5, "2"])
            assert.equal(
              (
                await call("/api/demo/cart", {
                  method: "POST",
                  body: { productId: "keyboard", quantity },
                })
              ).status,
              400,
            );
          assert.equal((await call("/api/demo/cart")).body.items.length, 0);
        },
      );
      await check("Unknown product is rejected", "negative", async () => {
        assert.equal(
          (
            await call("/api/demo/cart", {
              method: "POST",
              body: { productId: "missing", quantity: 1 },
            })
          ).status,
          404,
        );
      });
      await check(
        "Cart totals are calculated in cents",
        "positive",
        async () => {
          const response = await call("/api/demo/cart", {
            method: "POST",
            body: { productId: "keyboard", quantity: 2 },
          });
          assert.equal(response.status, 200);
          assert.equal(response.body.totalCents, 17800);
        },
      );
      const key = randomUUID();
      await check(
        "Checkout creates an order and empties the cart",
        "positive",
        async () => {
          const response = await call("/api/demo/checkout", {
            method: "POST",
            body: { idempotencyKey: key },
          });
          assert.equal(response.status, 201);
          order = response.body;
          assert.equal(order.totalCents, 17800);
          assert.equal((await call("/api/demo/cart")).body.items.length, 0);
        },
      );
      await check(
        "Checkout retry returns the same order",
        "reliability",
        async () => {
          const response = await call("/api/demo/checkout", {
            method: "POST",
            body: { idempotencyKey: key },
          });
          assert.equal(response.status, 200);
          assert.equal(response.body.id, order.id);
        },
      );
      await check(
        "Order ownership is isolated between sessions",
        "access",
        async () => {
          otherToken = (
            await call("/api/demo/session", {
              method: "POST",
              body: credentials,
            })
          ).body.token;
          assert.equal(
            (await call(`/api/demo/orders/${order.id}`, { auth: otherToken }))
              .status,
            404,
          );
          assert.equal(
            (await call(`/api/demo/orders/${order.id}`)).status,
            200,
          );
        },
      );
    }
    if (suite === "diagnostic")
      await check(
        "Intentional diagnostic: catalog must contain 99 products",
        "diagnostic",
        async () => {
          const count = (await call("/api/demo/products")).body.products.length;
          assert.equal(
            count,
            99,
            `Intentional exercise: expected 99 products; observed ${count}. This is a diagnostic expectation, not an application defect.`,
          );
        },
      );
  } finally {
    for (const auth of [token, otherToken].filter(Boolean))
      await call("/api/demo/session", { method: "DELETE", auth }).catch(
        () => {},
      );
  }
  return {
    id: randomUUID(),
    suite,
    createdAt: new Date().toISOString(),
    durationMs: Math.round(performance.now() - started),
    total: results.length,
    passed: results.filter((r) => r.status === "passed").length,
    failed: results.filter((r) => r.status === "failed").length,
    results,
    source: "live-local-http",
    diagnostic: suite === "diagnostic",
  };
}

export function analyzeRun(run) {
  const failures = run.results.filter((result) => result.status === "failed");
  return {
    source: "rule-based",
    reviewRequired: true,
    summary: failures.length
      ? `${failures.length} failed check(s) require review.`
      : "No failed checks in this run.",
    findings: failures.map((failure) => ({
      test: failure.name,
      evidence: failure.error,
      hypothesis:
        failure.category === "diagnostic"
          ? "The diagnostic suite deliberately uses an unmet expectation to demonstrate triage."
          : "Observed behavior differs from the assertion. Review the request, response and test prerequisites.",
      nextSteps:
        failure.category === "diagnostic"
          ? [
              "Compare the expected count (99) with the seeded catalog (3).",
              "Run the regression suite to distinguish the exercise from an application defect.",
            ]
          : [
              "Reproduce the isolated check.",
              "Compare its response with the API contract.",
              "Inspect test data and session state before changing application code.",
            ],
    })),
  };
}
