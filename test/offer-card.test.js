import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom } from './dom-setup.js';

let showCard, HOST_ID;

const OFFER = {
  id: 'test-offer',
  merchantName: 'Test Shop',
  title: '20% off',
  isDonation: false,
  terms: 'Mock data.',
  source: 'mock',
  lastTested: '2026-09-20',
};

/** Same offer, but the code saves the shopper nothing and funds a donation. */
const DONATION_OFFER = { ...OFFER, title: 'Fund a donation with your order', isDonation: true };

const noop = () => {};

beforeEach(async () => {
  setupDom();
  ({ showCard, HOST_ID } = await import('../extension/src/content/offer-card.js?' + Math.random()));
});

test('renders the offer with an Apply and a Dismiss button', () => {
  const card = showCard(OFFER, { onApply: noop, onDismiss: noop });
  const shadow = document.getElementById(HOST_ID).shadowRoot;
  assert.ok(card);
  assert.match(shadow.textContent, /20% off/);
  assert.match(shadow.textContent, /Test Shop/);
  assert.ok(shadow.querySelector('.apply'), 'needs an Apply button');
  assert.ok(shadow.querySelector('.dismiss'), 'needs a Dismiss button');
});

test('labels mock data so it can never be mistaken for a real partnership', () => {
  showCard(OFFER, { onApply: noop, onDismiss: noop });
  assert.match(document.getElementById(HOST_ID).shadowRoot.textContent, /MOCK OFFER/);
});

test('discloses the affiliate relationship on the card itself', () => {
  showCard(OFFER, { onApply: noop, onDismiss: noop });
  const text = document.getElementById(HOST_ID).shadowRoot.textContent;
  assert.match(text, /supports Omryus/i, 'must say the code supports us');
  assert.match(text, /no extra cost/i, 'must say it costs the shopper nothing');
});

test('the code is not in the page until the user clicks Apply', () => {
  // showCard is never given the code — the content script fetches it on click.
  showCard(OFFER, { onApply: noop, onDismiss: noop });
  assert.doesNotMatch(document.getElementById(HOST_ID).shadowRoot.innerHTML, /MOCK20/);
});

test('showing twice does not stack duplicate notifications', () => {
  assert.ok(showCard(OFFER, { onApply: noop, onDismiss: noop }));
  assert.equal(showCard(OFFER, { onApply: noop, onDismiss: noop }), null, 'second call must be ignored');
  assert.equal(document.querySelectorAll(`#${HOST_ID}`).length, 1);
});

test('clicking Apply calls back exactly once', () => {
  let applied = 0;
  showCard(OFFER, { onApply: () => applied++, onDismiss: noop });
  document.getElementById(HOST_ID).shadowRoot.querySelector('.apply').click();
  assert.equal(applied, 1);
});

test('dismissing calls back and the card can be removed', () => {
  let dismissed = 0;
  const card = showCard(OFFER, { onApply: noop, onDismiss: () => dismissed++ });
  document.getElementById(HOST_ID).shadowRoot.querySelector('.dismiss').click();
  assert.equal(dismissed, 1);
  card.remove();
  assert.equal(document.getElementById(HOST_ID), null);
  // ...and a later page can show a card again.
  assert.ok(showCard(OFFER, { onApply: noop, onDismiss: noop }));
});

test('the close button also dismisses', () => {
  let dismissed = 0;
  showCard(OFFER, { onApply: noop, onDismiss: () => dismissed++ });
  document.getElementById(HOST_ID).shadowRoot.querySelector('.close').click();
  assert.equal(dismissed, 1);
});

test('shows the code for manual entry when no field was found', () => {
  const card = showCard(OFFER, { onApply: noop, onDismiss: noop });
  card.setState('manual', { code: 'MOCK20' });
  const text = document.getElementById(HOST_ID).shadowRoot.textContent;
  assert.match(text, /MOCK20/);
  assert.match(text, /Couldn’t find/);
});

test('success state tells the user what happened', () => {
  const card = showCard(OFFER, { onApply: noop, onDismiss: noop });
  card.setState('success', { code: 'MOCK20', clicked: false });
  assert.match(document.getElementById(HOST_ID).shadowRoot.textContent, /Code inserted/);
});

test('offer text from data is escaped, never injected as HTML', () => {
  showCard({ ...OFFER, title: '<img src=x onerror=alert(1)>' }, { onApply: noop, onDismiss: noop });
  const shadow = document.getElementById(HOST_ID).shadowRoot;
  assert.equal(shadow.querySelector('img'), null, 'offer data must not become live markup');
});

test('a donation offer is never described as a discount', () => {
  showCard(DONATION_OFFER, { onApply: noop, onDismiss: noop });
  const shadow = document.getElementById(HOST_ID).shadowRoot;
  assert.doesNotMatch(shadow.querySelector('.apply').textContent, /discount/i,
    'the button must not promise a discount');
  assert.match(shadow.textContent, /won’t lower your price/i,
    'must say plainly that the price does not change');
});

test('a donation offer names the charity and says we keep none of it', () => {
  showCard(DONATION_OFFER, { onApply: noop, onDismiss: noop });
  const text = document.getElementById(HOST_ID).shadowRoot.textContent;
  assert.match(text, /Medical Aid for Palestinians/, 'must name where the money goes');
  assert.match(text, /keep none of it|100%/i, 'must say we keep none of the commission');
});

test('a donation offer thanks the shopper without claiming a saving', () => {
  const card = showCard(DONATION_OFFER, { onApply: noop, onDismiss: noop });
  card.setState('success', { code: 'GIVE100', clicked: true });
  const text = document.getElementById(HOST_ID).shadowRoot.textContent;
  assert.match(text, /funds a donation/i);
  assert.doesNotMatch(text, /confirms the discount/i, 'there is no discount to confirm');
});

test('a discount offer still says discount', () => {
  showCard(OFFER, { onApply: noop, onDismiss: noop });
  assert.match(document.getElementById(HOST_ID).shadowRoot.querySelector('.apply').textContent, /discount/i);
});

test('lives in a shadow root so the store CSS cannot reach it', () => {
  showCard(OFFER, { onApply: noop, onDismiss: noop });
  assert.ok(document.getElementById(HOST_ID).shadowRoot, 'card must be isolated in a shadow root');
});
