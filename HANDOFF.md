# Handoff — 22 Sep 2026

State of Omryus at the end of the first build session, and what the next one should pick up.
Read `README.md` for how things work; this file is only what you can't infer from the code.

---

## Where things stand

| | |
|---|---|
| Repo | https://github.com/omarahmed2enty9ty9-oss/omryus (public) |
| Site | https://omarahmed2enty9ty9-oss.github.io/omryus/ — **live** |
| Deploy | `npm run deploy` (pushes `site/` to the `gh-pages` branch) |
| Tests | `npm test` — 63 passing |
| Extension | Builds to `dist/` with `npm run build`; `npm run chrome` launches it |
| Teaser video | `brag-output-2026-09-21-121428/brag.mp4` (gitignored) |

The extension works end to end against the mock checkouts. It has never been published, has no
real offers, and has earned nothing.

---

## Three constraints that shaped everything

Do not undo these without reading why. Each one is load-bearing and each has a test or a code
comment holding it in place.

**1. Code-only affiliate attribution.** The extension inserts a promo code and does nothing else:
no redirects, no URL rewriting, no cookies. Chrome Web Store policy requires a *related user
action* and a *real user benefit* before any affiliate code is added, and Awin puts extension
publishers on "Soft Click" status, which forbids overwriting another affiliate's cookie. Both are
satisfied structurally rather than by promise. `attributionMode: "link"` exists in the schema and
is refused at runtime in `background/affiliate.js`.

**2. No affiliate code without a benefit to the shopper.** `resolveAttribution()` refuses any
offer failing `hasUserBenefit()`, and the check sits *above* the provider lookup so a future
network integration cannot bypass it. A code that discounts nothing is only usable as a
`donation`, which Chrome policy names as a qualifying benefit alongside discounts and cashback.

**3. The charity is not named anywhere.** `DONATION.agreed` in `extension/src/shared/brand.js` is
`false`. All user-facing copy reads `donationRecipient()`. Naming a charity in marketing makes us
a commercial participator under the Charities Act 1992, which needs their written agreement
*first*. `test/donation-naming.test.js` fails if the name appears on the site while the flag is
false. **Flip the flag only when an agreement is signed.**

Related copy rule: "we keep none of it" must always stay tethered to its condition ("when there
isn't a discount"). Unqualified, it reads as though Omryus never earns anything, which is false —
commission on codes that do discount something is the revenue model. There's a test for this too.

---

## Blocked on other people

| Waiting on | For | Status |
|---|---|---|
| Awin | Publisher approval, then per-advertiser opt-in | Application in progress |
| A charity | Written agreement before naming them | Draft email sitting in Gmail, unsent |
| Chrome Web Store | Listing approval | Not submitted |

**Awin is four gates, not one:** publisher signup → extension submitted to their Network Quality
Team for review *before going live* → join individual programmes → **documented opt-in from each
advertiser separately**. Network approval does not grant advertiser approval. Their guideline:
https://success.awin.com/s/article/Network-s-Guideline-for-Publishers-with-Downloadable-Software-or-Browser-Extension

---

## Focus for the next session

### 1. The website

Live and presentable, but carrying placeholders.

- **`omryus.example` appears in 4 files** (`site/index.html`, `site/privacy.html`,
  `site/donations.html`, `extension/src/shared/brand.js`). Contact links are dead addresses. The
  user chose to leave these until a domain exists — don't "fix" them with a guess.
- **No custom domain.** ~£10/yr, and it's on the critical path for looking legitimate to Awin and
  charities. Pages supports a CNAME once bought.
- **Supported stores section** says "None yet, and we won't pretend otherwise." Keep it that way
  until real partnerships exist.
- Possible work: Open Graph / Twitter card tags (there are none, so shared links look bare), a
  favicon check across browsers, and the donations ledger table once there's anything to put in it.

### 2. The extension

- **Remote offer source.** `LocalOfferSource` → `RemoteOfferSource` in
  `background/offer-source.js` is a one-file change, and MV3 permits fetching remote *data* (not
  code). **Do not build this before at least one merchant opt-in exists** — what Awin's Offers API
  actually returns should shape the schema, and building for imagined data means migrating twice.
- **The `host_permissions` gap.** They're generated from `offers.json` at build time, so a remote
  database still can't add a *new merchant domain* without a manifest change and a store review.
  The fix is `optional_host_permissions` requested per-site on a user gesture. Compliant, but a
  later problem.
- **Known limitations, all documented in README:** no SPA route detection (cart reached without a
  page load shows no card), no iframe support (`all_frames: false`, deliberate — it stopped
  duplicate cards), closed shadow roots unreachable.
- **Selector rot** is the real operational risk. Every offer carries `lastTested`; the card shows
  it. A stale selector means a silent failure on a real checkout.

### 3. Other affiliate networks

The filter that matters is not "does this network have good merchants" but **"does it permit
browser-extension publishers, and will individual advertisers opt in?"** Most coupon-extension
rejections happen at the second question.

Worth researching: Impact, CJ Affiliate, Rakuten Advertising, Partnerize, Sovrn Commerce,
Skimlinks. For each, find the equivalent of Awin's downloadable-software guideline *before*
applying. Note that Skimlinks and Sovrn are link-rewriting networks, which is a poor fit — Omryus
deliberately does not rewrite links.

Do not apply to five networks at once. Learn what one asks for, then scale the pitch.

---

## Things already decided, so you don't re-litigate them

- **Two palettes on purpose.** The injected card is navy on system fonts so it looks native inside
  other people's checkouts. The marketing site is warm porcelain (`#FBF9F5`) with Instrument Serif
  / Hanken Grotesk / Spline Sans Mono, modelled on guestagentics.com at the user's request. Dark
  mode is warm espresso, not navy — a navy dark theme was the thing being escaped.
- **The mark is a hand-traced vector** of a supplied JPEG; no vector source exists and no tracer is
  installed. `mark.svg` (48/128) and `mark-small.svg` (16/32, site, favicon) are separate drawings
  because the full mark is illegible at 16px. `mark-small.svg` carries its own
  `prefers-color-scheme` block and inverts on dark grounds. Regenerate PNGs with `npm run icons`
  (renders through Chrome; ImageMagick lacks librsvg here and silently mangles the output).
- **GitHub Actions would not register a workflow on this account** — valid YAML, default branch,
  Actions enabled, workflows endpoint empty. Hence the `gh-pages` branch deploy. Retry Actions
  later if you want, but don't assume the workflow file was wrong.
- **The teaser video leads with charity, not with the category.** An earlier cut opened on "free
  coupon extensions make money somehow" and read as promoting extension-building rather than the
  product. Don't go back to that framing.

---

## Fastest way back in

```bash
npm install && npm run build && npm test
npm run mock          # fixtures on http://localhost:8642
npm run chrome        # Chrome with the extension loaded
```

Chrome for Testing lives in `~/.cache/omryus-chrome/` (there is no system Chrome on this machine);
`tools/launch-chrome.js` finds it. The profile persists between runs so dismissals and counters
survive a restart — `npm run chrome -- --fresh` wipes it.

The single highest-value thing that isn't code: the 10–20 person test in `VALIDATION.md`. It's the
only item on the critical path that doesn't depend on Awin, a charity, or Google.
