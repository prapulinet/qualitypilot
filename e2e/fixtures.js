import { test as base, expect } from "@playwright/test";
import { createServer } from "../src/server.js";

// Every browser test owns a fresh server and commerce state. No shared port,
// process shell, paid gateway, or cross-test run history is involved.
export const test = base.extend({
  baseURL: async ({}, use) => {
    const server = createServer({ endpoint: "", token: "" });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    try {
      await use(`http://127.0.0.1:${server.address().port}`);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  },
});
export { expect };
