# Omryus

A free Chrome extension (Manifest V3) that shows you a partner discount code when we have one
for the store you're on, and inserts it **only after you click Apply**.

Working name: **Omryus**. To rename it, edit `extension/src/shared/brand.js` and the `name` /
`description` in `extension/manifest.template.json`.

## Logo and colours

Two vector sources in `extension/icons/`:

| File | Used for | Why |
|---|---|---|
| `mark.svg` | 48px and 128px icons | The full mark — hat, lens, handle, sparkle |
| `mark-small.svg` | 16px and 32px icons, favicon, site header | Simplified: no crown pinch, no hat band, shorter handle |

The full mark turns to porridge at 16px, which is the Chrome toolbar size, so the small variant
is a separate drawing rather than a scaled-down one. `npm run icons` renders both to PNG and
copies the small one to `site/icon.svg`.

Rendering is done by **Chrome itself** (it looks for a binary in the same places as
`tools/launch-chrome.js`), so the shipped PNGs are exactly what a browser draws. ImageMagick is
tempting here and wrong: without librsvg it silently drops strokes and circles.

Two palettes, on purpose:

| Surface | Palette | Why |
|---|---|---|
| Injected card (`PALETTE` in `brand.js`) | navy `#12233B`, amber `#FCA429`, cool paper | Renders inside other people's checkouts; should look native, not like an advert |
| Marketing site (`site/style.css`) | porcelain `#FBF9F5`, near-black `#191722`, amber `#FCA429` | A dark-navy site reads as generic AI-startup and undercuts the plain-spoken positioning |

They share the amber accent and the mark's navy, and nothing else. Site type is Instrument Serif
(display), Hanken Grotesk (body) and Spline Sans Mono — the mono is used for the donation ledger
and code chips, so figures read as evidence rather than marketing.

`mark-small.svg` carries its own `prefers-color-scheme` block, so the favicon and site logo
invert to a light hat on dark grounds without a second file or a `<picture>` swap.

> **Status: pre-release.** There are no real affiliate partnerships and no real discount codes.
> Everything shipped in `offers.json` is labelled `"source": "mock"` and the UI says so.

---

## What it does

1. You open a cart or checkout page on a store we support.
2. A small card appears bottom-right: *"20% off your order — we have a partner code for this store."*
3. You click **Apply discount** — or **Add the code**, if it's a donation-funded code that won't
   lower your price. (Or **Dismiss**, which closes the card for that page.)
4. The extension finds the discount box, puts the code in, and fires the events frameworks need.
5. If it can't find the box, it shows you the code to paste in yourself.

Nothing is inserted, and no affiliate action of any kind is taken, before that click.

---

## Quick start

```bash
npm install
npm run build
```

Then load it in Chrome:

