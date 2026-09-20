import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerProvider, resolveAttribution } from '../extension/src/background/affiliate.js';

const base = {
  id: 'x',
  code: 'TEST20',
  affiliate: { network: 'mock', attributionMode: 'code-only', url: null },
};

test('the mock provider returns a code-only attribution', () => {
  assert.deepEqual(resolveAttribution(base), { mode: 'code-only', code: 'TEST20' });
});

test('link attribution is refused until a real network implements it', () => {
  const linkOffer = { ...base, affiliate: { network: 'mock', attributionMode: 'link', url: 'https://x.example' } };
  assert.equal(resolveAttribution(linkOffer), null, 'MVP must not follow or rewrite affiliate links');
});

test('an unknown affiliate network is refused', () => {
  assert.equal(resolveAttribution({ ...base, affiliate: { ...base.affiliate, network: 'nope' } }), null);
});

test('a new network can be registered without touching the rest of the code', () => {
  registerProvider({ name: 'demo-network', resolve: (offer) => ({ mode: 'code-only', code: offer.code }) });
  const offer = { ...base, affiliate: { network: 'demo-network', attributionMode: 'code-only', url: null } };
  assert.deepEqual(resolveAttribution(offer), { mode: 'code-only', code: 'TEST20' });
});
