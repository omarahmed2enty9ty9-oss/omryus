/**
 * DEV HARNESS — not part of the extension, never shipped in dist/.
 *
 * Stands in for the service worker so the real content script can run on a
 * plain web page, with no extension installed. It uses the *real* offer data
 * and the *real* matching, expiry and affiliate rules — only the chrome.*
 * messaging and storage are faked, so what you see is the genuine behaviour.
 *
 * What this canNOT tell you: whether the manifest, permissions, service worker
 * registration or popup work. Only loading dist/ in Chrome tests those.
 */
import offersJson from '../../extension/src/data/offers.json';
import { findOffersForUrl, loadOffers } from '../../extension/src/shared/offers.js';
import { resolveAttribution } from '../../extension/src/background/affiliate.js';

const { offers, errors } = loadOffers(offersJson);
if (errors.length) console.warn('[harness] invalid offers skipped:', errors);

/** Same rule the service worker applies: live, matching, and permitted. */
function usableOffer(url) {
  return findOffersForUrl(offers, url).find((offer) => resolveAttribution(offer)) ?? null;
}

const handlers = {
  GET_OFFER: ({ url }) => {
    const offer = usableOffer(url);
    console.log('[harness] GET_OFFER', url, '->', offer?.id ?? 'no offer');
    return {
      offer: offer && {
        id: offer.id,
        merchantName: offer.merchant.name,
        title: offer.title,
        terms: offer.terms ?? '',
        source: offer.source,
        lastTested: offer.lastTested ?? null,
      },
    };
  },

  APPLY_OFFER: ({ offerId, url }) => {
    const offer = usableOffer(url);
    if (!offer || offer.id !== offerId) return { error: 'offer no longer available' };
    const attribution = resolveAttribution(offer);
    if (!attribution) return { error: 'not authorised to apply this offer' };
    console.log('[harness] APPLY_OFFER ->', attribution.code);
    return {
      code: attribution.code,
      fieldSelectors: offer.checkout.fieldSelectors,
      applyButtonSelectors: offer.checkout.applyButtonSelectors ?? [],
    };
  },

  OFFER_DISPLAYED: () => ({ ok: true }),

  DISMISS_OFFER: () => ({ ok: true }),
};

window.chrome = {
  runtime: {
    onMessage: { addListener() {} },
    sendMessage: async (message) => handlers[message?.type]?.(message) ?? { ok: true },
  },
};
