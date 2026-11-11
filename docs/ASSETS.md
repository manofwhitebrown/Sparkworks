# ASSETS

Every outside asset used by Sparkworks. Owner: AI-7 (covered by AI-1 in round 5). Send new entries through your notes file.

| Asset | Source | Licence | Where |
|-------|--------|---------|-------|
| Inter (Regular 400, SemiBold 600, Bold 700), subset to Latin, woff2 | https://github.com/rsms/inter (The Inter Project Authors) | SIL Open Font License 1.1 | `public/fonts/inter-*.woff2` |
| Space Grotesk Bold 700, subset to basic Latin plus x, arrow and minus (5.9 KB), woff2 | https://github.com/floriankarsten/space-grotesk (The Space Grotesk Project Authors), taken from the npm package `@fontsource/space-grotesk` 5.3.0 | SIL Open Font License 1.1 | `public/fonts/spacegrotesk-Bold.woff2` |
| Grain tile: 64 x 64 PNG of random faint dots, made by our own script (seeded random, no outside art), embedded as a data URI | made in code | none needed (ours) | `--noise` in `src/ui/styles/tokens.css` |

Notes:
- Space Grotesk is the ONE display font: big numbers (`.numHero`, `.numBig`) and the wordmark only. Body text stays Inter. Subset keeps `tnum`, `kern`, `case`, `zero`. Fallback: Inter, then the system font.
- Inter is self-hosted. No network request is made for fonts. Fallback stack: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
- Subset keeps the `tnum` (tabular figures), `kern`, `liga`, `calt` and `case` features. Every number in the UI uses `font-variant-numeric: tabular-nums`.
- The app icon, favicon and splash are drawn in code by `assets/make_icons.py` (no outside art). Part icons are drawn in code by `src/render/partIcons.js` (AI-6). All sounds are made in code (AI-8). No other outside assets.
