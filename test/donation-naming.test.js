import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DONATION, donationRecipient } from '../extension/src/shared/brand.js';

/**
 * Naming a charity in marketing makes us a commercial participator under the
 * Charities Act 1992, which needs their written agreement BEFORE the
 * arrangement starts. Donating without naming them is fine; advertising with
 * their name is not. These tests stop the name leaking out before the
 * agreement exists.
 */

test('the recipient is unnamed while the agreement is unsigned', () => {
  assert.equal(DONATION.agreed, false, 'flip this only when the agreement is signed');
  assert.equal(donationRecipient(), 'charity');
  assert.doesNotMatch(donationRecipient(), /Medical Aid|Palestinians/i);
});

test('flipping the flag names the charity everywhere at once', () => {
  const original = DONATION.agreed;
  try {
    DONATION.agreed = true;
    assert.equal(donationRecipient(), DONATION.charity);
  } finally {
    DONATION.agreed = original;
  }
});

test('the public site names no charity while the agreement is unsigned', () => {
  if (DONATION.agreed) return; // once agreed, naming is exactly what we want
  // fileURLToPath, not .pathname — the project path contains a space.
  const dir = fileURLToPath(new URL('../site/', import.meta.url));
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(join(dir, file), 'utf8');
    assert.doesNotMatch(html, /Medical Aid for Palestinians/i,
      `${file} names the charity before the agreement exists`);
    assert.doesNotMatch(html, /map\.org\.uk/i,
      `${file} links the charity before the agreement exists`);
  }
});
