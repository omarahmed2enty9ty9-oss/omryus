import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { setupDom } from './dom-setup.js';

let insertCode, clickApplyButton;

beforeEach(async () => {
  setupDom();
  ({ insertCode, clickApplyButton } = await import('../extension/src/content/insert-code.js?' + Math.random()));
});

test('inserts the code and fires bubbling input and change events', () => {
  document.body.innerHTML = `<form><input name="coupon"></form>`;
  const input = document.querySelector('input');
  const seen = [];
  document.addEventListener('input', () => seen.push('input'));
  document.addEventListener('change', () => seen.push('change'));

  assert.equal(insertCode(input, 'MOCK20'), true);
  assert.equal(input.value, 'MOCK20');
  assert.deepEqual(seen, ['input', 'change'], 'events must bubble to the document');
});

test('a controlled component sees the new value', () => {
  // Stand-in for React/Vue: the framework only learns about changes via events.
  document.body.innerHTML = `<input name="coupon">`;
  const input = document.querySelector('input');
  let frameworkState = '';
  input.addEventListener('input', () => { frameworkState = input.value; });

  insertCode(input, 'MOCK20');
  assert.equal(frameworkState, 'MOCK20', 'framework state must be updated, not just the DOM');
});

test('works on a textarea too', () => {
  document.body.innerHTML = `<textarea name="coupon"></textarea>`;
  const el = document.querySelector('textarea');
  assert.equal(insertCode(el, 'MOCK20'), true);
  assert.equal(el.value, 'MOCK20');
});

test('clicks the store apply button when one is configured', () => {
  document.body.innerHTML = `<button name="apply-coupon">Apply</button>`;
  let clicked = false;
  document.querySelector('button').addEventListener('click', () => { clicked = true; });
  assert.equal(clickApplyButton(["button[name='apply-coupon']"]), true);
  assert.equal(clicked, true);
});

test('reports false when there is no apply button to click', () => {
  document.body.innerHTML = `<p>no button</p>`;
  assert.equal(clickApplyButton(["button[name='apply-coupon']"]), false);
});

test('does not click a disabled apply button', () => {
  document.body.innerHTML = `<button name="apply-coupon" disabled>Apply</button>`;
  assert.equal(clickApplyButton(["button[name='apply-coupon']"]), false);
});
