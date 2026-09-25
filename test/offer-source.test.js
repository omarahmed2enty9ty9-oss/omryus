import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OfferSource } from '../extension/src/background/offer-source.js';
import { contentScriptMatches, matchPatternsFor } from '../extension/src/shared/offers.js';

function makeOffer(overrides = {}) {
  return {
    id: 'test-offer',
    merchant: { name: 'Test Shop', domains: ['testshop.example'] },
    title: '20% off',
    benefit: { type: 'percent', value: 20 },
    code: 'TEST20',
    affiliate: { network: 'mock', attributionMode: 'code-only', url: null },
    active: true,
    checkout: { urlPatterns: ['*/cart*'], fieldSelectors: ["input[name='coupon']"] },
    source: 'mock',
    ...overrides,
  };
}

/** chrome.storage.local, in memory. */
function memoryStorage() {
  const data = {};
  return {
    get: async (key) => (key in data ? { [key]: structuredClone(data[key]) } : {}),
    set: async (items) => Object.assign(data, structuredClone(items)),
  };
}

const serve = (body, status = 200) => async () => new Response(JSON.stringify(body), { status });

test('before the first download, the bundled offers are used', async () => {
  const source = new OfferSource({ bundledList: [makeOffer()], storage: memoryStorage(), fetchImpl: serve([]) });
  assert.deepEqual((await source.getOffers()).map((o) => o.id), ['test-offer']);
});

test('a download adds new offers and replaces bundled ones with the same id', async () => {
  const bundled = [makeOffer({ id: 'a', code: 'OLD' }), makeOffer({ id: 'b' })];
  const remote = [makeOffer({ id: 'a', code: 'NEW' }), makeOffer({ id: 'c', merchant: { name: 'New', domains: ['newshop.example'] } })];
  const source = new OfferSource({ bundledList: bundled, storage: memoryStorage(), fetchImpl: serve(remote) });
  await source.refresh();
  const offers = await source.getOffers();
  assert.deepEqual(offers.map((o) => o.id).sort(), ['a', 'b', 'c']);
  assert.equal(offers.find((o) => o.id === 'a').code, 'NEW');
});

test('a failed download throws and keeps the last good list', async () => {
  const storage = memoryStorage();
  await new OfferSource({ bundledList: [], storage, fetchImpl: serve([makeOffer({ id: 'kept' })]) }).refresh();
  const broken = new OfferSource({ bundledList: [], storage, fetchImpl: serve({ error: 'down' }, 503) });
  await assert.rejects(broken.refresh(), /HTTP 503/);
  assert.deepEqual((await broken.getOffers()).map((o) => o.id), ['kept']);
});

test('invalid downloaded entries are dropped, not trusted', async () => {
  const source = new OfferSource({
    bundledList: [],
    storage: memoryStorage(),
    fetchImpl: serve([makeOffer({ id: 'good' }), { id: 'bad', code: 'NOSELECTORS' }]),
  });
  await source.refresh();
  assert.deepEqual((await source.getOffers()).map((o) => o.id), ['good']);
});

test('the download sends no cookies and skips the HTTP cache', async () => {
  let init;
  const source = new OfferSource({ bundledList: [], storage: memoryStorage(), fetchImpl: async (_url, i) => { init = i; return new Response('[]'); } });
  await source.refresh();
  assert.equal(init.credentials, 'omit');
  assert.equal(init.cache, 'no-store');
});

test('the content script may run only on stores with a live offer', () => {
  const now = Date.parse('2026-06-01T00:00:00Z');
  const offers = [
    makeOffer({ id: 'live', merchant: { name: 'Live', domains: ['www.live.example'] } }),
    makeOffer({ id: 'off', active: false, merchant: { name: 'Off', domains: ['off.example'] } }),
    makeOffer({ id: 'expired', expiresAt: '2026-01-01T00:00:00Z', merchant: { name: 'Old', domains: ['old.example'] } }),
  ];
  assert.deepEqual(contentScriptMatches(offers, now), ['https://*.live.example/*', 'https://live.example/*']);
  assert.deepEqual(matchPatternsFor('localhost'), ['http://localhost/*']);
});
