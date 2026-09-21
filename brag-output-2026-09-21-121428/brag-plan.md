# Brag Plan: Omryus (v2 — charity-led)

## What changed from v1, and why
v1 opened with "Free coupon extensions make money somehow." That is commentary about a
*category of software*, which reads as someone promoting their extension-building rather than
promoting a product — and it buries the only thing about Omryus nobody else can say. v2 leads
with the donation, keeps "free, always free" as a repeated note (the single most-used line in
Honey's own ad reads), and treats discounts as the second half rather than the whole pitch.
It also moves to the site's new porcelain palette.

## What is this app?
A free Chrome extension that offers partner discount codes at checkout — and when a partner
code carries no discount at all, offers it as a donation instead, passing 100% of that
commission to Medical Aid for Palestinians.

## The angle
You can give to charity without spending anything. That sounds like a trick, and the video's
job is to show in ten seconds that it isn't: the shop pays the commission, not the shopper, and
Omryus keeps none of it. Then the ordinary benefit — real discounts — lands as a bonus rather
than the headline. The whole thing is free and says so twice.

Honey's ad formula is benefit → mechanism → "it's free", repeated, with no commentary about the
category. v2 borrows that shape. It does **not** name Honey: the contrast with a competitor
caught hijacking attribution is better embodied than stated, and picking a fight with a
PayPal-owned brand buys nothing.

## Hook (first 2-3 seconds)
Porcelain. Instrument Serif, two lines:
**"Give to charity — without spending a penny."**
Counterintuitive, true, and the one claim no other coupon extension can make.

## Key moments (the middle)
- The donation card landing on a real checkout that says **"No discount available"** — the
  awkward case made concrete, with the shopper clicking **Add the code** and nothing changing
  about the total.
- The mechanism in one line: **"The shop pays. Not you."** / "Your bank balance doesn't change."
- The ordinary benefit: a real 20%-off card, **Apply discount** clicked, `MOCK20` landing in
  the store's field, total dropping.

## Outro / punchline
Mark, wordmark, and **"Free. Always free."** — the Honey note, delivered once, plainly.

## User flow worth showing
1. Shopper reaches a checkout with no discount available → donation card → **Add the code** →
   total unchanged, donation funded.
2. Shopper reaches a checkout that does have a code → **Apply discount** → `MOCK20` lands →
   total drops from £73.50 to £58.80.
Showing the total *not* changing in flow 1 and *changing* in flow 2 is the whole argument.

## Tone
- Preset: default
- Creative direction: warm and plain-spoken — a Honey-shaped ad for a product that behaves
- Interpretation: 5 scenes, comfortable pacing, warm porcelain rather than austere dark.
  Friendlier than v1 without becoming hypey: no exclamation marks, no urgency, no "10x".

## Format: vertical — 1080x1920
## Duration: 22.65s target

## Visual identity (from the project, post-repalette)
- Background: `#FBF9F5` porcelain; surface `#FFFFFF`; tile `#EFEDE7`
- Text: `#191722` ink, `#6B6878` soft, `#8E8A99` faint
- Accent: `#FCA429` amber; amber-as-text `#8A5A08`; wash `#FDF3E1`
- Primary action: navy `#14243C` on white
- Line: `#E5E2DB`
- Display font: Instrument Serif · Body: Hanken Grotesk · Figures: Spline Sans Mono
- Strongest visual: the injected card over a checkout, in its light-mode form

## Share copy (draft)
Omryus is a free Chrome extension that finds partner discount codes at checkout. When a code
wouldn't lower your price, it says so — and gives 100% of that commission to Medical Aid for
Palestinians. You give nothing. Free, and staying free.

## Audio direction
- Role: warm bed with sparse, motion-matched accents
- Music: `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3` (warm, 114.84 BPM)
- Music treatment: volume 0.30, fade in over 0.6s, fade out from ~21.3s to silence at 22.65s
- Music cue guidance: bundled preset read. Scene cuts land on strong cues **3.70 / 8.96 /
  12.65 / 17.91**; the donation-card "Add the code" click locks to **6.34**, and the mark lands
  on the beat at **18.96**. Three strong locks plus beat-grid entrances.
- Audio-reactive treatment: none — the amber hero wash breathes on a timed sine instead, which
  reads identically at this scale without an extraction dependency.
- SFX posture: sparse — five cues, 0.55–0.68 volume, dry
- Audio-coupled moments: each card arrival (soft drop), each cursor click (UI click), the code
  landing (light placement), the mark landing (soft bell)
- Restraint rule: nothing on text entrances, nothing on crossfades, nothing on the hook

## Storyboard

### Scene 1 — Hook — 3.70s (0.00 → 3.70)
Porcelain, warm amber wash low-left. Centred Instrument Serif, two lines:
"Give to charity" / "without spending a penny."
Sequential/interaction: none — lines stagger in over 0.55s, then a ~2.5s settled hold.
Audio intent: warm bed establishes; the line lands unscored.
Music: fading in.
Transition mood: soft crossfade → Scene 2

### Scene 2 — The donation, made concrete — 5.26s (3.70 → 8.96)
A light checkout: "1 × Test Widget £50.00", "Delivery Free", "Total £50.00", and a field reading
"No discount available". The Omryus card rises in: "Fund a donation with your order" /
"This code won't lower your price." / meta naming Medical Aid for Palestinians / buttons
"Add the code" and "No thanks". A cursor clicks **Add the code**; the code lands in the field and
**the total stays £50.00** — a small amber "Total unchanged" note confirms it.
Sequential/interaction: yes — card at 4.23 (beat), cursor travel, click at 6.34 (strong cue),
code + unchanged-total note at 6.86.
Audio intent: tactile and small; three dry sounds.
Transition mood: clean cut on the strong cue at 8.96 → Scene 3

### Scene 3 — The mechanism — 3.69s (8.96 → 12.65)
Type only. Instrument Serif: "The shop pays. Not you."
Below, Hanken Grotesk: "Your bank balance doesn't change. We keep none of it."
Sequential/interaction: none — one read, held.
Audio intent: bed only; let the claim sit.
Transition mood: soft crossfade → Scene 4

### Scene 4 — Real discounts too — 5.26s (12.65 → 17.91)
Small serif topline: "And when there is a discount —". A second checkout: £73.50 total, the
20%-off card, cursor clicks **Apply discount**, `MOCK20` lands in the field and the total drops
to **£58.80** with the old figure struck through.
Sequential/interaction: yes — card at 13.18 (beat), click at 15.28 (beat), code + new total at
15.81 (beat).
Audio intent: the same three sounds as scene 2, so the two flows rhyme.
Transition mood: soft crossfade → Scene 5

### Scene 5 — Free, always free — 4.74s (17.91 → 22.65)
The mark scales in and settles on the beat at 18.96, wordmark "OMRYUS" behind it, then the line
in Instrument Serif: "Free. Always free." Small Hanken line: "Find discounts while you shop.
Coming soon to Chrome."
Sequential/interaction: yes — mark 18.96, wordmark 19.42, line 19.90, fine print 20.60.
Audio intent: one soft bell on the mark; music fades out under the last line.
Transition mood: hold.

**Music mood for this video:** warm, friendly, unhurried — a kind ad, not a hype reel
**Audio summary:** A warm bed runs throughout with five dry accents; the two checkout flows use
identical sounds so they rhyme, and a single soft bell marks the logo before the music fades.
