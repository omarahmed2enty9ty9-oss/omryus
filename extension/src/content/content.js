/**
 * Content script: the only part of the extension that touches the page.
 *
 * It knows nothing about which merchants we support or what the codes are. It
 * asks the service worker, shows a card, and — only if the user clicks Apply —
 * asks for the code and puts it in the box.
 */
import { waitForField } from './find-field.js';
import { insertCode, clickApplyButton } from './insert-code.js';
import { showCard } from './offer-card.js';

let currentOffer = null;
let card = null;

async function applyOffer() {
  card?.setState('applying');
  const result = await chrome.runtime.sendMessage({
    type: 'APPLY_OFFER',
    offerId: currentOffer.id,
    url: location.href,
  });

  if (!result || result.error) {
    card?.setState('error', { message: result?.error });
    return;
  }

  // The box may not exist yet — wait for it before giving up.
  const field = await waitForField(result.fieldSelectors);
  if (!field) {
    card?.setState('manual', { code: result.code });
    return;
  }

  const inserted = insertCode(field, result.code);
  if (!inserted) {
    card?.setState('manual', { code: result.code });
    return;
  }

  const clicked = clickApplyButton(result.applyButtonSelectors);
  card?.setState('success', { code: result.code, clicked });
}

async function dismissOffer() {
  await chrome.runtime.sendMessage({ type: 'DISMISS_OFFER', offerId: currentOffer.id });
  card?.remove();
  card = null;
}

async function start() {
  // Only the top frame shows a card. Without this, a same-origin iframe on the
  // cart page would render a second one.
  if (window.top !== window) return;

  const response = await chrome.runtime.sendMessage({ type: 'GET_OFFER', url: location.href });
  if (!response?.offer) return;

  currentOffer = response.offer;
  card = showCard(currentOffer, { onApply: applyOffer, onDismiss: dismissOffer });
  if (card) chrome.runtime.sendMessage({ type: 'OFFER_DISPLAYED', offerId: currentOffer.id });
}

// The popup asks us what is going on here, so the popup needs no tab or host
// permissions of its own. No content script running = site not supported.
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'POPUP_STATE') {
    sendResponse({ supported: true, offer: currentOffer });
    return false;
  }
  if (message?.type === 'POPUP_APPLY' && currentOffer) {
    if (!card) card = showCard(currentOffer, { onApply: applyOffer, onDismiss: dismissOffer });
    applyOffer();
    sendResponse({ ok: true });
    return false;
  }
  return false;
});

start().catch((error) => console.error('[Omryus]', error));
