# Handoff — updated 22 Sep 2026 (evening)

State of Omryus at the end of the first build session, and what the next one should pick up.
Read `README.md` for how things work; this file is only what you can't infer from the code.

---

## Where things stand

| | |
|---|---|
| Repo | https://github.com/omarahmed2enty9ty9-oss/omryus (public) |
| Site | https://omryus.com — **live**. Kane's rebuild, Cloudflare Worker `omryus-site` (25 Sep). Its source is with Kane, not in this repo |
| Offer list | https://api.omryus.com/offers.json — Worker `omryus-api`. Edit `api/offers.json`, then `npm run deploy:api` |
| Tests | `npm test` — 63 passing |
| Extension | Builds to `dist/` with `npm run build`; `npm run chrome` launches it |
| Teaser video | `brag-output-2026-09-21-121428/brag.mp4` (gitignored) |
| Brand assets | `brand/` — logo PNGs on white, `npm run logos` |
| Secrets | `.env` (gitignored, chmod 600). `.env.example` documents the keys. |

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

> ⚠ **This one is now an open question, not a settled constraint.** Awin pays on a click, not on
> the code, so code-only attribution earns nothing there. See "Awin: the attribution problem"
> below before assuming this stays as it is. Constraints 2 and 3 are not in question.

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
| Awin | Per-advertiser opt-in | Publisher account live: **ID 3102715**. Joined SAILO (boat rental, US) 24 Sep, but its terms §8.5 ban shopping-assistant add-ons and it publishes 0 offers: not usable without written permission |
| impact.com | Partner approval | **DECLINED 22 Sep**, account 7826308. Appeal via dashboard Help → Tickets |
| A charity | Written agreement before naming them | Permission request sent 22 Sep, awaiting reply. `DONATION.agreed` stays `false` until signed |
| Chrome Web Store | Listing approval | Not submitted |

### impact.com: reapply now the domain exists

The site used to be on `omarahmed2enty9ty9-oss.github.io`. impact.com declined the application
**eleven minutes** after acknowledging it — an automated filter, not a human — and the most
likely trigger is a free subdomain with no traffic or history. Their Media Partner Service
Agreement (the only "reason" given) does **not** prohibit browser extensions, plugins, toolbars or
coupon publishers; it bans adware, cookie stuffing and fake redirects, none of which apply. So the
rejection was on signals, not substance. `omryus.com` was bought and live on 22 Sep — reapply.

### Awin: the attribution problem

**This is the biggest open design question.** Every advertiser record from the Awin API carries:

```
"clickThroughUrl": "https://www.awin1.com/awclick.php?mid=<advertiser>&id=3102715"
```

Awin pays on a **click that sets a cookie**, not on the code. A voucher code tells the shopper
what to type; the cookie tells Awin who to pay. As built — code-only, no links, no cookies —
Omryus would insert codes that work for shoppers and **earn nothing**.

Two ways out, and it is a real decision, not a detail:

- **Fire the affiliate link on the user's "Apply discount" click**, then insert the code. Still
  disclosed, still an explicit user action, still a real discount — so it reads as Chrome-policy
  compliant. Awin's mandatory **Soft Click** status for extension publishers blocks overwriting
  another affiliate's existing cookie at the network level, which enforces the no-hijacking
  principle better than self-restraint did. This means un-refusing `attributionMode: 'link'` and
  removing "no tracking cookies" from the site copy.
- **Stay code-only** and earn only from advertisers doing publisher-unique codes reconciled by
  hand. Principled, rare, does not scale.

Ask Awin directly whether any advertisers support code-level attribution for extension publishers
before rewriting anything. Their answer settles it.

**Awin is four gates, not one:** publisher signup ✅ → extension submitted to their Network Quality
Team for review *before going live* → join programmes → **documented opt-in from each advertiser
separately**. Network approval does not grant advertiser approval. Their guideline:
https://success.awin.com/s/article/Network-s-Guideline-for-Publishers-with-Downloadable-Software-or-Browser-Extension

### Networks that attribute on the code itself

impact.com supports promo-code attribution natively (a unique code maps to one partner, no click
needed) — which is why it is worth reapplying to. Merchant-side Shopify tools (Refersion,
UpPromote, Partnero, GoAffPro) all do cookie-free code attribution too, but they are per-merchant
programmes rather than networks, so there is no cross-merchant feed. Small Shopify brands are the
realistic early wins: code attribution is native and they are likelier to say yes.

---

## Focus for the next session

### 1. The website

Live on omryus.com.

