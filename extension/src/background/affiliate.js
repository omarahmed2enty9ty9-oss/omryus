/**
 * Affiliate attribution.
 *
 * Chrome Web Store policy: an affiliate code, link or cookie may only be added
 * after a related user action, and only when it gives the user a real benefit
 * at that moment. We also refuse, by design, to overwrite attribution that
 * belongs to somebody else.
 *
 * The MVP therefore ships exactly one mode: 'code-only'. We put a promo code in
 * a box because the user clicked a button. We do not redirect, do not rewrite
 * URLs, and do not write cookies. Nothing in this file can earn commission yet,
 * and that is deliberate — see ARCHITECTURE.md.
 *
 * @typedef {{mode: 'code-only', code: string}} Attribution
 * @typedef {{name: string, resolve: (offer: import('../shared/offers.js').Offer) => Attribution|null}} AffiliateProvider
 */

/** The only provider that exists today. Real networks register alongside it. */
const mockProvider = {
  name: 'mock',
  resolve(offer) {
    if (offer.affiliate.attributionMode !== 'code-only') return null;
    return { mode: 'code-only', code: offer.code };
  },
};

/** @type {Record<string, AffiliateProvider>} */
const providers = {
  mock: mockProvider,
};

export function registerProvider(provider) {
  providers[provider.name] = provider;
}

/**
 * Work out what we are allowed to do for this offer.
 * Returns null when we have no provider or the mode is not supported yet —
 * the caller must then treat the offer as unavailable rather than guessing.
 * @returns {Attribution|null}
 */
export function resolveAttribution(offer) {
  const provider = providers[offer.affiliate.network];
  if (!provider) return null;
  return provider.resolve(offer);
}
