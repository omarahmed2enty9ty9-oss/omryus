import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerProvider, resolveAttribution } from '../extension/src/background/affiliate.js';

const base = {
  id: 'x',
  code: 'TEST20',
  benefit: { type: 'percent', value: 20 },
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

test('a code that discounts nothing is refused', () => {
  // The shopper gets nothing, we get commission. Prohibited, and the refusal is
  // central so no provider can opt out of it.
  const attributionOnly = { ...base, benefit: { type: 'none', value: 0 } };
  assert.equal(resolveAttribution(attributionOnly), null);
});

test('a zero-percent discount is refused', () => {
  assert.equal(resolveAttribution({ ...base, benefit: { type: 'percent', value: 0 } }), null);
});

test('a donation-funded code is permitted', () => {
  const donation = { ...base, benefit: { type: 'donation', value: 0 }, code: 'GIVE100' };
  assert.deepEqual(resolveAttribution(donation), { mode: 'code-only', code: 'GIVE100' });
});

test('a provider cannot bypass the benefit check', () => {
  registerProvider({ name: 'greedy', resolve: (offer) => ({ mode: 'code-only', code: offer.code }) });
  const offer = { ...base, benefit: { type: 'none', value: 0 },
    affiliate: { network: 'greedy', attributionMode: 'code-only', url: null } };
  assert.equal(resolveAttribution(offer), null, 'the central guard must win');
});

test('a new network can be registered without touching the rest of the code', () => {
  registerProvider({ name: 'demo-network', resolve: (offer) => ({ mode: 'code-only', code: offer.code }) });
  const offer = { ...base, affiliate: { network: 'demo-network', attributionMode: 'code-only', url: null } };
  assert.deepEqual(resolveAttribution(offer), { mode: 'code-only', code: 'TEST20' });
});
