/**
 * Loads the dev harness when the URL has ?demo — so the same fixture pages work
 * both for the harness AND for a real installed extension (without ?demo),
 * with no risk of two cards appearing at once.
 */
if (new URLSearchParams(location.search).has('demo')) {
  const banner = document.createElement('div');
  banner.textContent =
    'DEMO MODE — real content script, simulated service worker. Not a test of the installed extension.';
  banner.style.cssText =
    'position:sticky;top:0;z-index:9999;background:#fff4d6;color:#8a6100;' +
    'font:12px/1.4 system-ui,sans-serif;padding:8px 12px;border-bottom:1px solid #ffe2a8;margin:-40px -20px 20px';
  document.addEventListener('DOMContentLoaded', () => document.body.prepend(banner));

  const script = document.createElement('script');
  script.src = '/_harness.js';
  document.head.appendChild(script);
}
