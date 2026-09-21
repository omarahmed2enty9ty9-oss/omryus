# Hyperframes Composition Brief: Omryus (v2 — charity-led)

## Objective
A warm, Honey-shaped teaser whose lead claim is that you can fund a donation at checkout
without spending anything, with discounts as the second half and "free, always free" as the
closing note.

## Output
- Composition directory: `<outdir>/composition/`
- Rendered video: `<outdir>/brag.mp4`
- Format: vertical — 1080x1920 · Duration: 22.65s

## Source Material
- Project root: `/home/omryus/Projects/Omryus Extension`
- Files read: `site/style.css` (post-repalette), `extension/src/content/offer-card.js`,
  `mock-store/cart-nodiscount.html`, `mock-store/cart-static.html`, `extension/icons/mark.svg`
- Copy that must appear verbatim:
  - "Fund a donation with your order" / "This code won't lower your price." / "Add the code" / "No thanks"
  - "20% off your order" / "We have a partner code for this store." / "Apply discount" / "Dismiss"
  - `MOCK20`
  - "Find discounts while you shop."

## Creative Direction
- Tone preset: default · Direction: warm and plain-spoken — a Honey-shaped ad for a product that behaves
- Hook: "Give to charity — without spending a penny."
- Outro: "Free. Always free."
- Avoid: naming or attacking Honey; generic SaaS language; urgency; exclamation marks; any
  claim about savings amounts we cannot evidence.

## Visual Identity (the site's new porcelain palette)
- paper `#FBF9F5` · surface `#FFFFFF` · tile `#EFEDE7` · line `#E5E2DB`
- ink `#191722` · soft `#6B6878` · faint `#8E8A99`
- accent `#FCA429` · amber-as-text `#8A5A08` · wash `#FDF3E1` · primary navy `#14243C`
- Instrument Serif (display) · Hanken Grotesk (body) · Spline Sans Mono (figures, code, totals)
- Fonts already shipped in `composition/assets/fonts/` — add Hanken Grotesk and Spline Sans Mono.

## Storyboard
See `brag-plan.md`. Scene summary:
1. Hook — 3.70s — "Give to charity / without spending a penny."
2. The donation made concrete — 5.26s — donation card, Add the code, **total stays £50.00**
3. The mechanism — 3.69s — "The shop pays. Not you."
4. Real discounts too — 5.26s — 20% card, Apply discount, `MOCK20`, total drops to £58.80
5. Free, always free — 4.74s — mark, OMRYUS, "Free. Always free."

The argument is carried by the totals: unchanged in scene 2, reduced in scene 4. Make both legible.

## Audio
- Music: `happy-beats-business-moves-vol-11-by-ende-dot-app.mp3`, volume 0.30, fade in 0.6s,
  fade out 21.3s → 22.65s
- Cues (bundled preset, 114.84 BPM): scene cuts on strong cues 3.70 / 8.96 / 12.65 / 17.91;
  donation click locked to 6.34; mark lands on the beat at 18.96. Beat grid for entrances:
  4.23, 6.86, 13.18, 15.28, 15.81, 19.42.
- SFX: soft drop on each card arrival, UI click on each cursor click, light placement on each
  code landing, one soft bell on the mark. Volumes 0.55–0.68. Nothing on text or crossfades.
- Audio-reactive: none; the amber wash breathes on a timed sine.

## Hyperframes Instructions
Use `hyperframes-core` conventions. Keep all text readable at phone size; reading floors are in
the plan. Local assets only. `npx hyperframes check` must pass with zero errors before render.
