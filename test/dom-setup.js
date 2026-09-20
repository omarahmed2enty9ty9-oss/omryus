/**
 * A jsdom window installed as the globals a content script expects.
 * Kept in one place so the DOM tests stay readable.
 */
import { JSDOM } from 'jsdom';

export function setupDom(html = '<body></body>') {
  const dom = new JSDOM(html, { url: 'https://testshop.example/cart', pretendToBeVisual: true });
  for (const key of [
    'window', 'document', 'Event', 'MutationObserver', 'HTMLElement', 'HTMLInputElement',
    'HTMLTextAreaElement', 'customElements', 'Node', 'NodeFilter',
  ]) {
    globalThis[key] = key === 'window' ? dom.window : dom.window[key];
  }
  return dom;
}
