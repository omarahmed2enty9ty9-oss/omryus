# Architecture

## The shape of it

```
┌─────────────────────────────────────────────────────────────┐
│  Service worker  (background.js)                            │
│  Owns every rule. Knows the merchants, offers and codes.    │
│                                                             │
│   offer-source.js  →  offers.json  (later: an HTTPS API)    │
│   offers.js        →  validate · match domain · check expiry│
│   affiliate.js     →  what are we allowed to do?            │
│   analytics.js     →  four local counters                   │
└──────────────▲──────────────────────────────▲───────────────┘
      messages │                              │ messages
┌──────────────┴───────────────┐   ┌──────────┴───────────────┐
│  Content script              │   │  Popup                   │
│  The only code in the page.  │◄──┤  Asks the content script  │
│  Knows nothing about which   │   │  what's on this tab, so   │
│  merchants exist.            │   │  it needs no permissions. │
│                              │   └──────────────────────────┘
│   offer-card.js  shadow DOM  │
│   find-field.js  deep query  │
│   insert-code.js  events     │
└──────────────────────────────┘
```

**The one rule that shapes everything:** the content script knows nothing. It asks
*"is there an offer for this URL?"* and later *"the user clicked Apply — what's the code?"*.
All merchant logic lives in the worker, so replacing `offers.json` with an API touches
exactly one file and no page-facing code.

## Message protocol

| Message | Direction | Returns |
|---|---|---|
| `GET_OFFER {url}` | content → worker | `{offer}` — title, merchant, terms. **Not the code.** |
| `APPLY_OFFER {offerId, url}` | content → worker | `{code, fieldSelectors, applyButtonSelectors}` |
| `OFFER_DISPLAYED {offerId}` | content → worker | `{ok}` |
| `DISMISS_OFFER {offerId}` | content → worker | `{ok}` |
| `POPUP_STATE` | popup → content | `{supported, offer}` |
| `POPUP_APPLY` | popup → content | `{ok}` |

**The code is not sent into the page until the user clicks Apply.** That isn't decoration:
it makes the policy boundary — *related user action before any affiliate code* — a visible
line in the code rather than a promise in a doc.

## Why the permissions are what they are

| Permission | Why |
|---|---|
| `storage` | Dismissals, settings, counters |
| `host_permissions` | Generated from `offers.json` — only stores with a live offer |
| ~~`tabs`~~ | Not needed. The popup gets the tab id (no permission) and messages the content script |
| ~~`activeTab`~~ | Not needed, for the same reason |
| ~~`scripting`~~ | Declarative `content_scripts` is enough |
| ~~`cookies`~~ | We never touch cookies. That's the point |

Expired and deactivated offers are filtered out of the generated manifest, so we don't hold
access to a site whose offer can't fire.

## Chrome Web Store compliance, by design

Policy ([affiliate ads](https://developer.chrome.com/docs/webstore/program-policies/affiliate-ads),
tightened 2025, with further data-collection rules enforced from 1 August 2026) requires three
things. Each maps to a specific place in the code:

| Requirement | Where it's enforced |
|---|---|
| Disclosed before install, in the listing, and in the UI | Card footer, popup, options page, landing page |
| Related user action before *each* affiliate code | The code only leaves the worker in response to `APPLY_OFFER` |
| Real user benefit at that moment, tied to core purpose | We only show a card when a live offer exists; `affiliate.js` refuses anything else |
| Data collection strictly necessary to a single purpose | No network calls exist. Counters are local and can be switched off |
| No remotely hosted code (MV3) | `npm run build` bundles everything. Remote *data* is allowed later; remote code never |

**Not overwriting other people's attribution** isn't policed by a check — it's structural.
`code-only` attribution can't overwrite a cookie or a referral parameter because it never
touches either. When link-based networks arrive, that guarantee has to be re-earned explicitly
(see below).

## Where the money isn't

`affiliate.js` ships one provider (`mock`) and one mode (`code-only`). `attributionMode: "link"`
is in the schema and is **refused at runtime**. The MVP earns nothing by design — it's testing
whether people want this, not whether it pays.

Adding a real network is one function:

```js
registerProvider({ name: 'awin', resolve: (offer) => ({ mode: 'code-only', code: offer.code }) });
```

Before any provider returns a `link` mode, it will need to answer: how do we detect that another
affiliate already has attribution, and what do we do when they have? Until there's an answer,
`link` stays refused.

## Handling real checkouts

| Problem | Solution | File |
|---|---|---|
| React/Vue ignore `el.value = x` | Call the prototype's native setter, then dispatch bubbling `input` + `change` | `insert-code.js` |
| The box renders after a fetch | `MutationObserver`, 10s budget, then fall back to showing the code | `find-field.js` |
| The box is in a web component | Recursive walk into open shadow roots | `find-field.js` |
| The box is in an iframe | Not supported yet — top frame only, so no duplicate cards and less page access | `content.js` |
| The store's CSS breaks our card (or vice versa) | Our UI lives in its own shadow root with `all: initial` | `offer-card.js` |
| A selector in offer data is malformed | `try/catch` per selector; the rest still run | `find-field.js` |
| An offer's title contains HTML | Escaped before it reaches the page | `offer-card.js` |
| We'd write into a password or card field | Refused by input type and `cc-*` autocomplete | `find-field.js` |

## Growing up

Today everything is one folder of static files. The path out, in the order it should happen:

**Step 1 — offers behind an API.** Replace `LocalOfferSource` with a `RemoteOfferSource` that
fetches JSON over HTTPS and caches it in `chrome.storage` with a bundled copy as the fallback.
Nothing else changes. MV3 allows remote *data*; keep treating offer fields as inert strings.
Worth doing when editing `offers.json` and shipping a release becomes the bottleneck.

**Step 2 — an admin page.** Once you're editing offers more than weekly: a form to add a
merchant, toggle an offer, and record `lastTested`. Until then a text editor and a pull request
is a perfectly good admin dashboard.

**Step 3 — real affiliate providers.** One `AffiliateProvider` per network. This is also when
attribution stops being trivially safe and needs real thought.

**Step 4 — aggregate analytics.** Only if the local counters aren't answering your questions.
Swap the body of `track()`, update the privacy policy and the store listing *before* shipping it.

```
Chrome Extension
      │
      ▼
    API  ──┬── Offer database
           ├── Affiliate network integrations
           ├── Merchant management
           ├── Aggregate analytics
           └── User preferences
      │
Admin dashboard ── add merchant · add offer · test code · toggle · performance
```

Don't build any of it until the MVP proves people want the product. [VALIDATION.md](VALIDATION.md)
says what that proof looks like.
