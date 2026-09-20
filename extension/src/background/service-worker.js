/**
 * Background service worker.
 *
 * Owns all offer logic. The content script is deliberately dumb: it asks
 * "is there an offer for this URL?" and later "the user clicked Apply, what is
 * the code?". Keeping the rules here means swapping offers.json for an API
 * later does not touch any page-facing code.
 */
import { findOfferForUrl, isDismissed } from '../shared/offers.js';
import { LocalOfferSource } from './offer-source.js';
import { resolveAttribution } from './affiliate.js';
import { track } from './analytics.js';

const offerSource = new LocalOfferSource();
const DISMISSED_KEY = 'dismissed';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') track('extension_installed');
});

/** Offer the user has silenced recently? */
async function isSilenced(offerId) {
  const { [DISMISSED_KEY]: dismissed = {} } = await chrome.storage.local.get(DISMISSED_KEY);
  return isDismissed(dismissed[offerId]);
}

async function silence(offerId) {
  const { [DISMISSED_KEY]: dismissed = {} } = await chrome.storage.local.get(DISMISSED_KEY);
  dismissed[offerId] = Date.now();
  await chrome.storage.local.set({ [DISMISSED_KEY]: dismissed });
}

/**
 * Find a usable offer for a URL, or null.
 * "Usable" also means we have an affiliate provider that permits it — an offer
 * we are not authorised to act on is treated as if it did not exist.
 */
async function getUsableOffer(url) {
  const offers = await offerSource.getOffers();
  const offer = findOfferForUrl(offers, url);
  if (!offer) return null;
  if (!resolveAttribution(offer)) return null;
  if (await isSilenced(offer.id)) return null;
  return offer;
}

/**
 * What the content script is allowed to know before the user clicks Apply:
 * enough to describe the offer, but NOT the code itself. The code only crosses
 * into the page after an explicit user action.
 */
function toCardData(offer) {
  return {
    id: offer.id,
    merchantName: offer.merchant.name,
    title: offer.title,
    terms: offer.terms ?? '',
    source: offer.source,
    lastTested: offer.lastTested ?? null,
  };
}

const handlers = {
  async GET_OFFER({ url }) {
    const offer = await getUsableOffer(url);
    return { offer: offer ? toCardData(offer) : null };
  },

  /** Called only in response to the user clicking Apply. */
  async APPLY_OFFER({ offerId, url }) {
    const offer = await getUsableOffer(url);
    if (!offer || offer.id !== offerId) return { error: 'offer no longer available' };
    const attribution = resolveAttribution(offer);
    if (!attribution) return { error: 'not authorised to apply this offer' };
    await track('offer_applied');
    return {
      code: attribution.code,
      fieldSelectors: offer.checkout.fieldSelectors,
      applyButtonSelectors: offer.checkout.applyButtonSelectors ?? [],
    };
  },

  async OFFER_DISPLAYED() {
    await track('offer_displayed');
    return { ok: true };
  },

  async DISMISS_OFFER({ offerId }) {
    await silence(offerId);
    await track('offer_dismissed');
    return { ok: true };
  },
};

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const handler = handlers[message?.type];
  if (!handler) return false;
  handler(message).then(sendResponse, (error) => {
    console.error('[Omryus]', message.type, error);
    sendResponse({ error: String(error) });
  });
  return true; // keep the channel open for the async reply
});
