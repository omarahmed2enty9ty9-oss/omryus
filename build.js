/**
 * Build: bundle four entry points, generate the manifest, copy static files.
 *
 * The only clever bit is the manifest. Host permissions and content-script
 * matches are derived from offers.json, so the extension can never ask for
 * access to a site we do not have an offer for. Adding a merchant means editing
 * offers.json and running this again.
 */
import { build, context } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentScriptMatches, loadOffers } from './extension/src/shared/offers.js';

const root = dirname(fileURLToPath(import.meta.url));
const src = resolve(root, 'extension');
const out = resolve(root, 'dist');
const watch = process.argv.includes('--watch');

async function generateManifest() {
  const template = JSON.parse(await readFile(resolve(src, 'manifest.template.json'), 'utf8'));
  const { offers } = loadOffers(JSON.parse(await readFile(resolve(src, 'src/data/offers.json'), 'utf8')));

  // The stores that work out of the box, for everyone. Stores added later come
  // from the downloaded list and need the optional "shops you visit" grant.
  // The content script itself is registered at runtime by the service worker.
  const patterns = contentScriptMatches(offers);
  template.host_permissions = patterns;
  await writeFile(resolve(out, 'manifest.json'), JSON.stringify(template, null, 2));
  console.log(`manifest: ${patterns.length} host pattern(s)`);
}

const options = {
  entryPoints: {
    background: resolve(src, 'src/background/service-worker.js'),
    content: resolve(src, 'src/content/content.js'),
    'popup/popup': resolve(src, 'src/popup/popup.js'),
    'options/options': resolve(src, 'src/options/options.js'),
  },
  outdir: out,
  bundle: true,
  format: 'iife',
  target: 'chrome120',
  logLevel: 'info',
};

/** Dev-only: the harness that lets the fixtures run without installing anything. */
async function buildHarness() {
  await build({
    entryPoints: { _harness: resolve(root, 'mock-store/harness/main.js') },
    outdir: resolve(root, 'mock-store'),
    bundle: true,
    format: 'iife',
    target: 'chrome120',
    logLevel: 'silent',
  });
  console.log('harness: mock-store/_harness.js (dev only, not shipped)');
}

async function copyStatic() {
  await cp(resolve(src, 'src/popup/popup.html'), resolve(out, 'popup/popup.html'));
  await cp(resolve(src, 'src/popup/popup.css'), resolve(out, 'popup/popup.css'));
  await cp(resolve(src, 'src/options/options.html'), resolve(out, 'options/options.html'));
  await cp(resolve(src, 'icons'), resolve(out, 'icons'), { recursive: true });
  // The options page borrows the popup stylesheet via ../popup/popup.css.
}

await rm(out, { recursive: true, force: true });
await mkdir(resolve(out, 'popup'), { recursive: true });
await mkdir(resolve(out, 'options'), { recursive: true });

if (watch) {
  const ctx = await context(options);
  await ctx.watch();
  await generateManifest();
  await copyStatic();
  console.log('watching… (re-run `npm run build` after editing manifest, html or offers.json)');
} else {
  await build(options);
  await generateManifest();
  await copyStatic();
  await buildHarness();
  console.log(`built -> ${out}`);
}
