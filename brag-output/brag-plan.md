# Brag Plan: Omryus

## What is this app?
A free Chrome extension (Manifest V3) that offers a partner discount code on supported
checkout pages and inserts it only after the shopper clicks — and when a partner code
carries no discount at all, it offers it as a donation instead of pretending it's a saving.

## The angle
Every free coupon extension is monetised somehow, and almost none of them say how. Omryus
says how, out loud, in the product UI. The teaser is built on that inversion: it opens by
naming the thing the category avoids, shows the real card doing real work, then lands on the
awkward case — a code that saves you nothing — and shows Omryus refusing to dress it up.
Restraint is the flex. No hype, no "10x savings", no fake urgency.

## Hook (first 2-3 seconds)
One line of Instrument Serif on near-black:
**"Every free coupon extension makes money somehow."**
It's an accusation the viewer has already half-thought. It buys the next 16 seconds.

## Key moments (the middle)
- The real offer card sliding up over a real checkout, then a cursor clicking **Apply
  discount** and `MOCK20` landing in the discount field — the product doing its job, not
  describing it.
- The donation card, which opens with the bad news first: **"This code won't lower your
  price."** That sentence is the whole brand.
- One restraint beat: no server, no account, no tracking.

## Outro / punchline
The mark, the wordmark, and the site's own hero line: **"Find discounts while you shop."**
Understated on purpose — after the donation beat, a hype outro would undo the argument.

## User flow worth showing
Entry → key action → result, taken from the working extension and its mock checkout fixtures:
1. Shopper is on a cart page; the card appears bottom-right (once, dismissible).
2. Shopper clicks **Apply discount** — nothing happens before this.
3. The code is inserted into the store's discount field and the card confirms it.
Then the second flow, which is the differentiator: on a page with no discount available, the
same card appears reading **"Fund a donation with your order"** with an **Add the code** button.

## Tone
- Preset: polished
- Creative direction: the anti-Honey teaser — the honest coupon extension, restraint as the flex
- Interpretation: 5 scenes, longer holds, soft crossfades, no caps-lock, no exclamation marks.
  Motion is confident and slow-ish; the copy carries the video. Sound is a low bed with three
  dry accents, not a hype layer.

## Format: vertical — 1080x1920
## Duration: 19.7s target

## Visual identity (from the project)
- Background: `#0b1728` (site `--paper`, dark)
- Surface: `#12213a` (site `--surface`, dark)
- Text: `#eaf1f5` (`--ink`) / `#a4b5c4` (`--ink-soft`)
- Accent: `#fcb04a` (`--accent`, dark) — the sparkle in the mark
- Line: `#23364f`
- Display font: Instrument Serif
- Body font: Inter
- Strongest visual element: the injected offer card (shadow-DOM card, amber dot, navy
  primary button) sitting over a checkout summary. Source: `extension/src/content/offer-card.js`
  and `mock-store/cart-static.html` / `cart-nodiscount.html`. Logo: `extension/icons/mark.svg`.

## Share copy (draft)
Omryus finds partner discount codes at checkout and does nothing until you click. When a
code saves you nothing, it says so — and 100% of that commission goes to Medical Aid for
Palestinians.

## Audio direction
- Role: low, steady bed with sparse professional accents
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` (steady and clean; the
  polished/cinematic pick)
- Music treatment: start at 0, volume 0.30, fade in over 0.6s, fade out under the outro from
  ~18.3s to silence at 19.66s. Never competes with the copy.
- Music cue guidance: bundled preset read (`cues/...vol-12....music-cues.json`, 109.96 BPM).
  Strong cues to target: **8.74s** (cut into the donation scene), **9.29s** (donation card
  lands), **17.47s** (logo lands). Beat grid for scene cuts: 3.27 / 8.74 / 13.64 / 16.38.
  Three strong locks only — this is a restrained edit.
- Audio-reactive treatment: subtle; let the amber accent glow behind the card and the outro
  mark breathe with music RMS. No waveform, equaliser, or particle visuals.
- SFX posture: sparse — three cues total, 0.55–0.70 volume. Motion-matched, dry, no stingers.
- Audio-coupled moments: card slide-in (soft drop), simulated cursor click on Apply (UI click),
  code landing in the field (light placement), logo landing (single soft bell).
- Restraint rule: no SFX on text entrances, no riser, no whoosh on crossfades, nothing on the
  hook line. If the edit feels busy, cut a cue rather than lowering it.

## Storyboard

### Scene 1 — Hook — 3.27s (0.00 → 3.27)
Near-black `#0b1728`. Centred Instrument Serif, large, generous leading, portrait-safe margins:
"Every free coupon extension makes money somehow."
Nothing else on screen. A very faint amber radial glow low in the frame, breathing with the bed.
Sequential/interaction: none — one line, fast-in (0.45s) then a long settled hold (~2.4s).
Audio intent: bed establishes quietly; the line lands in silence, no accent.
Audio-coupled idea: none — deliberately unscored.
Music: steady, low, fading in.
Transition mood: soft crossfade (0.4s) → Scene 2

