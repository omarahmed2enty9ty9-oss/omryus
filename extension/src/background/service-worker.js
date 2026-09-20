/**
 * Background service worker.
 *
 * Owns all offer logic. The content script is deliberately dumb: it asks
 * "is there an offer for this URL?" and later "the user clicked Apply, what is
 * the code?". Keeping the rules here means swapping offers.json for an API
 * later does not touch any page-facing code.
 */
import { findOffersForUrl, isDonationOffer } from '../shared/offers.js';
import { LocalOfferSource } from './offer-source.js';
import { resolveAttribution } from './affiliate.js';
import { track } from './analytics.js';

const offerSource = new LocalOfferSource();

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') track('extension_installed');
});

/**
 * Find a usable offer for a URL, or null.
 * "Usable" also means we have an affiliate provider that permits it — an offer
 * we are not authorised to act on, including one that gives the shopper nothing,
 * is treated as if it did not exist.
 */
async function getUsableOffer(url) {
  const offers = await offerSource.getOffers();
  // First offer we are actually permitted to act on — a refused one (wrong
  // attribution mode, or no benefit to the shopper) is skipped, not fatal.
  return findOffersForUrl(offers, url).find((offer) => resolveAttribution(offer)) ?? null;
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
    isDonation: isDonationOffer(offer),
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

  /**
   * Dismiss closes the card for this page view only. It is deliberately not
   * remembered: the offer comes back next time the shopper reaches a checkout
   * where a code is available.
   */
  async DISMISS_OFFER() {
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
