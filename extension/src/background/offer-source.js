import { loadOffers } from '../shared/offers.js';
import bundledOffers from '../data/offers.json' with { type: 'json' };

/**
 * Where offers come from.
 *
 * The bundled offers.json ships with each release and covers first run and
 * offline use. On top of it, the service worker downloads the live list from
 * api.omryus.com every 12 hours and caches it, so new codes (and new stores, for
 * people who allowed Omryus on the shops they visit) arrive without an update.
 * A downloaded offer replaces a bundled one with the same id, which is also how
 * a bundled code gets switched off early: publish it again with active: false.
 *
 * Manifest V3 forbids remotely hosted *code*; remote *data* is allowed. Offer
 * fields are only ever used as strings and CSS selectors, nothing is evaluated,
 * and every downloaded entry goes through the same validation as bundled ones.
 *
 * The request carries nothing about the person: the same URL for everyone, no
 * cookies, no identifiers, and it is never tied to the page they are on.
 */
export const OFFERS_URL = 'https://api.omryus.com/offers.json';
const CACHE_KEY = 'offerCache';

export class OfferSource {
  constructor({ url = OFFERS_URL, bundledList = bundledOffers, fetchImpl, storage } = {}) {
    this.url = url;
    this.fetchImpl = fetchImpl ?? ((...args) => fetch(...args));
    this.storage = storage ?? chrome.storage.local;
    const { offers, errors } = loadOffers(bundledList);
    if (errors.length) console.warn('[Omryus] skipped invalid bundled offers:', errors);
    this.bundled = offers;
  }

  async getOffers() {
    const { [CACHE_KEY]: cache } = await this.storage.get(CACHE_KEY);
    const byId = new Map(this.bundled.map((offer) => [offer.id, offer]));
    for (const offer of cache?.offers ?? []) byId.set(offer.id, offer);
    return [...byId.values()];
  }

  /** Download the live list. Throws on failure, and the last good copy stays in use. */
  async refresh() {
    const response = await this.fetchImpl(this.url, { cache: 'no-store', credentials: 'omit' });
    if (!response.ok) throw new Error(`offer list: HTTP ${response.status}`);
    const raw = await response.json();
    if (!Array.isArray(raw)) throw new Error('offer list: expected an array');
    const { offers, errors } = loadOffers(raw);
    if (errors.length) console.warn('[Omryus] skipped invalid downloaded offers:', errors);
    await this.storage.set({ [CACHE_KEY]: { fetchedAt: new Date().toISOString(), offers } });
    return offers;
  }
}
