# ASSETS

Every outside asset used by Sparkworks. Owner: AI-7. Send new entries through your notes file.

| Asset | Source | Licence | Where |
|-------|--------|---------|-------|
| Inter (Regular 400, SemiBold 600, Bold 700), subset to Latin, woff2 | https://github.com/rsms/inter (The Inter Project Authors) | SIL Open Font License 1.1 | `public/fonts/inter-*.woff2` |

Notes:
- Inter is self-hosted. No network request is made for fonts. Fallback stack: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.
- Subset keeps the `tnum` (tabular figures), `kern`, `liga`, `calt` and `case` features. Every number in the UI uses `font-variant-numeric: tabular-nums`.
- The app icon, favicon and splash are drawn in code by `assets/make_icons.py` (no outside art). Part icons are drawn in code by `src/render/partIcons.js` (AI-6). All sounds are made in code (AI-8). No other outside assets.
