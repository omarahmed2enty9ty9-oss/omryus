/**
 * Background service worker.
 *
 * Owns all offer logic. The content script is deliberately dumb: it asks
 * "is there an offer for this URL?" and later "the user clicked Apply, what is
 * the code?". Keeping the rules here means swapping offers.json for an API
 * later does not touch any page-facing code.
 */
import { contentScriptMatches, findOffersForUrl, isDonationOffer } from '../shared/offers.js';
import { OfferSource } from './offer-source.js';
import { resolveAttribution } from './affiliate.js';
import { track } from './analytics.js';

const offerSource = new OfferSource();
const SCRIPT_ID = 'omryus-checkout';
const REFRESH_ALARM = 'refresh-offers';

/**
 * Run the content script on exactly the stores in the current list that we have
 * permission for. The broad "shops you visit" grant is optional, and even with
 * it the script is registered only for stores with a live offer, so on every
 * other site the extension is not loaded at all. Re-run whenever the list or
 * the permissions change.
 */
async function registerContentScript() {
  const allowed = [];
  for (const pattern of contentScriptMatches(await offerSource.getOffers())) {
    if (await chrome.permissions.contains({ origins: [pattern] })) allowed.push(pattern);
  }
  const [existing] = await chrome.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] });
  if (allowed.length === 0) {
    if (existing) await chrome.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
    return;
  }
  const script = { id: SCRIPT_ID, matches: allowed, js: ['content.js'], runAt: 'document_idle', allFrames: false };
  if (existing) await chrome.scripting.updateContentScripts([script]);
  else await chrome.scripting.registerContentScripts([script]);
}

async function refreshOffers() {
  try {
    await offerSource.refresh();
  } catch (error) {
    console.warn('[Omryus] offer list not refreshed, keeping the last good copy:', String(error));
  }
  await registerContentScript();
}

/** Alarms can be cleared when the browser restarts, so this runs at every startup. */
async function ensureRefreshAlarm() {
  if (!(await chrome.alarms.get(REFRESH_ALARM))) {
    await chrome.alarms.create(REFRESH_ALARM, { periodInMinutes: 12 * 60 });
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    track('extension_installed');
    // Onboarding: the one-time "shops you visit" choice lives on the settings page.
    chrome.runtime.openOptionsPage();
  }
  ensureRefreshAlarm();
  refreshOffers();
});
chrome.runtime.onStartup.addListener(() => {
  ensureRefreshAlarm();
  refreshOffers();
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === REFRESH_ALARM) refreshOffers();
});
chrome.permissions.onAdded.addListener(() => registerContentScript());
chrome.permissions.onRemoved.addListener(() => registerContentScript());

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