- **Email:** Cloudflare Email Routing forwards `support@` and `omar@omryus.com` to the owner's
  Gmail (receive only). Sending uses Gmail's "Send mail as" through `smtp.gmail.com`, so outgoing
  mail is DKIM-signed by gmail.com, not omryus.com. **Don't add a strict DMARC policy**
  (`p=quarantine`/`reject`) — it would bounce those replies. A real mailbox is the upgrade path.
- **Hosting changed on 25 Sep.** The live site is Kane's Worker `omryus-site`; his source is not in
  this repo, so **`site/` here is the old site**, kept for reference. `test/donation-naming.test.js`
  scans `site/`, so until Kane's source lands here that guard does not cover what is live.
  GitHub Pages is off (the `gh-pages` branch was deleted; local backup at `refs/backup/gh-pages`).
  An earlier Cloudflare hosting attempt is parked in `git stash` ("cloudflare-hosting"), superseded.
- **Kane's site still needs, before the extension update below ships:** the privacy page says "The
  extension has no server" and "makes no network requests whatsoever". Both become false once the
  extension downloads the offer list. Also the homepage `<title>` has an em dash.
- **Google Search Console** owns `omryus.com` as a Domain property, verified by a
  `google-site-verification=` TXT record on the apex. Removing that record drops the verification.
- **SEO basics are in place:** canonical and Open Graph tags on every page, `og.png` (1200×630),
  `sitemap.xml`, `robots.txt` (all crawlers allowed, AI bots included, on purpose), and
  Organization + WebSite JSON-LD on the homepage. Audited with `nurkamol/seo-audit` and
  `openairlabs/seo-aeo-audit`. The AEO tool's remaining asks (Wikidata entry, `sameAs` profiles,
  `llms.txt`) were declined: none exist yet and faking them is score-chasing. (This was the old
  site; Kane's keeps canonical tags, sitemap and robots, and sets its own security headers.)
- **The site now carries impact.com's tracking tag**, consent-gated by `site/consent.js`. It ships
  as `<script type="text/plain" data-consent="impact">` so the network can still verify ownership
  by finding it in the source, but it stays inert until someone accepts. Do not make it fire
  unconditionally: UK PECR requires consent first, and refusing must be as easy as accepting.
- **Privacy claims are scoped, deliberately.** They used to say "Omryus has no analytics service",
  which the tag made false. They now say *the extension* has none (true, and the claim that
  matters) and `privacy.html` has a "What this website loads" section owning the tag. Keep that
  distinction if you touch the copy.
- **Supported stores section** says "None yet, and we won't pretend otherwise." Keep it that way
  until real partnerships exist.

### 2. The extension

- **Offers are downloaded (built 25 Sep, "option B").** `OfferSource` in
  `background/offer-source.js` fetches `https://api.omryus.com/offers.json` every 12 hours
  (`chrome.alarms`), validates it with `loadOffers()`, caches it in `chrome.storage.local`, and
  layers it over the bundled `offers.json` (same id = replaced). A failed fetch keeps the last good
  copy. The request is identical for everyone: no cookies, nothing about the user or the page.
- **Where the content script runs.** It is no longer declared in the manifest. The service worker
  registers it with `chrome.scripting` for exactly the stores in the current list that it has
  permission for, and re-registers when the list or permissions change. Bundled stores are
  `host_permissions`; newer ones need the optional `https://*/*` grant, offered once on the
  settings page (opened on install, off by default). Even with the grant the script runs only on
  stores with a live offer, so "not loaded anywhere else" stays true.
- **Verified 25 Sep** in headless Chrome for Testing: onboarding page opens, registration covers
  exactly the bundled stores, the 12-hour alarm exists, the list downloads from api.omryus.com,
  the card shows on the mock cart and not elsewhere. Not yet tested: granting the optional
  permission (Chrome's prompt needs a real click).
- **Next for offers:** the Cloudflare sync job (network APIs → `api/offers.json` or KV) once a
  network actually supplies an extension-approved code.
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

Secrets live in `.env` (gitignored, chmod 600) — Awin and impact.com tokens, with account IDs in
the comments. `.env.example` documents the keys. **The repo is public**, so never commit the real
file; both tokens were pasted into a chat during the first session and should be rotated.

Query the Awin API with:

```bash
set -a && . ./.env && set +a
curl -s -H "Authorization: Bearer $AWIN_API_TOKEN" \
  "https://api.awin.com/publishers/$AWIN_PUBLISHER_ID/programmes?relationship=notjoined" | head -c 400
```

The single highest-value thing that isn't code: the 10–20 person test in `VALIDATION.md`. It's the
only item on the critical path that doesn't depend on Awin, a charity, or Google.