1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked**
4. Select the **`dist/`** folder (not `extension/` — that's the source)

To try it against the test checkouts:

```bash
npm run mock
```

In a second terminal, `npm run chrome` opens a browser with the extension already loaded
(no file picker, and a dedicated profile that never touches your real browser data). The profile
persists between runs so you can check that dismissals and counters survive a restart —
`npm run chrome -- --fresh` wipes it. If you have no Chrome installed and no root access to
install one, grab the [Chrome for Testing](https://googlechromelabs.github.io/chrome-for-testing/)
zip and unpack it to `~/.cache/omryus-chrome/` — the launcher finds it there.

Open <http://localhost:8642> and work through the six fixtures. The card should appear on the five
cart pages and **not** on the products page.

### Demo mode (no install needed)

The fixture links use `?demo`, which loads a dev harness (`mock-store/harness/`) that runs the
**real** content script against the **real** offers, matching and insertion logic with a simulated
service worker. Handy for iterating without reloading the extension.

It does **not** test the manifest, permissions, service worker registration or popup — only
loading `dist/` in Chrome does that. Open the fixtures without `?demo` to test the installed
extension; the two never run at the same time.

After changing anything, run `npm run build` and press the reload icon on the extension card in
`chrome://extensions`. `npm run dev` rebuilds the JavaScript on save (re-run `npm run build` if you
touch the manifest, HTML or `offers.json`).

---

## Commands

| Command | What it does |
|---|---|
| `npm run build` | Bundles to `dist/`, generates `manifest.json`, copies static files |
| `npm run dev` | Same, with JS rebuilt on save |
| `npm test` | Runs the test suite (`node --test`, 46 tests) |
| `npm run mock` | Serves the test checkout pages on <http://localhost:8642> |
| `npm run icons` | Rasterises the logo SVGs into the PNG sizes Chrome needs |

---

## Architecture in one paragraph

The **service worker** owns all the rules: which merchants we support, which offers are live, what
the codes are, what we're allowed to do. The **content script** is deliberately dumb — it asks
"is there an offer for this URL?", draws a card, and if the user clicks Apply, asks for the code
and puts it in the box. The **popup** asks the content script what's happening on the current tab,
which is why it needs no permissions of its own. See [ARCHITECTURE.md](ARCHITECTURE.md).

```
extension/src/
  shared/offers.js       validation, matching, expiry — pure functions, heavily tested
  shared/brand.js        name, colours and the donation recipient, in one file
  background/            service worker, offer source, affiliate providers, local counters
  content/               find the field, insert the code, draw the card
  popup/  options/       UI
  data/offers.json       the offers themselves
```

---

## How offers work

`extension/src/data/offers.json` is an array. Each entry:

```jsonc
{
  "id": "mockstore-autumn-2026",              // stable — used for dismissals and counters
  "merchant": { "name": "Mock Store", "domains": ["mockstore.example"] },
  "title": "20% off your order",              // shown to the user
  "benefit": { "type": "percent", "value": 20 },   // what the shopper gets — see below
  "code": "MOCK20",
  "terms": "Short plain-English conditions.",
  "affiliate": {
    "network": "mock",                        // must match a registered AffiliateProvider
    "attributionMode": "code-only",           // "link" exists in the schema but is refused (see below)
    "url": null
  },
  "active": true,
  "startsAt": "2026-01-01T00:00:00Z",         // optional
  "expiresAt": "2027-01-01T00:00:00Z",        // optional
  "checkout": {
    "urlPatterns": ["*/cart*", "*/checkout*"],// only show on these paths
    "fieldSelectors": ["input[name='coupon']", "#promo-code"],
    "applyButtonSelectors": ["button[name='apply-coupon']"],
    "successSelectors": [".discount-applied"] // reserved for later verification
  },
  "lastTested": "2026-09-20",                 // shown in the card, so stale codes are visible
  "source": "mock"                            // "mock" shows a MOCK OFFER badge; "partner" doesn't
}
```

An entry that fails validation is **skipped with a warning**, not fatal — one typo can't take down
every other merchant. The rules live in `extension/src/shared/offers.js`.

### `benefit` — what the shopper gets

| `type` | Means | Usable? |
|---|---|---|
| `percent` / `fixed` | Price reduction. `value` must be > 0 | yes |
| `shipping` | Free or reduced delivery | yes |
| `donation` | **No price reduction.** The commission funds a donation | yes |
| `none` | Nothing at all. Recorded, never used | **refused** |

Chrome Web Store policy permits inserting an affiliate code only where the shopper gets a
"discount, cashback, or donation". `resolveAttribution()` refuses anything failing
`hasUserBenefit()`, and that check sits **above** the provider lookup so no future network
integration can skip it.

### Donation-funded codes

Some programmes issue a code that tracks the sale but saves the shopper nothing. Rather than
waste them or dress them up as savings, they are offered as donations: the card says plainly that
the price will not change, names the charity, and the button reads "Add the code" — never
"Apply discount". There are tests asserting exactly that, because it is the detail that would sink
a store review.

The recipient is one value in `extension/src/shared/brand.js`:

```js
export const DONATION = {
  charity: 'Medical Aid for Palestinians',
  url: 'https://www.map.org.uk/',
  share: 1, // fraction of commission donated. 1 = all of it.
};
```

**Three things this depends on, none of which are code:**

1. **You have to actually forward the money.** Commission lands in your account; nothing transfers
   automatically. The extension states this as a pledge, so publish what was sent — a dated list
   on the site is enough, and it is the only thing that makes the claim verifiable.
2. **`share` should stay at 1.** The donation is what makes these codes permissible. The more of it
   you keep, the closer it gets to the thing the policy prohibits, and "we donate some of it" is a
   much weaker argument than "we keep none of it".
3. **The affiliate programme has to allow it.** Inserting a tracking-only code at checkout is the
   pattern merchants call commission hijacking, and plenty of networks ban extension publishers
   for it regardless of what Chrome permits. Ask before you build a flow around it.

One known trade-off: the cause is fixed rather than chosen by the shopper. That is a deliberate
choice, but it is the weaker version of the compliance argument — "a donation the user selected"
is easier to defend than "a donation we selected". If a reviewer pushes back, offering a short
list of causes in Settings is the fix.

### Adding a merchant

1. Add an object to `offers.json`.
2. `npm run build` — this regenerates the manifest's `host_permissions` and content-script
   `matches` from the domains in that file.
3. `npm test` — one test validates the shipped `offers.json`.
4. Reload the extension.

Nothing else in the codebase mentions a specific merchant.

**The one catch:** a brand-new *domain* changes the manifest, so it needs a Chrome Web Store update
(a review, typically a few days). Changing an existing offer's code, expiry, selectors or on/off
switch is just data. This is the price of not requesting access to every website you visit, and
it's the right trade. When offers move to an API (see ARCHITECTURE.md), offer *content* updates
instantly and only new domains still need a release.

### Finding the right selectors

Open the store's cart page, right-click the discount box → Inspect, and look for a stable
`name`, `id` or `data-testid`. List several — they're tried in order. Then set `lastTested` to
today so you can see later which offers haven't been checked in a while.

---

## How affiliate codes work

Read `extension/src/background/affiliate.js` — it's short, and it's the part with the rules in it.

The MVP supports exactly one attribution mode: **`code-only`**. We put a promo code in a box
because the user clicked a button. We do not redirect, rewrite URLs, or set cookies. Offers
declaring `attributionMode: "link"` are **refused** — `resolveAttribution()` returns `null` and
the service worker then behaves as if the offer doesn't exist.

That is deliberate, for three reasons:

- Chrome Web Store policy requires a related user action *and* a real user benefit before any
  affiliate code, link or cookie is added.
- Link- or cookie-based attribution risks overwriting a referral that belongs to someone else.
  Code-only attribution can't.
- **This MVP is designed to earn nothing.** It tests whether people want the product, not whether
  it makes money. See [VALIDATION.md](VALIDATION.md).

To add a real network later, write a provider and register it — nothing else changes:

```js
registerProvider({
  name: 'awin',
  resolve(offer) { /* return { mode: 'code-only', code } or null */ },
});
```

---

## Testing

```bash
npm test
```

46 tests, `node --test` plus `jsdom`, no test framework. They cover: supported and unsupported
merchant detection, lookalike domains, wrong-page suppression, active offers, expired and
not-yet-started offers, deactivated offers, malformed offer data, dismissal expiry, code insertion
into plain and controlled (React/Vue-style) inputs, missing fields, dynamically appearing fields,
shadow-DOM fields, refusal to touch password and card fields, duplicate notification suppression,
the affiliate provider's refusal of unsupported modes and of zero-benefit codes, donation-funded
codes never being described as discounts, and HTML escaping of offer data.

`mock-store/` holds six checkout fixtures for manual testing — static, controlled-input,
late-rendering, shadow DOM, no-coupon-box, and a non-cart page that should stay quiet.

---

## Deploying the landing page

`site/` is five static files — landing page, privacy policy, the donation ledger, the stylesheet
and the icon. No build step, no framework. Any host works:

- **GitHub Pages** — push the repo, Settings → Pages → deploy from branch, folder `/site`.
- **Netlify / Cloudflare Pages** — drag the `site/` folder in, or connect the repo with publish
  directory `site` and no build command.

Update `privacyUrl` and `siteUrl` in `extension/src/shared/brand.js` once you have a real domain,
and search `site/` for `omryus.example` — the contact addresses need the same change.

`donations.html` is the public ledger. It currently says nothing has been donated, which is true.
Do not make a donation claim anywhere — site, store listing or extension — without keeping it
current; an unverifiable claim is worse than no claim.

---

## Privacy and security

- **One permission: `storage`.** No `tabs`, no `activeTab`, no `cookies`, no `webRequest`, no
  `scripting`.
- **Host permissions are generated from `offers.json`** and cover only the stores we have a live
  offer for. The extension does not run anywhere else, including on expired offers' domains.
- **We never read what you type.** The content script looks for a discount box by selector and
  writes to it. It never reads form values, never serialises the DOM, never inspects the basket.
- **Password and payment fields are refused by name**, even if an offer's selector matches one
  (`FORBIDDEN_TYPES` and the `cc-*` autocomplete check in `content/find-field.js`).
- **No network calls at all.** There is no server. Analytics are four local counters.
- **Offer data is never evaluated** — only used as strings and CSS selectors, and escaped before
  it reaches the page.

## Chrome Web Store publishing checklist

- [ ] Replace every mock offer with a real one from a programme you have actually joined
- [ ] Confirm the charity in `brand.js` is registered, named correctly, and accepts this
- [ ] Publish the donation ledger on the site before claiming donations in the listing
- [ ] Set `source: "partner"` only on offers backed by a real agreement
- [ ] Host the privacy policy at a real URL and update `brand.js`
- [ ] Listing description states the affiliate relationship **before install** (policy requirement)
- [ ] Screenshots show the card with its disclosure line visible
- [ ] Fill in the Privacy practices tab: single purpose, and a justification per permission
- [ ] Confirm `host_permissions` contains only domains you have offers for
- [ ] Confirm no remotely hosted code (there is none — `npm run build` bundles everything)
- [ ] Bump `version` in `manifest.template.json`
- [ ] `npm test && npm run build`, then zip the **contents** of `dist/`
- [ ] Re-read the [affiliate ads policy](https://developer.chrome.com/docs/webstore/program-policies/affiliate-ads) — it changed in 2025 and again in 2026

## Known limitations

- **No SPA route detection.** If a store switches to the cart without a page load, the card won't
  appear until reload. Fixable with a `navigation` listener when a real store needs it.
- **Coupon boxes inside iframes** aren't reached. The content script runs in the top frame only
  (`all_frames: false`), which keeps page access minimal and stops a same-origin iframe rendering
  a second card. If a real merchant needs it: set `all_frames: true`, keep the top-frame guard in
  `content.js`, and have the worker relay `APPLY_OFFER` to sub-frames when the top frame finds no
  field. Closed shadow roots can't be reached at all.
- **We don't verify the code worked.** The card says the code is in the box, not that you saved
  money — the store decides. `successSelectors` is in the schema for when we do verify.
