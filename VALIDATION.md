# Validating Omryus with 10–20 people

The MVP has no real partnerships and earns nothing. It is not a revenue test. It exists to
answer three questions before you spend money:

1. Does the extension actually work on the checkouts real people use?
2. Do people want this enough to keep it installed?
3. Which merchants do they want — is there a list worth approaching affiliate programmes about?

**There is no traction yet, and nothing in this repo should be presented as though there is.**
Every number below is one you have to go and collect.

---

## Before you recruit anyone

- [ ] Replace the mock offers with something real enough to test. You have two honest options:
      **(a)** join one affiliate programme yourself and use its genuine code, or **(b)** use
      publicly-advertised codes with `source: "mock"` left on and no commission. Do **not**
      invent codes — a code that fails at checkout kills the test and the tester's goodwill.
- [ ] Test all six mock checkouts yourself (`npm run mock`), then five real stores.
- [ ] Write the install instructions as if for someone who has never seen `chrome://extensions`.
      Developer-mode installs are where most of your testers will drop out.
- [ ] Decide how you'll hear from them: a 10-minute call beats any form for the first five.

## Who to recruit

Aim for 10–20, and bias towards people who shop online weekly and are **not** developers.
Five people you can watch use it are worth fifty who install it and go quiet. Include at least
three who are mildly sceptical of browser extensions — their objections are the ones that will
show up in Chrome Web Store reviews.

---

## What to ask

### Before they install (2 minutes, before you describe the product)

1. When you're checking out online and see a "discount code" box, what do you do?
2. Have you ever used a coupon extension? What happened?
3. Do you have a sense of how free coupon extensions make money?

Question 3 is the important one. If most people already know it's affiliate commission, your
disclosure is a non-issue. If nobody does, disclosure is a trust problem you'll need to lead with.

### After a week

4. Did a card ever appear? What did you do?
5. If you dismissed it — what made you dismiss it rather than try it?
6. Did it ever get in your way?
7. Which store do you wish it had worked on?
8. Is it still installed? *(If not: what made you remove it? This is the single most useful answer.)*
9. Would you mind if we earned a commission when you used a code? *(Ask plainly. Watch the face.)*

### For the five you can watch

Sit with them on a real checkout. Say nothing. Note: how long before they notice the card, whether
they read the disclosure line, whether they understand "Code inserted" means the store still has
to accept it, and whether they hunt for the store's own Apply button.

---

## What to record

Keep it in a spreadsheet. One row per tester.

| Field | Why |
|---|---|
| Installed (y/n) and how long it took | Developer-mode install is your biggest funnel drop |
| Still installed at day 7 / day 14 | The retention number that matters |
| Times a card was shown | From their Settings page — ask them to read it out |
| Times applied / dismissed | Same place. Apply ÷ shown is your core conversion |
| Code actually accepted by the store | The one thing the extension can't tell you |
| Stores they wanted and didn't get | Your merchant roadmap |
| Verbatim complaints | Rewrite these as your Chrome Web Store review risks |

Four counters live on each tester's Settings page. They never leave the device, so you have to
ask for them — which is a feature at this size: every number comes with a conversation.

## What would count as genuine interest

Rough thresholds for a 10–20 person test. They're judgement calls, not science:

- **Encouraging:** more than half still installed at two weeks; most people who saw a card clicked
  Apply at least once; at least three unprompted "can you add *this* store" requests.
- **Neutral:** people try it once, it works, they forget about it. Usually means the card doesn't
  appear often enough — a coverage problem, not a product problem. Fix coverage, retest.
- **Discouraging:** people uninstall after seeing the card, or say the disclosure put them off, or
  can't tell you what the extension did. Any of these means stop and rethink before spending money.

**One clear failure signal beats ten vague positives.** "I uninstalled it because I didn't trust
it" is worth more to you than nine people saying "yeah, seems useful."

## Problems to watch for

- **Codes that don't work.** Fatal to trust, and the fastest way to one-star reviews. Track
  `lastTested` religiously; an untested code is a liability.
- **The install cliff.** Most testers won't get through developer mode without help. Expect this
  and don't read it as disinterest.
- **Silent non-appearance.** If the card never shows, you learn nothing. Check their Settings
  counters early — if `offer_displayed` is 0, the test hasn't started.
- **Politeness.** People will tell you it's nice. Ask "is it still installed?" instead.
- **You are not the user.** You know what the card means. They don't.

## Finding out which merchants people actually want

Cheapest first:

1. **Ask.** Question 7 above. Ten people will name the same three or four stores.
2. **Ship a "request a store" link** in the popup — a mailto or a form. No backend needed.
3. **Check the affiliate networks first.** Awin, Impact, CJ, Rakuten and Partnerize publish their
   merchant lists. Wanting a store is irrelevant if its programme doesn't allow extensions.

## Approaching affiliate programmes

Be straight with them — coupon extensions have a bad reputation with merchants, largely earned,
and pretending otherwise gets you rejected.

1. **Read the programme terms before applying.** Many explicitly ban browser extensions, toolbars,
   or "last-click coupon" publishers. Applying anyway wastes everyone's time.
2. **Have the landing page and privacy policy live first.** They will look.
3. **Lead with what makes you different:** explicit user action before any code, no cookie
   dropping, no overwriting another affiliate's attribution, no injection on pages with no offer.
   That last point is what merchants actually care about — they're tired of paying commission on
   sales they already had.
4. **Apply to one network, not five.** Learn what they ask before you scale the pitch.
5. **Never imply you have a partnership you don't.** Not on the site, not in the store listing,
   not in the extension. Beyond the ethics, it's grounds for removal from both the network and
   the Chrome Web Store.

## What you'd want before spending money

In rough order — don't skip ahead:

1. **Ten people who installed it and five still using it at two weeks.** Costs nothing but time.
2. **A list of 5–10 merchants people asked for, of which at least three run programmes that
   permit extensions.** Costs nothing; a few hours reading terms.
3. **One approved affiliate programme.** Free to apply. This is the real gate — if you can't get
   approved, no amount of infrastructure helps.
4. **Evidence that editing `offers.json` is genuinely the bottleneck.** If you're updating offers
   weekly and waiting on store review, an API starts paying for itself. If you're updating
   monthly, it doesn't.
5. **Chrome Web Store approval.** Free, and a real test of the compliance work. Do this before
   building anything else.

Only after all five does a backend, a database or an admin dashboard make sense. A hosted
`offers.json` on a static file host costs nothing and covers step 4 for a long time.

## What this MVP deliberately cannot tell you

- Whether anyone would **pay** for it — nothing here charges anyone.
- Whether it makes money — `code-only` attribution earns nothing.
- Whether it works at scale — ten people on five stores is not a load test.
- Whether Chrome would approve it — only submitting tells you that.

Don't let a good week of testing get reported as more than it is.
