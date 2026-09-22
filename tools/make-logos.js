/**
 * Render logo exports for places that want a raster file on a white ground —
 * affiliate network profiles, the Chrome Web Store listing, press.
 *
 *   npm run logos
 *
 * Chrome rasterises (it is the engine that will actually display the SVG, and
 * ImageMagick without librsvg silently mangles strokes and circles), then
 * ImageMagick trims and mounts. Trimming the rendered alpha is how the mark
 * gets centred: SVG getBBox() ignores stroke width, so measuring the geometry
 * instead cuts the magnifier handle off at the corner.
 *
 * Outputs to brand/:
 *   omryus-mark-1024.png        square, white
 *   omryus-mark-2048.png        square, white
 *   omryus-mark-2048-alpha.png  square, transparent
 *   omryus-lockup-2048.png      mark + wordmark, white, horizontal
 */
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'brand');
const PORT = 9414;
const RENDER = 2400; // oversample, then downscale for clean edges

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
const magick = ['/usr/bin/magick', '/usr/bin/convert'].find(existsSync);
if (!magick) {
  console.error('ImageMagick not found; needed to trim and mount the renders.');
  process.exit(1);
}

const markSvg = readFileSync(join(root, 'extension/icons/mark.svg'), 'utf8')
  .replace(/<\?xml[^>]*\?>/, '')
  .trim();
const fontB64 = readFileSync(join(outDir, 'HankenGrotesk.woff2')).toString('base64');

const profile = mkdtempSync(join(tmpdir(), 'omryus-logos-'));
const proc = spawn(chrome, [
  `--user-data-dir=${profile}`,
  `--remote-debugging-port=${PORT}`,
  '--headless=new', '--no-first-run', '--hide-scrollbars', '--force-color-profile=srgb',
  'about:blank',
], { stdio: 'ignore' });

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const targets = await (await fetch(`http://localhost:${PORT}/json/list`)).json();
      const p = targets.find((t) => t.type === 'page');
      if (p) return p;
    } catch { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error('Chrome did not start');
}

const target = await connect();
const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) pending.get(m.id)(m);
};
await new Promise((r) => (ws.onopen = r));
const rpc = (method, params = {}) =>
  new Promise((res) => { pending.set(++id, res); ws.send(JSON.stringify({ id, method, params })); });

/** Screenshot a data-URL page on a transparent backdrop. */
async function shoot(html, w, h, file) {
  await rpc('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await rpc('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
  await rpc('Page.navigate', { url: 'data:text/html;charset=utf-8,' + encodeURIComponent(html) });
  await new Promise((r) => setTimeout(r, 700));
  const { result } = await rpc('Page.captureScreenshot', { format: 'png', fromSurface: true });
  writeFileSync(file, Buffer.from(result.data, 'base64'));
}

mkdirSync(outDir, { recursive: true });
const tmp = join(outDir, '.tmp-render.png');
const trimmed = join(outDir, '.tmp-mark.png');

// --- the mark, trimmed to its painted ink ---
await shoot(
  `<!doctype html><meta charset="utf-8"><style>*{margin:0;padding:0}
   html,body{width:${RENDER}px;height:${RENDER}px}
   svg{display:block;width:${RENDER}px;height:${RENDER}px}</style>${markSvg}`,
  RENDER, RENDER, tmp,
);
execFileSync(magick, [tmp, '-trim', '+repage', trimmed]);

for (const size of [1024, 2048]) {
  const inner = Math.round(size * 0.82);
  execFileSync(magick, [
    trimmed, '-resize', `${inner}x${inner}`,
    '-background', 'white', '-gravity', 'center', '-extent', `${size}x${size}`,
    '-alpha', 'remove', '-alpha', 'off',
    join(outDir, `omryus-mark-${size}.png`),
  ]);
  console.log(`brand/omryus-mark-${size}.png  ${size}x${size}  white`);
}
execFileSync(magick, [
  trimmed, '-resize', '1680x1680', '-background', 'none',
  '-gravity', 'center', '-extent', '2048x2048',
  join(outDir, 'omryus-mark-2048-alpha.png'),
]);
console.log('brand/omryus-mark-2048-alpha.png  2048x2048  transparent');

// --- horizontal lockup: mark + wordmark ---
const LOCK_W = 2048, LOCK_H = 640;
await shoot(
  `<!doctype html><meta charset="utf-8"><style>
    @font-face{font-family:"Hanken Grotesk";src:url(data:font/woff2;base64,${fontB64}) format("woff2");
      font-weight:100 900;font-style:normal;font-display:block}
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${LOCK_W}px;height:${LOCK_H}px}
    .stage{width:${LOCK_W}px;height:${LOCK_H}px;display:flex;align-items:center;
      justify-content:center;gap:56px}
    svg{display:block;width:420px;height:420px}
    .word{font:700 190px/1 "Hanken Grotesk",system-ui,sans-serif;letter-spacing:.012em;
      text-transform:uppercase;color:#191722}
  </style><div class="stage">${markSvg}<span class="word">Omryus</span></div>`,
  LOCK_W, LOCK_H, tmp,
);
execFileSync(magick, [
  tmp, '-trim', '+repage', '-bordercolor', 'none', '-border', '90',
  '-background', 'white', '-alpha', 'remove', '-alpha', 'off',
  join(outDir, 'omryus-lockup-2048.png'),
]);
console.log('brand/omryus-lockup-2048.png  white');

rmSync(tmp, { force: true });
rmSync(trimmed, { force: true });
ws.close();
proc.kill();
// Chrome is still flushing its profile when it dies; rmSync races it otherwise.
await new Promise((r) => setTimeout(r, 600));
rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
