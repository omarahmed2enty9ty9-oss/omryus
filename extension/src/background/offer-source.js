import { loadOffers } from '../shared/offers.js';
import offersJson from '../data/offers.json';

/**
 * Where offers come from.
 *
 * Today: the bundled offers.json. Later: an HTTPS endpoint returning the same
 * shape, cached in chrome.storage. Only this file changes — everything else
 * calls getOffers() and does not care.
 *
 * Note for later: Manifest V3 forbids remotely hosted *code*, but fetching
 * remote *data* (JSON config) is explicitly allowed. Offer fields are only ever
 * used as strings and CSS selectors; nothing here is ever evaluated.
 */
export class LocalOfferSource {
  constructor(rawList = offersJson) {
    const { offers, errors } = loadOffers(rawList);
    this.offers = offers;
    this.errors = errors;
    if (errors.length) console.warn('[Omryus] skipped invalid offers:', errors);
  }

  async getOffers() {
    return this.offers;
  }
}
