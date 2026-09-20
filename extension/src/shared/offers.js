/**
 * Pure offer logic: validation, matching and expiry.
 *
 * Nothing in here touches chrome.* or the DOM, which is why it is the easiest
 * part of the codebase to test and the safest place to put the rules.
 *
 * @typedef {object} Offer
 * @property {string} id                       Stable key. Used for dismissal + analytics.
 * @property {{name: string, domains: string[]}} merchant
 * @property {string} title                    Shown to the user, e.g. "20% off your order".
 * @property {{type: 'percent'|'fixed'|'shipping'|'none', value: number}} discount  'none' = attribution-only, never usable
 * @property {string} code                     The promo code we insert.
 * @property {string} [terms]                  Short plain-English conditions.
 * @property {{network: string, attributionMode: 'code-only'|'link', url: string|null}} affiliate
 * @property {boolean} active
 * @property {string} [startsAt]               ISO date. Offer is not live before this.
 * @property {string} [expiresAt]              ISO date. Offer is not live after this.
 * @property {{urlPatterns: string[], fieldSelectors: string[], applyButtonSelectors?: string[], successSelectors?: string[]}} checkout
 * @property {string} [lastTested]             ISO date we last confirmed the code works.
 * @property {'mock'|'partner'} source         'mock' offers are labelled as such in the UI.
 */

const ATTRIBUTION_MODES = ['code-only', 'link'];
const DISCOUNT_TYPES = ['percent', 'fixed', 'shipping', 'none'];

const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
const isStringArray = (v) => Array.isArray(v) && v.length > 0 && v.every(isNonEmptyString);
const isValidDate = (v) => v === undefined || (isNonEmptyString(v) && !Number.isNaN(Date.parse(v)));

/**
 * Check one raw entry from offers.json.
 * Returns the offer or a human-readable reason it was rejected, never throws.
 * @returns {{ok: true, offer: Offer} | {ok: false, reason: string}}
 */
export function validateOffer(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { ok: false, reason: 'not an object' };
  if (!isNonEmptyString(raw.id)) return { ok: false, reason: 'missing id' };
  if (!raw.merchant || !isNonEmptyString(raw.merchant.name)) return { ok: false, reason: 'missing merchant.name' };
  if (!isStringArray(raw.merchant?.domains)) return { ok: false, reason: 'missing merchant.domains' };
  if (!isNonEmptyString(raw.title)) return { ok: false, reason: 'missing title' };
  if (!isNonEmptyString(raw.code)) return { ok: false, reason: 'missing code' };
  if (typeof raw.active !== 'boolean') return { ok: false, reason: 'active must be a boolean' };
  if (!raw.discount || !DISCOUNT_TYPES.includes(raw.discount.type)) return { ok: false, reason: 'bad discount.type' };
  if (typeof raw.discount.value !== 'number') return { ok: false, reason: 'discount.value must be a number' };
  if (!raw.affiliate || !isNonEmptyString(raw.affiliate.network)) return { ok: false, reason: 'missing affiliate.network' };
  if (!ATTRIBUTION_MODES.includes(raw.affiliate.attributionMode)) return { ok: false, reason: 'bad affiliate.attributionMode' };
  if (!raw.checkout || !isStringArray(raw.checkout.urlPatterns)) return { ok: false, reason: 'missing checkout.urlPatterns' };
  if (!isStringArray(raw.checkout.fieldSelectors)) return { ok: false, reason: 'missing checkout.fieldSelectors' };
  if (!isValidDate(raw.startsAt)) return { ok: false, reason: 'unparseable startsAt' };
  if (!isValidDate(raw.expiresAt)) return { ok: false, reason: 'unparseable expiresAt' };
  if (raw.source !== 'mock' && raw.source !== 'partner') return { ok: false, reason: 'source must be "mock" or "partner"' };
  return { ok: true, offer: /** @type {Offer} */ (raw) };
}

/**
 * Validate a whole list. Bad entries are dropped, not fatal — one typo in
 * offers.json must never take the extension down on every other merchant.
 * @returns {{offers: Offer[], errors: string[]}}
 */
export function loadOffers(rawList) {
  if (!Array.isArray(rawList)) return { offers: [], errors: ['offers file is not an array'] };
  const offers = [];
  const errors = [];
  for (const [i, raw] of rawList.entries()) {
    const result = validateOffer(raw);
    if (result.ok) offers.push(result.offer);
    else errors.push(`offer[${i}]${raw?.id ? ` (${raw.id})` : ''}: ${result.reason}`);
  }
  return { offers, errors };
}

/** "www.shop.com" and "shop.com" are the same merchant to us. */
export function normaliseHostname(hostname) {
  return String(hostname).toLowerCase().replace(/^www\./, '');
}

/** Turn a simple "*" glob into a RegExp. Offer data is config, never code. */
export function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

/** Does this offer belong to the site we are on? Matches the domain or a subdomain. */
export function matchesDomain(offer, hostname) {
  const host = normaliseHostname(hostname);
  return offer.merchant.domains.some((domain) => {
    const d = normaliseHostname(domain);
    return host === d || host.endsWith(`.${d}`);
  });
}

/** Is this a cart/checkout page? Keeps us off the other 99% of the site. */
export function matchesUrlPattern(offer, url) {
  const { pathname, search } = new URL(url);
  const path = pathname + search;
  return offer.checkout.urlPatterns.some((pattern) => globToRegExp(pattern).test(path));
}

/** Live means: switched on, started, and not expired. */
export function isOfferLive(offer, now = Date.now()) {
  if (!offer.active) return false;
  if (offer.startsAt && Date.parse(offer.startsAt) > now) return false;
  if (offer.expiresAt && Date.parse(offer.expiresAt) < now) return false;
  return true;
}

/**
 * Every live offer for this URL, in file order.
 *
 * Returns all of them rather than just the first: the caller still has to check
 * whether it is permitted to act on an offer, and a refused one must not shadow
 * a usable one for the same page.
 */
export function findOffersForUrl(offers, url, now = Date.now()) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return [];
  }
  return offers.filter(
    (offer) => isOfferLive(offer, now) && matchesDomain(offer, parsed.hostname) && matchesUrlPattern(offer, url),
  );
}

/**
 * Does this offer give the shopper something?
 *
 * This is the line Chrome Web Store policy draws: an affiliate code may only be
 * included when it provides "a direct and transparent user benefit". A code that
 * discounts nothing is attribution-only — it earns us commission and gives the
 * shopper nothing — and inserting it is prohibited however clearly we disclose
 * it and however explicitly the user consents.
 *
 * See resolveAttribution() in background/affiliate.js, which refuses these.
 */
export function hasUserBenefit(offer) {
  const { type, value } = offer.discount;
  if (type === 'none') return false;
  if (type === 'shipping') return true;
  return typeof value === 'number' && value > 0;
}
