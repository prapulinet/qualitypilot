import http from "node:http";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { baselineScenarios } from "./scenarios.js";
import { aiScenarios } from "./provider.js";
import { createCommerce } from "./commerce.js";
import { executeSuite, analyzeRun } from "./runner.js";

const assets = new Map([
  ["/bugs.js", ["bugs.js", "text/javascript; charset=utf-8"]],
  ["/bug-model.js", ["bug-model.js", "text/javascript; charset=utf-8"]],
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/coverage.js", ["coverage.js", "text/javascript; charset=utf-8"]],
  [
    "/coverage-model.js",
    ["coverage-model.js", "text/javascript; charset=utf-8"],
  ],
]);

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function readJSON(req) {
  if (
    (req.headers["content-type"] || "").split(";")[0].trim().toLowerCase() !==
    "application/json"
  )
    throw new RequestError(415, "Use application/json.");
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw new RequestError(413, "Request body too large.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError(400, "Invalid JSON.");
  }
}

export function createServer({
  endpoint = process.env.AI_GATEWAY_URL,
  token = process.env.AI_GATEWAY_TOKEN,
  fetchImpl,
} = {}) {
  const commerce = createCommerce();
  const runs = [];
  let running = false;
  const server = http.createServer(async (req, res) => {
    const send = (status, body) => {
      res.writeHead(status, {
        "content-type": "application/json; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      res.end(JSON.stringify(body));
    };
    try {
      if (
        !["GET", "HEAD"].includes(req.method) &&
        req.headers.origin &&
        req.headers.origin !== `http://${req.headers.host}`
      )
        return send(403, { error: "Cross-origin requests are not allowed." });
      const path = new URL(req.url, "http://localhost").pathname;
      if (req.method === "GET" && assets.has(path)) {
        const [file, type] = assets.get(path);
        const content = await readFile(
          new URL(`../web/${file}`, import.meta.url),
        );
        res.writeHead(200, {
          "content-type": type,
          "x-content-type-options": "nosniff",
          "content-security-policy":
            "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data: blob:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
        });
        return res.end(content);
      }
      if (path === "/api/health" && req.method === "GET")
        return send(200, {
          status: "ok",
          aiConfigured: Boolean(endpoint && token),
        });
      if (path === "/api/runs" && req.method === "GET")
        return send(200, { runs });
      if (path === "/api/runs" && req.method === "POST") {
        const body = await readJSON(req);
        if (!["smoke", "regression", "diagnostic"].includes(body?.suite))
          return send(400, {
            error: "Choose smoke, regression or diagnostic.",
          });
        if (running)
          return send(409, {
            error: "A suite is already running. Try again shortly.",
          });
        running = true;
        try {
          const run = await executeSuite(
            `http://127.0.0.1:${server.address().port}`,
            body.suite,
          );
          runs.unshift(run);
          runs.splice(20);
          return send(201, run);
        } finally {
          running = false;
        }
      }
      if (path.startsWith("/api/runs/") && req.method === "GET") {
        const [, , , id, resource] = path.split("/");
        const run = runs.find((run) => run.id === id);
        if (!run)
          return send(404, {
            error:
              "Run not found. Run history resets when the server restarts.",
          });
        if (resource === "analysis") return send(200, analyzeRun(run));
        if (resource) return send(404, { error: "Route not found." });
        return send(200, run);
      }
      if (path.startsWith("/api/demo/")) {
        const body = req.method === "POST" ? await readJSON(req) : undefined;
        const response = commerce(
          req.method,
          path,
          body,
          req.headers.authorization,
        );
        return send(response.status, response.body);
      }
      if (path !== "/api/scenarios")
        return send(404, { error: "Route not found." });
      if (req.method !== "POST") {
        res.setHeader("allow", "POST");
        return send(405, { error: "Use POST." });
      }
      const body = await readJSON(req);
      if (!body || !["baseline", "ai"].includes(body.mode))
        return send(400, { error: "Choose baseline or ai mode." });
      if (
        typeof body.story !== "string" ||
        body.story.trim().length < 15 ||
        body.story.length > 4000
      )
        return send(400, { error: "Story must contain 15–4000 characters." });
      if (body.mode === "ai") {
        if (!endpoint || !token)
          return send(503, {
            error: "AI gateway is not configured. Use baseline mode.",
          });
        try {
          return send(
            200,
            await aiScenarios(body.story, { endpoint, token, fetchImpl }),
          );
        } catch {
          return send(502, {
            error:
              "AI generation failed. Review gateway configuration and response format.",
          });
        }
      }
      return send(200, baselineScenarios(body.story));
    } catch (error) {
      if (!res.headersSent)
        send(error instanceof RequestError ? error.status : 500, {
          error:
            error instanceof RequestError
              ? error.message
              : "Unexpected server error.",
        });
      else res.end();
    }
  });
  server.requestTimeout = 30000;
  return server;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const port = Number(process.env.PORT || 3000);
  const server = createServer();
  server.listen(port, "127.0.0.1", () =>
    console.log(`QualityPilot: http://127.0.0.1:${port}`),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () => {
      server.close(() => process.exit(0));
      setTimeout(() => process.exit(1), 5000).unref();
    });
}
