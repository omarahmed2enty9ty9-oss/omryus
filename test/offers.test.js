import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DISMISS_DURATION_MS,
  findOfferForUrl,
  isDismissed,
  isOfferLive,
  loadOffers,
  validateOffer,
} from '../extension/src/shared/offers.js';

const NOW = Date.parse('2026-06-01T00:00:00Z');

/** A minimal valid offer; each test overrides just the bit it cares about. */
function makeOffer(overrides = {}) {
  return {
    id: 'test-offer',
    merchant: { name: 'Test Shop', domains: ['testshop.example'] },
    title: '20% off',
    discount: { type: 'percent', value: 20 },
    code: 'TEST20',
    affiliate: { network: 'mock', attributionMode: 'code-only', url: null },
    active: true,
    checkout: { urlPatterns: ['*/cart*', '*/checkout*'], fieldSelectors: ["input[name='coupon']"] },
    source: 'mock',
    ...overrides,
  };
}

test('detects a supported merchant on a checkout page', () => {
  const offer = makeOffer();
  assert.equal(findOfferForUrl([offer], 'https://testshop.example/cart', NOW), offer);
});

test('matches subdomains and ignores www', () => {
  const offer = makeOffer();
  assert.ok(findOfferForUrl([offer], 'https://www.testshop.example/cart', NOW));
  assert.ok(findOfferForUrl([offer], 'https://uk.testshop.example/checkout/step-2', NOW));
});

test('ignores an unsupported merchant', () => {
  assert.equal(findOfferForUrl([makeOffer()], 'https://someoneelse.example/cart', NOW), null);
});

test('does not match a lookalike domain', () => {
  // "nottestshop.example" must not match "testshop.example".
  assert.equal(findOfferForUrl([makeOffer()], 'https://nottestshop.example/cart', NOW), null);
});

test('stays off pages that are not cart or checkout', () => {
  assert.equal(findOfferForUrl([makeOffer()], 'https://testshop.example/products/hat', NOW), null);
});

test('an active, in-window offer is live', () => {
  assert.equal(isOfferLive(makeOffer({ expiresAt: '2026-12-31T00:00:00Z' }), NOW), true);
});

test('an expired offer is not returned', () => {
  const expired = makeOffer({ expiresAt: '2026-01-01T00:00:00Z' });
  assert.equal(isOfferLive(expired, NOW), false);
  assert.equal(findOfferForUrl([expired], 'https://testshop.example/cart', NOW), null);
});

test('an offer that has not started yet is not returned', () => {
  const future = makeOffer({ startsAt: '2026-12-01T00:00:00Z' });
  assert.equal(findOfferForUrl([future], 'https://testshop.example/cart', NOW), null);
});

test('a deactivated offer is not returned', () => {
  assert.equal(findOfferForUrl([makeOffer({ active: false })], 'https://testshop.example/cart', NOW), null);
});

test('malformed offers are rejected one by one, not fatally', () => {
  const { offers, errors } = loadOffers([
    makeOffer(),
    null,
    { id: 'no-merchant', title: 'x' },
    makeOffer({ id: 'bad-mode', affiliate: { network: 'mock', attributionMode: 'sneaky', url: null } }),
    makeOffer({ id: 'no-code', code: '' }),
    makeOffer({ id: 'bad-date', expiresAt: 'whenever' }),
    makeOffer({ id: 'bad-active', active: 'yes' }),
    'not an object',
  ]);
  assert.equal(offers.length, 1, 'only the one good offer survives');
  assert.equal(errors.length, 7);
  assert.match(errors.join(' '), /attributionMode/);
});

test('a non-array offers file yields no offers rather than throwing', () => {
  assert.deepEqual(loadOffers({ oops: true }), { offers: [], errors: ['offers file is not an array'] });
});

test('a malformed URL is handled, not thrown', () => {
  assert.equal(findOfferForUrl([makeOffer()], 'not-a-url', NOW), null);
});

test('validateOffer accepts the minimal valid shape', () => {
  assert.equal(validateOffer(makeOffer()).ok, true);
});

test('dismissal silences an offer for a week, then stops', () => {
  assert.equal(isDismissed(undefined, NOW), false);
  assert.equal(isDismissed(NOW - 1000, NOW), true);
  assert.equal(isDismissed(NOW - DISMISS_DURATION_MS - 1, NOW), false);
});

test('the shipped offers.json is valid', () => {
  const raw = JSON.parse(readFileSync(new URL('../extension/src/data/offers.json', import.meta.url), 'utf8'));
  const { offers, errors } = loadOffers(raw);
  assert.deepEqual(errors, [], 'offers.json has invalid entries');
  assert.ok(offers.length > 0);
  // Until we have real partnerships, everything we ship must be labelled mock.
  assert.ok(offers.every((o) => o.source === 'mock'), 'shipped offers must be labelled as mock data');
});
