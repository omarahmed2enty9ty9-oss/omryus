import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  findOffersForUrl,
  hasUserBenefit,
  isDonationOffer,
  isOfferLive,
  loadOffers,
  validateOffer,
} from '../extension/src/shared/offers.js';

const NOW = Date.parse('2026-06-01T00:00:00Z');

/** Most tests only care about the best match. */
const findOfferForUrl = (offers, url, now) => findOffersForUrl(offers, url, now)[0] ?? null;

/** A minimal valid offer; each test overrides just the bit it cares about. */
function makeOffer(overrides = {}) {
  return {
    id: 'test-offer',
    merchant: { name: 'Test Shop', domains: ['testshop.example'] },
    title: '20% off',
    benefit: { type: 'percent', value: 20 },
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
    makeOffer({ id: 'bad-benefit', benefit: { type: 'freebie', value: 1 } }),
    'not an object',
  ]);
  assert.equal(offers.length, 1, 'only the one good offer survives');
  assert.equal(errors.length, 8);
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

test('a real discount counts as a user benefit', () => {
  assert.equal(hasUserBenefit(makeOffer()), true);
  assert.equal(hasUserBenefit(makeOffer({ benefit: { type: 'fixed', value: 5 } })), true);
  assert.equal(hasUserBenefit(makeOffer({ benefit: { type: 'shipping', value: 0 } })), true);
});

test('a donation-funded code counts as a user benefit', () => {
  // Policy names "discount, cashback, or donation". This only holds while we
  // keep none of the commission — see DONATION in shared/brand.js.
  const donation = makeOffer({ benefit: { type: 'donation', value: 0 } });
  assert.equal(hasUserBenefit(donation), true);
  assert.equal(isDonationOffer(donation), true);
});

test('a discount offer is not flagged as a donation', () => {
  assert.equal(isDonationOffer(makeOffer()), false);
});

test('an attribution-only code is not a user benefit', () => {
  // A code that earns commission and saves the shopper nothing. Chrome Web Store
  // policy forbids inserting these, so they must never reach the page.
  assert.equal(hasUserBenefit(makeOffer({ benefit: { type: 'none', value: 0 } })), false);
});

test('a zero-value discount is not a user benefit either', () => {
  assert.equal(hasUserBenefit(makeOffer({ benefit: { type: 'percent', value: 0 } })), false);
  assert.equal(hasUserBenefit(makeOffer({ benefit: { type: 'fixed', value: 0 } })), false);
});

test('validateOffer accepts an attribution-only offer so it can be stored and refused later', () => {
  assert.equal(validateOffer(makeOffer({ benefit: { type: 'none', value: 0 } })).ok, true);
});

test('a refused offer does not shadow a usable one on the same page', () => {
  // Offers are tried in file order; the caller picks the first it may act on.
  const attributionOnly = makeOffer({ id: 'attr-only', benefit: { type: 'none', value: 0 } });
  const real = makeOffer({ id: 'real', code: 'REAL20' });
  const matches = findOffersForUrl([attributionOnly, real], 'https://testshop.example/cart', NOW);
  assert.deepEqual(matches.map((o) => o.id), ['attr-only', 'real'], 'both match the URL');
  assert.equal(matches.filter(hasUserBenefit)[0].id, 'real', 'the usable one is still reachable');
});

test('the shipped offers.json is valid', () => {
  const raw = JSON.parse(readFileSync(new URL('../extension/src/data/offers.json', import.meta.url), 'utf8'));
  const { offers, errors } = loadOffers(raw);
  assert.deepEqual(errors, [], 'offers.json has invalid entries');
  assert.ok(offers.length > 0);
  // Until we have real partnerships, everything we ship must be labelled mock.
  assert.ok(offers.every((o) => o.source === 'mock'), 'shipped offers must be labelled as mock data');
  // And nothing we ship may be an attribution-only code.
  assert.ok(offers.every(hasUserBenefit), 'every shipped offer must give the shopper something');
});
