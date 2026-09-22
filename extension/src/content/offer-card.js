/**
 * The little card in the corner of the page.
 *
 * It lives inside a shadow root so the store's CSS cannot break it and our CSS
 * cannot break the store. It never covers the page, never blocks clicks
 * elsewhere, and always has a dismiss button.
 */
import { BRAND, DOM_PREFIX, DONATION, donationRecipient } from '../shared/brand.js';

const HOST_ID = `${DOM_PREFIX}-offer-card`;

const STYLES = `
  :host { all: initial; }
  .card {
    position: fixed; right: 16px; bottom: 16px; z-index: 2147483000;
    width: 320px; max-width: calc(100vw - 32px);
    box-sizing: border-box; padding: 16px;
    background: #fff; color: #12233b;
    border: 1px solid #dce6ea; border-radius: 12px;
    box-shadow: 0 8px 28px rgba(14, 33, 56, .18);
    font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  .row { display: flex; align-items: flex-start; gap: 10px; }
  .dot { width: 8px; height: 8px; border-radius: 50%; background: ${BRAND.accent}; margin-top: 6px; flex: none; }
  h1 { margin: 0 0 2px; font-size: 15px; font-weight: 600; }
  p { margin: 0; color: #4a5a6e; font-size: 13px; }
  .meta { margin-top: 8px; font-size: 11px; color: #7c8b9b; }
  .badge {
    display: inline-block; margin-bottom: 8px; padding: 2px 6px; border-radius: 4px;
    background: #fdf1dc; color: #8a5a08; font-size: 11px; font-weight: 600;
  }
  .actions { display: flex; gap: 8px; margin-top: 14px; }
  button {
    font: inherit; font-size: 13px; font-weight: 500;
    padding: 8px 14px; border-radius: 8px; cursor: pointer; border: 1px solid transparent;
  }
  .apply { background: ${BRAND.color}; color: #fff; flex: 1; }
  .apply:hover { background: ${BRAND.colorDark}; }
  .apply:disabled { opacity: .6; cursor: default; }
  .dismiss { background: #fff; color: #4a5a6e; border-color: #dce6ea; }
  .dismiss:hover { background: #f4f9fa; }
  code {
    font: 13px ui-monospace, Menlo, Consolas, monospace;
    background: #edf3f5; padding: 2px 6px; border-radius: 4px; user-select: all;
  }
  .close {
    position: absolute; top: 8px; right: 8px; padding: 4px 8px;
    background: none; color: #7c8b9b; font-size: 16px; line-height: 1;
  }
`;

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/**
 * Show the card. Safe to call twice — the second call is ignored, which is what
 * stops a re-running content script from stacking duplicate notifications.
 * @returns {{setState: (state: string, data?: object) => void, remove: () => void}|null}
 */
export function showCard(offer, { onApply, onDismiss }) {
  if (document.getElementById(HOST_ID)) return null;

  const host = document.createElement('div');
  host.id = HOST_ID;
  const shadow = host.attachShadow({ mode: 'open' });
  const style = document.createElement('style');
  style.textContent = STYLES;
  const card = document.createElement('div');
  card.className = 'card';
  shadow.append(style, card);

  const remove = () => host.remove();

  const render = (state, data = {}) => {
    const mockBadge = offer.source === 'mock' ? '<div class="badge">MOCK OFFER — DEMO DATA</div>' : '';
    const tested = offer.lastTested ? `Code last checked ${escapeHtml(offer.lastTested)}. ` : '';

    if (state === 'offer') {
      // A donation-funded code saves the shopper nothing, so it must never be
      // described as a discount — not in the wording, not on the button.
      const body = offer.isDonation
        ? `<p>This code won’t lower your price — so we keep none of it.
             The whole commission goes to ${escapeHtml(donationRecipient())}.</p>`
        : `<p>We have a partner code for ${escapeHtml(offer.merchantName)}.</p>`;
      const disclosure = offer.isDonation
        ? `We pass on the whole commission for codes like this one. Codes that do save you money are how ${BRAND.name} stays free.`
        : `Using this code supports ${BRAND.name}, at no extra cost to you.`;

      card.innerHTML = `
        <button class="close" aria-label="Close">&times;</button>
        ${mockBadge}
        <div class="row">
          <span class="dot"></span>
          <div>
            <h1>${escapeHtml(offer.title)}</h1>
            ${body}
          </div>
        </div>
        <div class="meta">${tested}${escapeHtml(offer.terms)} ${disclosure}</div>
        <div class="actions">
          <button class="apply">${offer.isDonation ? 'Add the code' : 'Apply discount'}</button>
          <button class="dismiss">${offer.isDonation ? 'No thanks' : 'Dismiss'}</button>
        </div>`;
      card.querySelector('.apply').addEventListener('click', onApply);
      card.querySelector('.dismiss').addEventListener('click', onDismiss);
      card.querySelector('.close').addEventListener('click', onDismiss);
      return;
    }

    if (state === 'applying') {
      card.innerHTML = `<div class="row"><span class="dot"></span><div><h1>Applying…</h1>
        <p>Looking for the discount box on this page.</p></div></div>`;
      return;
    }

    if (state === 'success') {
      const next = offer.isDonation
        ? (data.clicked ? 'We pressed Apply for you.' : 'Press the store’s Apply button to confirm it.')
        : (data.clicked ? 'We pressed Apply for you — the store confirms the discount.' : 'Press the store’s Apply button to confirm it.');
      const thanks = offer.isDonation
        ? `<p class="meta">Thank you — the commission on this order goes to ${escapeHtml(donationRecipient())}.</p>`
        : '';
      card.innerHTML = `
        <button class="close" aria-label="Close">&times;</button>
        <div class="row"><span class="dot"></span><div>
          <h1>Code inserted</h1>
          <p><code>${escapeHtml(data.code)}</code> is in the code box. ${escapeHtml(next)}</p>
          ${thanks}
        </div></div>`;
      card.querySelector('.close').addEventListener('click', remove);
      return;
    }

    if (state === 'manual') {
      card.innerHTML = `
        <button class="close" aria-label="Close">&times;</button>
        <div class="row"><span class="dot"></span><div>
          <h1>Couldn’t find the discount box</h1>
          <p>Copy it in yourself: <code>${escapeHtml(data.code)}</code></p>
        </div></div>`;
      card.querySelector('.close').addEventListener('click', remove);
      return;
    }

    card.innerHTML = `
      <button class="close" aria-label="Close">&times;</button>
      <div class="row"><span class="dot"></span><div>
        <h1>That didn’t work</h1>
        <p>${escapeHtml(data.message ?? 'The offer is no longer available.')}</p>
      </div></div>`;
    card.querySelector('.close').addEventListener('click', remove);
  };

  render('offer');
  (document.body ?? document.documentElement).appendChild(host);
  return { setState: render, remove };
}

export { HOST_ID };
