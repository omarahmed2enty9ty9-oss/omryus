/**
 * Popup.
 *
 * Note what is NOT here: any call to chrome.tabs that reads a URL. We get the
 * active tab's id (allowed without permissions) and message the content script.
 * If nothing answers, the site is not one we support — and we never learn what
 * site it was.
 */
import { BRAND, DONATION } from '../shared/brand.js';

const statusEl = document.getElementById('status');

function renderUnsupported() {
  statusEl.innerHTML = `<h1>No offers here</h1>
    <p class="muted">We don't have a partner code for this page. Nothing was read from it.</p>`;
}

function renderOffer(offer) {
  const badge = offer.source === 'mock' ? '<div class="badge">MOCK OFFER — DEMO DATA</div>' : '';
  const body = offer.isDonation
    ? `This code won't lower your price. We donate 100% of the commission to ${DONATION.charity}.`
    : `Partner code available for ${offer.merchantName}.`;
  statusEl.innerHTML = `${badge}
    <h1>${offer.title}</h1>
    <p class="muted">${body}</p>
    <button id="apply">${offer.isDonation ? 'Add the code' : 'Apply discount'}</button>`;
  document.getElementById('apply').addEventListener('click', async (event) => {
    event.target.disabled = true;
    event.target.textContent = 'Adding…';
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { type: 'POPUP_APPLY' });
    window.close();
  });
}

function renderSupportedNoOffer() {
  statusEl.innerHTML = `<h1>Supported store</h1>
    <p class="muted">No live offer for this page right now.</p>`;
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return renderUnsupported();
  try {
    const state = await chrome.tabs.sendMessage(tab.id, { type: 'POPUP_STATE' });
    if (!state?.supported) return renderUnsupported();
    return state.offer ? renderOffer(state.offer) : renderSupportedNoOffer();
  } catch {
    // No content script on this page: we have no host permission for it.
    return renderUnsupported();
  }
}

document.getElementById('options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
document.getElementById('privacy').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: BRAND.privacyUrl });
});

init();
