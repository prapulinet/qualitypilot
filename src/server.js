import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { baselineScenarios } from './scenarios.js';
import { aiScenarios } from './provider.js';

const page = new URL('../web/index.html', import.meta.url);
export function createServer({ endpoint = process.env.AI_GATEWAY_URL, token = process.env.AI_GATEWAY_TOKEN, fetchImpl } = {}) {
  return http.createServer(async (req, res) => {
    const send = (status, body) => { res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' }); res.end(JSON.stringify(body)); };
    try {
      if (req.method === 'GET' && req.url === '/') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'" });
        return res.end(await readFile(page));
      }
      if (req.method === 'GET' && req.url === '/api/health') return send(200, { status: 'ok', aiConfigured: Boolean(endpoint && token) });
      if (req.url !== '/api/scenarios') return send(404, { error: 'Route not found.' });
      if (req.method !== 'POST') { res.setHeader('allow', 'POST'); return send(405, { error: 'Use POST.' }); }
      if (!(req.headers['content-type'] || '').split(';')[0].trim().startsWith('application/json')) return send(415, { error: 'Use application/json.' });
      let raw = ''; let size = 0;
      for await (const chunk of req) { size += chunk.length; if (size > 16384) return send(413, { error: 'Request body too large.' }); raw += chunk; }
      let body;
      try { body = JSON.parse(raw); } catch { return send(400, { error: 'Invalid JSON.' }); }
      if (!body || !['baseline', 'ai'].includes(body.mode)) return send(400, { error: 'Choose baseline or ai mode.' });
      if (typeof body.story !== 'string' || body.story.trim().length < 15 || body.story.length > 4000) return send(400, { error: 'Story must contain 15–4000 characters.' });
      if (body.mode === 'ai') {
        if (!endpoint || !token) return send(503, { error: 'AI gateway is not configured. Use baseline mode.' });
        try { return send(200, await aiScenarios(body.story, { endpoint, token, fetchImpl })); }
        catch { return send(502, { error: 'AI generation failed. Review gateway configuration and response format.' }); }
      }
      return send(200, baselineScenarios(body.story));
    } catch { if (!res.headersSent) send(500, { error: 'Unexpected server error.' }); else res.end(); }
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createServer().listen(Number(process.env.PORT || 3000), '127.0.0.1', () => console.log('QualityPilot: http://127.0.0.1:3000'));
}
