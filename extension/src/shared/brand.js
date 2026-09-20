// Project configuration: naming, colours and the donation recipient. Kept in one
// file so the product can be renamed, or the cause changed, without hunting.
export const BRAND = {
  name: 'Omryus',
  tagline: 'Find discounts while you shop.',
  // Used for the injected UI and the icons. The site mirrors these in style.css.
  color: '#5B4BFF',
  colorDark: '#3B2FCC',
  supportEmail: 'support@omryus.example',
  privacyUrl: 'https://omryus.example/privacy.html',
  siteUrl: 'https://omryus.example',
};

/**
 * The palette, in one place.
 *
 * The injected card deliberately stays on system fonts and neutral surfaces: it
 * appears inside other people's checkouts and should feel like it belongs there,
 * not like an advert. The marketing site is where the brand has personality.
 */
export const PALETTE = {
  ink: '#14121F',
  inkSoft: '#4A4760',
  brand: '#5B4BFF',
  brandDeep: '#3A2BD6',
  sand: '#F7F0E4',
  sandInk: '#7A5A18',
  paper: '#FFFDFB',
  line: '#E9E6F0',
};

/**
 * Where commission from donation-funded codes goes.
 *
 * Some partner codes carry no discount — they only track attribution. Chrome Web
 * Store policy permits inserting one of those only when the shopper gets a
 * "discount, cashback, or donation"; commission kept by us is not a benefit to
 * them. So these codes fund a donation instead, and we keep none of it.
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
};

// Prefix for anything we put into the page, so it can never collide with the site.
export const DOM_PREFIX = 'omryus';
