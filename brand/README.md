# Brand assets

Generated with `npm run logos`. The master is `extension/icons/mark.svg` — edit that, never these.

| File | Use |
|---|---|
| `omryus-mark-1024.png` | Square logo on white. Affiliate network profiles, most upload fields. |
| `omryus-mark-2048.png` | Same, for anything that wants more resolution. |
| `omryus-mark-2048-alpha.png` | Transparent. For placing on a coloured ground. |
| `omryus-lockup-2048.png` | Mark + wordmark, horizontal, white. Headers, press, slides. |

`HankenGrotesk.woff2` is the wordmark face (Hanken Grotesk 700, uppercase, +0.012em tracking),
kept here so `npm run logos` is self-contained.

Colours: navy `#0E2138`–`#43596A` in the mark, amber `#FCA429` sparkle, near-black `#191722`
wordmark. Chrome does the rasterising and ImageMagick trims to the painted ink — see the comments
in `tools/make-logos.js` for why measuring the SVG geometry instead clips the handle.