### Scene 2 — The product doing its job — 5.47s (3.27 → 8.74)
A recreated checkout summary card, centred in portrait: "1 × Merino scarf £48.00",
"1 × Wool hat £22.00", "Delivery £3.50", rule, "Total £73.50", then a "Discount code" field
with an "Apply" button. Real Omryus card slides up from the bottom and settles over the lower
third: amber dot, "20% off your order", "We have a partner code for this store.", meta line,
then the two buttons "Apply discount" / "Dismiss".
A cursor moves to "Apply discount" and clicks. The card swaps to "Code inserted" and `MOCK20`
appears in the store's discount field.
Sequential/interaction: yes — card slide-in (~3.82s, beat), cursor travel, click (~6.56s beat),
code lands in the field (~7.09s beat), card confirms.
Audio intent: the product feels tactile and real; three small sounds, nothing triumphant.
Audio-coupled idea: soft drop on card arrival; UI click on the cursor click; light placement
when `MOCK20` lands in the field.
Music: steady, unchanged.
Transition mood: hard-ish cut on the strong cue at 8.74s → Scene 3

### Scene 3 — The awkward case — 4.90s (8.74 → 13.64)
Same checkout, but the total now reads "Total £50.00 (no discount available)". The Omryus card
returns — visually identical, completely different words:
"Fund a donation with your order" / "This code won't lower your price. If you use it, we donate
every penny of the commission to Medical Aid for Palestinians and keep none of it." Button
reads "Add the code", not "Apply discount".
The button label difference is the point — let it be legible.
Sequential/interaction: yes — card lands on the strong cue at 9.29s; the button label is the
last thing to settle.
Audio intent: no accent on the card here — the silence after the cut does the work.
Audio-coupled idea: none. Deliberate.
Music: steady; this is the emotional centre, let the copy sit.
Transition mood: soft crossfade (0.4s) → Scene 4

### Scene 4 — Restraint — 2.74s (13.64 → 16.38)
Type only, centred, Instrument Serif: "No server. No account. No tracking."
Below it, small Inter, `--ink-soft`: "Nothing leaves your browser."
Sequential/interaction: none — both lines in together, one read.
Audio intent: bed only; a small lift going into the outro.
Audio-coupled idea: none.
Music: steady, beginning to open up.
Transition mood: soft crossfade (0.35s) → Scene 5

### Scene 5 — Outro — 3.28s (16.38 → 19.66)
The mark (hat + lens + amber sparkle) scales in and settles, wordmark "OMRYUS" in uppercase
Inter beside/below it, then the hero line in Instrument Serif: "Find discounts while you shop."
Small Inter line under it, `--ink-faint`: "Free Chrome extension. Coming soon."
Sequential/interaction: yes — mark lands on the strong cue at 17.47s, wordmark 0.25s later,
tagline 0.5s after that, all holding to the end.
Audio intent: one soft bell on the mark landing; music fades out underneath so the last
half-second is nearly dry.
Audio-coupled idea: single soft bell at 17.47s, timed with the mark.
Music: fade from ~18.3s to silence at 19.66s.
Transition mood: hold to black.

**Music mood for this video:** steady, clean, quietly confident — never hype
**Audio summary:** A low bed runs the whole way with exactly three dry accents in the product
scene and one soft bell on the logo; the donation scene is deliberately unscored so the copy
lands in near-silence, and the music fades out under the final line.
