/**
 * Rasterise extension/icons/mark.svg into the PNG sizes Chrome needs.
 *
 * Rendering is done by Chrome itself, so what ships is exactly what a browser
 * draws — no second SVG renderer to disagree with it. (ImageMagick is available
 * on some machines but without librsvg it silently mangles strokes and circles,
 * which is worse than not rendering at all.)
 *
 *   npm run icons
 *
 * Needs a Chrome binary; it looks in the same places as tools/launch-chrome.js.
 */
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const iconDir = join(root, 'extension/icons');
// Small sizes get a simplified drawing — the full mark turns to porridge at 16px.
const SOURCES = { 16: 'mark-small.svg', 32: 'mark-small.svg', 48: 'mark.svg', 128: 'mark.svg' };
const PORT = 9412;

const CANDIDATES = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  join(homedir(), '.cache/omryus-chrome/chrome-linux64/chrome'),
];

const chrome = CANDIDATES.find(existsSync);
if (!chrome) {
  console.error('No Chrome found — see tools/launch-chrome.js for where it looks.');
  process.exit(1);
}

const profile = mkdtempSync(join(tmpdir(), 'omryus-icons-'));
const proc = spawn(chrome, [
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${PORT}`,
  '--headless=new',
  '--no-first-run',
  '--hide-scrollbars',
  '--force-color-profile=srgb',
  'about:blank',
], { stdio: 'ignore' });

/** Wait for the debugging port to answer. */
async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const targets = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
      const page = targets.find((t) => t.type === 'page');
      if (page) return page;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Chrome did not start');
}

const page = await connect();
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) pending.get(m.id)(m);
};
await new Promise((r) => (ws.onopen = r));
const rpc = (method, params = {}) =>
  new Promise((res) => { pending.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });

// Transparent backdrop, so the PNGs have real alpha.
await rpc('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
mkdirSync(iconDir, { recursive: true });
let loaded = null;
for (const [size, file] of Object.entries(SOURCES).map(([s, f]) => [Number(s), f])) {
  if (file !== loaded) {
    await rpc('Page.navigate', { url: `file://${join(iconDir, file)}` });
    await new Promise((r) => setTimeout(r, 400));
    loaded = file;
  }
  await rpc('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false });
  // The SVG has width/height attributes; override them so it fills the viewport.
  await rpc('Runtime.evaluate', {
    expression: `(() => { const s = document.querySelector('svg');
      s.setAttribute('width', '${size}'); s.setAttribute('height', '${size}');
      document.documentElement.style.margin = '0'; document.body.style.margin = '0'; })()`,
  });
  await new Promise((r) => setTimeout(r, 120));
  const { result } = await rpc('Page.captureScreenshot', { format: 'png', fromSurface: true });
  writeFileSync(join(iconDir, `icon${size}.png`), Buffer.from(result.data, 'base64'));
  console.log(`icons/icon${size}.png  (from ${file})`);
}

// The site header and favicon render the mark at ~16-30px, which is what the
// small variant is for. mark.svg is the one to reach for if it ever appears large.
copyFileSync(join(iconDir, 'mark-small.svg'), join(root, 'site/icon.svg'));
console.log('site/icon.svg  (copied from mark-small.svg)');

ws.close();
proc.kill();
rmSync(profile, { recursive: true, force: true });
