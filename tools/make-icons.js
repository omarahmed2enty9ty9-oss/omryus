/**
 * Generate the extension icons with no dependencies.
 *
 * The mark is a rounded square in the brand colour with a white ring — an "O".
 * Written as raw PNG with zlib from the standard library, because adding an
 * image toolchain to draw one circle would be silly.
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND } from '../extension/src/shared/brand.js';

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '../extension/icons');
const SIZES = [16, 32, 48, 128];

const hexToRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const BG = hexToRgb(BRAND.color);

function crc32(buf) {
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/** Coverage of a pixel by a shape, sampled 3x3 so the edges are not jagged. */
function coverage(x, y, test) {
  let hits = 0;
  for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) if (test(x + (sx + 0.5) / 3, y + (sy + 0.5) / 3)) hits++;
  return hits / 9;
}

function render(size) {
  const r = size * 0.22; // corner radius
  const ringOuter = size * 0.30;
  const ringInner = size * 0.17;
  const cx = size / 2;
  const cy = size / 2;

  const inRoundedSquare = (x, y) => {
    const dx = Math.max(r - x, 0, x - (size - r));
    const dy = Math.max(r - y, 0, y - (size - r));
    return dx * dx + dy * dy <= r * r;
  };
  const inRing = (x, y) => {
    const d = Math.hypot(x - cx, y - cy);
    return d <= ringOuter && d >= ringInner;
  };

  // One filter byte (0) + RGBA per pixel, per row.
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0;
    for (let x = 0; x < size; x++) {
      const bg = coverage(x, y, inRoundedSquare);
      const ring = coverage(x, y, inRing) * bg;
      // White ring composited over the brand colour, the whole thing masked by bg.
      raw[p++] = Math.round(BG[0] * (1 - ring) + 255 * ring);
      raw[p++] = Math.round(BG[1] * (1 - ring) + 255 * ring);
      raw[p++] = Math.round(BG[2] * (1 - ring) + 255 * ring);
      raw[p++] = Math.round(bg * 255);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });
for (const size of SIZES) {
  writeFileSync(resolve(outDir, `icon${size}.png`), render(size));
  console.log(`icons/icon${size}.png`);
}

// Same mark as SVG, for the landing page.
writeFileSync(
  resolve(outDir, 'icon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <rect width="128" height="128" rx="28" fill="${BRAND.color}"/>
  <path d="M64 25a39 39 0 1 0 0 78 39 39 0 0 0 0-78zm0 17a22 22 0 1 1 0 44 22 22 0 0 1 0-44z" fill="#fff"/>
</svg>\n`,
);
console.log('icons/icon.svg');
