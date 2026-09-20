import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom } from './dom-setup.js';

const SELECTORS = ["input[name='coupon']", '#promo-code'];
let queryDeep, waitForField;

beforeEach(async () => {
  setupDom();
  ({ queryDeep, waitForField } = await import('../extension/src/content/find-field.js?' + Math.random()));
});

test('finds a coupon field that is already on the page', () => {
  document.body.innerHTML = `<input name="coupon">`;
  assert.equal(queryDeep(SELECTORS)?.name, 'coupon');
});

test('returns null when there is no coupon field', () => {
  document.body.innerHTML = `<p>Nothing here</p><input name="email" type="email">`;
  assert.equal(queryDeep(SELECTORS), null);
});

test('never writes into a password field, even if a selector matches it', () => {
  document.body.innerHTML = `<input name="coupon" type="password">`;
  assert.equal(queryDeep(SELECTORS), null, 'password field must be skipped');
});

test('skips card fields identified by autocomplete', () => {
  document.body.innerHTML = `<input id="promo-code" autocomplete="cc-number">`;
  assert.equal(queryDeep(SELECTORS), null);
});

test('skips disabled and readonly fields', () => {
  document.body.innerHTML = `<input name="coupon" disabled><input id="promo-code" readonly>`;
  assert.equal(queryDeep(SELECTORS), null);
});

test('a malformed selector in offer data does not break the others', () => {
  document.body.innerHTML = `<input name="coupon">`;
  assert.equal(queryDeep(['input[[[broken', ...SELECTORS])?.name, 'coupon');
});

test('finds a field inside an open shadow root', () => {
  document.body.innerHTML = `<div id="host"></div>`;
  const shadow = document.getElementById('host').attachShadow({ mode: 'open' });
  shadow.innerHTML = `<input name="coupon">`;
  assert.equal(queryDeep(SELECTORS)?.name, 'coupon');
});

test('waits for a coupon field that appears later', async () => {
  document.body.innerHTML = `<div id="slot"></div>`;
  setTimeout(() => {
    document.getElementById('slot').innerHTML = `<input id="promo-code">`;
  }, 50);
  const field = await waitForField(SELECTORS, { timeoutMs: 2000 });
  assert.equal(field?.id, 'promo-code');
});

test('gives up after the timeout instead of hanging', async () => {
  document.body.innerHTML = `<p>no form</p>`;
  assert.equal(await waitForField(SELECTORS, { timeoutMs: 60 }), null);
});
