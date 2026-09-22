// Project configuration: naming, colours and the donation recipient. Kept in one
// file so the product can be renamed, or the cause changed, without hunting.
export const BRAND = {
  name: 'Omryus',
  tagline: 'Find discounts while you shop.',
  // Used for the injected UI and the icons. The site mirrors these in style.css.
  color: '#12233B',      // navy — primary actions
  colorDark: '#0E2138',  // navy, pressed
  accent: '#FCA429',     // amber — the sparkle in the mark
  supportEmail: 'support@omryus.example',
  privacyUrl: 'https://omryus.example/privacy.html',
  siteUrl: 'https://omryus.example',
};

/**
 * The palette for the INJECTED UI — the card that renders inside other people's
 * checkouts. It deliberately stays on system fonts and neutral navy surfaces so
 * it feels like part of the page rather than an advert.
 *
 * The marketing site does NOT use these. It runs a warm porcelain palette with
 * near-black ink, defined in site/style.css, because a dark-navy site reads as
 * generic AI-startup and undercuts the product's plain-spoken positioning.
 * The two share only the amber accent and the mark's navy.
 */
export const PALETTE = {
  ink: '#12233B',
  inkSoft: '#4A5A6E',
  navy: '#0E2138',
  slate: '#495C6A',
  accent: '#FCA429',
  accentWash: '#FDF1DC',
  accentInk: '#8A5A08',
  paper: '#F4F9FA',
  line: '#DCE6EA',
};

/**
 * Where commission from donation-funded codes goes.
 *
 * Some partner codes carry no discount — they only track attribution. Chrome Web
 * Store policy permits inserting one of those only when the shopper gets a
 * "discount, cashback, or donation"; commission kept by us is not a benefit to
 * them. So these codes fund a donation instead: we keep no commission on a code
 * that saved the shopper nothing. Codes that DO discount something are ordinary
 * revenue — that distinction is the whole point, so never let copy blur it into
 * "we keep none of it", which reads as though Omryus never earns anything.
 *
 * This is a pledge about our conduct, not an automatic transfer: commission
 * lands in our account and we forward it. Say so honestly, and publish what was
 * sent. See README.md.
 *
 * PLACEHOLDER — confirm the charity's registration and that they accept this
 * kind of donation before shipping anything that names them.
 */
export const DONATION = {
  charity: 'Medical Aid for Palestinians',
  url: 'https://www.map.org.uk/',
  share: 1, // fraction of commission donated. 1 = all of it.

  /**
   * Whether the charity has agreed in writing to be named.
   *
   * Naming a charity in marketing makes us a "commercial participator" under the
   * Charities Act 1992, which requires a written agreement with them BEFORE the
   * arrangement starts. Until that is signed we may still donate — anyone may
   * give a charity money — but we may not advertise using their name.
   *
   * Flip this to true only when the agreement exists. Everything user-facing
   * reads it, so the name cannot leak out early by someone editing one string.
   */
  agreed: false,
};

/**
 * What to call the recipient in user-facing copy.
 * Falls back to an unnamed description until DONATION.agreed is true.
 */
export function donationRecipient() {
  return DONATION.agreed ? DONATION.charity : 'charity';
}

// Prefix for anything we put into the page, so it can never collide with the site.
export const DOM_PREFIX = 'omryus';
