import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../src/server.js';
import { baselineScenarios } from '../src/scenarios.js';
import { aiScenarios } from '../src/provider.js';

async function withServer(options, run) {
  const server = createServer(options);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { await new Promise(resolve => server.close(resolve)); }
}
const story = 'As a customer I want to view my order history.';
const post = (base, body, headers = { 'content-type': 'application/json' }) => fetch(`${base}/api/scenarios`, { method: 'POST', headers, body: typeof body === 'string' ? body : JSON.stringify(body) });

test('baseline is honest about provenance and covers distinct risk categories', () => {
  const result = baselineScenarios(story);
  assert.equal(result.source, 'baseline');
  assert.equal(result.reviewRequired, true);
  assert.deepEqual(result.scenarios.map(s => s.category), ['positive', 'negative', 'boundary', 'access']);
  assert.equal(new Set(result.scenarios.map(s => s.id)).size, 4);
});
test('story length boundaries are enforced', () => {
  for (const invalid of [null, '', 'x'.repeat(14), 'x'.repeat(4001)]) assert.throws(() => baselineScenarios(invalid));
  for (const length of [15, 4000]) assert.equal(baselineScenarios('x'.repeat(length)).story.length, length);
});
test('HTTP baseline request returns reviewable scenarios', async () => withServer({}, async base => {
  const response = await post(base, { story, mode: 'baseline' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).scenarios.length, 4);
}));
test('API rejects malformed, invalid and oversized requests', async () => withServer({}, async base => {
  for (const [body, status] of [['{', 400], [null, 400], [{ story: 'short', mode: 'baseline' }, 400], [{ story, mode: 'unknown' }, 400], ['x'.repeat(17000), 413]]) {
    assert.equal((await post(base, body)).status, status);
  }
  assert.equal((await post(base, '{}', { 'content-type': 'text/plain' })).status, 415);
  assert.equal((await fetch(`${base}/api/scenarios`)).status, 405);
  assert.equal((await fetch(`${base}/missing`)).status, 404);
}));
test('health and home work without an AI key', async () => withServer({ endpoint: '', token: '' }, async base => {
  assert.deepEqual(await (await fetch(`${base}/api/health`)).json(), { status: 'ok', aiConfigured: false });
  assert.match(await (await fetch(base)).text(), /QualityPilot/);
  assert.equal((await post(base, { story, mode: 'ai' })).status, 503);
}));
test('AI adapter sends credentials only to configured HTTPS gateway and validates drafts', async () => {
  const result = await aiScenarios(story, { endpoint: 'https://gateway.example/scenarios', token: 'test-token', fetchImpl: async (url, options) => {
    assert.equal(url.hostname, 'gateway.example');
    assert.equal(options.headers.authorization, 'Bearer test-token');
    assert.deepEqual(JSON.parse(options.body), { story });
    assert.equal(options.redirect, 'error');
    return { ok: true, json: async () => ({ scenarios: [{ title: 'Order ownership', steps: ['Request another customer’s order'], expected: 'Access denied' }] }) };
  } });
  assert.equal(result.source, 'ai');
  assert.equal(result.reviewRequired, true);
  assert.equal(result.scenarios[0].id, 'AI-1');
  assert.equal(JSON.stringify(result).includes('test-token'), false);
});
test('AI adapter rejects insecure gateways and malformed responses', async () => {
  await assert.rejects(aiScenarios(story, { endpoint: 'http://gateway.example', token: 'x' }), /HTTPS/);
  for (const payload of [{ scenarios: [] }, { scenarios: [null] }, { scenarios: [{ title: 'T', steps: [], expected: 'E' }] }]) {
    await assert.rejects(aiScenarios(story, { endpoint: 'https://gateway.example', token: 'x', fetchImpl: async () => ({ ok: true, json: async () => payload }) }), /Invalid AI/);
  }
});
test('gateway errors are sanitized at the API boundary', async () => withServer({ endpoint: 'https://gateway.example', token: 'secret', fetchImpl: async () => { throw Error('secret upstream diagnostic'); } }, async base => {
  const response = await post(base, { story, mode: 'ai' });
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes('secret'), false);
}));
