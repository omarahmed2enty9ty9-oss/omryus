/**
 * Launch Chrome with the built extension already loaded, skipping the
 * chrome://extensions file picker.
 *
 * Looks for a system Chrome first, then the userspace Chrome for Testing in
 * ~/.cache/omryus-chrome (used when there is no root access to apt-install one).
 */
import { spawn } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const CANDIDATES = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  join(homedir(), '.cache/omryus-chrome/chrome-linux64/chrome'),
];

const chrome = CANDIDATES.find(existsSync);
if (!chrome) {
  console.error('No Chrome found. Install one, or download Chrome for Testing:\n' +
    '  https://googlechromelabs.github.io/chrome-for-testing/\n' +
    `  and unzip it to ${join(homedir(), '.cache/omryus-chrome')}`);
  process.exit(1);
}
if (!existsSync(join(dist, 'manifest.json'))) {
  console.error('dist/manifest.json missing — run `npm run build` first.');
  process.exit(1);
}

// A dedicated profile, so this never touches your real browser data. It is kept
// between runs on purpose: dismissals and counters live in chrome.storage, and
// you cannot test that they survive a restart with a fresh profile every time.
// Pass --fresh to start clean.
const profile = join(homedir(), '.cache/omryus-chrome/profile');
const fresh = process.argv.includes('--fresh');
if (fresh) rmSync(profile, { recursive: true, force: true });
console.log(`${chrome}\nextension: ${dist}\nprofile:   ${profile}${fresh ? ' (wiped)' : ''}`);

spawn(chrome, [
  `--user-data-dir=${profile}`,
  `--load-extension=${dist}`,
  `--disable-extensions-except=${dist}`,
  '--no-first-run',
  '--no-default-browser-check',
  ...process.argv.slice(2).filter((a) => a !== '--fresh'),
  'http://localhost:8642/',
], { detached: true, stdio: 'ignore' }).unref();
