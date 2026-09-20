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

const root = dirname(fileURLToPath(import.meta.url));
const src = resolve(root, 'extension');
const out = resolve(root, 'dist');
const watch = process.argv.includes('--watch');

/** "shop.com" -> https on the domain and its subdomains. localhost stays http. */
function matchPatternsFor(domain) {
  const d = domain.toLowerCase().replace(/^www\./, '');
  if (d === 'localhost' || d.endsWith('.localhost')) return [`http://${d}/*`];
  return [`https://${d}/*`, `https://*.${d}/*`];
}

async function generateManifest() {
  const template = JSON.parse(await readFile(resolve(src, 'manifest.template.json'), 'utf8'));
  const offers = JSON.parse(await readFile(resolve(src, 'src/data/offers.json'), 'utf8'));

  // Only offers that can actually fire. We do not ask for access to a site
  // whose offer is switched off or already expired.
  const now = Date.now();
  const usable = offers.filter((o) => o?.active !== false && !(o?.expiresAt && Date.parse(o.expiresAt) < now));
  const patterns = [...new Set(usable.flatMap((o) => (o?.merchant?.domains ?? []).flatMap(matchPatternsFor)))].sort();
  if (patterns.length === 0) throw new Error('offers.json produced no host patterns — refusing to build');

  template.host_permissions = patterns;
  template.content_scripts[0].matches = patterns;
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
