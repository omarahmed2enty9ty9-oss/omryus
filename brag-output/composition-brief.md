# Hyperframes Composition Brief: Omryus

## Objective
Create a short launch-style teaser for Omryus, a Chrome extension that offers partner
discount codes at checkout and inserts one only after the shopper clicks.

## Output
- Composition directory: `brag-output/composition/`
- Rendered video: `brag-output/brag.mp4`
- Format: vertical — 1080x1920
- Duration: 19.66s

## Source Material
- Project root: `/home/omryus/Projects/Omryus Extension`
- Primary files read: `site/index.html`, `site/style.css`, `extension/src/content/offer-card.js`,
  `extension/src/data/offers.json`, `mock-store/cart-static.html`,
  `mock-store/cart-nodiscount.html`, `extension/icons/mark.svg`, `README.md`
- Product name: Omryus
- Tagline / strongest claim: "Find discounts while you shop." / "We'd rather give it away than pretend."
- Key UI to recreate: the injected offer card from `offer-card.js` — a rounded surface card with
  an 8px amber dot, a 15px semibold title, a secondary line, an 11px faint meta line, and two
  buttons (primary solid + secondary outlined). It sits over a checkout summary.
- Copy that must appear verbatim:
  - "20% off your order"
  - "We have a partner code for this store."
  - "Apply discount"
  - "Dismiss"
  - "Code inserted"
  - "Fund a donation with your order"
  - "This code won't lower your price."
  - "Add the code"
  - "Find discounts while you shop."
  - `MOCK20` (the code that lands in the field)

## Creative Direction
- Tone preset: polished
- Creative direction: the anti-Honey teaser — the honest coupon extension, restraint as the flex
- Interpretation: 5 scenes, longer holds, soft crossfades, no caps-lock, no exclamation marks.
  Confident unhurried motion; the copy carries the video, not the animation.
- Angle: Every free coupon extension is monetised somehow and almost none say how. Omryus says
  how, in the product UI. The teaser names the thing the category avoids, shows the real card
  doing real work, then lands on the awkward case — a code that saves you nothing — and shows
  Omryus refusing to dress it up.
- Hook: "Every free coupon extension makes money somehow."
- Outro / punchline: the mark + "OMRYUS" + "Find discounts while you shop."
- Avoid:
  - Generic SaaS language
  - Abstract filler visuals
  - Unrelated visual redesign — the card must look like the shipped card
  - Hype framing (no "10x", no urgency, no exclamation marks)

## Visual Identity
- Background: `#0b1728`
- Surface (cards/checkout): `#12213a`
- Text: `#eaf1f5`; secondary `#a4b5c4`; faint `#74869a`
- Accent: `#fcb04a`
- Line/border: `#23364f`
- Display font: Instrument Serif (Google Fonts; fall back to Georgia/serif)
- Body font: Inter (Google Fonts; fall back to system-ui)
- Visual references: the offer card (shadow-DOM card in `offer-card.js`), the checkout summary
  rows from `mock-store/cart-static.html`, the vector mark at `extension/icons/mark.svg`
  (copy it into the composition assets).

## Storyboard
Use the storyboard in `brag-output/brag-plan.md` as the creative contract.

Scene summary:
1. Hook — 3.27s (0.00→3.27) — one serif line, near-black, faint amber glow
2. The product doing its job — 5.47s (3.27→8.74) — checkout + card + cursor click + `MOCK20` lands
3. The awkward case — 4.90s (8.74→13.64) — donation card, "This code won't lower your price."
4. Restraint — 2.74s (13.64→16.38) — "No server. No account. No tracking."
5. Outro — 3.28s (16.38→19.66) — mark + OMRYUS + "Find discounts while you shop."

## Audio
- Audio role: low steady bed with sparse professional accents
- Audio arc: bed fades in under the hook (unscored), three dry accents across the product scene,
  deliberate silence over the donation scene, one soft bell on the logo, music fades out under
  the final line.
- Music: `happy-beats-business-moves-vol-12-by-ende-dot-app.mp3` at volume 0.30
- Music treatment: fade in 0→0.6s; hold 0.30; fade out from ~18.3s to silence at 19.66s.
- Music cue guidance: bundled preset at
  `assets/music/cues/happy-beats-business-moves-vol-12-by-ende-dot-app.music-cues.json`
  (109.96 BPM). Lock 3 strong cues: **8.74s** (cut into scene 3), **9.29s** (donation card
  lands), **17.47s** (mark lands). Beat grid for smaller entrances: 3.82 (card slide-in),
  6.56 (cursor click), 7.09 (code lands).
- Audio-reactive treatment: subtle — amber glow behind the card and behind the outro mark
  breathes with music RMS. No waveform, equaliser, particles, or text scaling.
- Audio-coupled moments:
  - Scene 2 card slide-in — soft drop
  - Scene 2 cursor click on "Apply discount" — UI click
  - Scene 2 `MOCK20` landing in the field — light placement
  - Scene 5 mark landing — single soft bell
- SFX selection guidance: dry and small. Suggested families: `interface/drop_*` for the card,
  `ui/mouseclick1` or `interface/click_*` for the cursor, `interface/drop_*` or
  `impact/impactGeneric_light_*` for the code landing, `impact/impactBell_heavy_000` for the
  logo. Nothing on text entrances, nothing on crossfades, nothing on the hook.
- SFX analysis guidance: `~/.claude/skills/brag/assets/sfx/sfx-analysis.md` — prefer low
  high-frequency-risk files; this is a polished edit.
- Exact SFX choice: Hyperframes chooses filenames, timestamps, density and volume after the
  animation exists. Volumes 0.55–0.70.
- Audio files: copy the chosen music and SFX into `brag-output/composition/assets/`

## Hyperframes Instructions
Load the composition-building Hyperframes domain skills — `hyperframes-core`,
`hyperframes-animation`, `hyperframes-creative`, `hyperframes-keyframes`, `hyperframes-cli`.
This is the `/brag` workflow: do not enter the `hyperframes` entry-point intent interview and do
not route into its generic promo / launch-video workflow. Prefer native Hyperframes conventions.

Requirements:
- Show the real offer card and real product copy — this is the "show the thing" law.
- Portrait 1080x1920. All text must sit inside safe margins and stay readable at phone size.
- Reading floors: the hook holds ~2.4s settled; the donation card's lead sentence holds ~2.0s
  settled; no readable line enters and leaves inside 0.8s.
- Keep total duration 19.66s.
- Include the music bed and the four planned accents.
- Treat cue metadata as timing hints; ignore any cue that hurts readability.
- Use local assets only — no absolute paths, no remote runtime fetches.
- Run `npx hyperframes check` before render and fix everything it reports, including contrast.
