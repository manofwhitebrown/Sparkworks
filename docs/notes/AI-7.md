# AI-7 notes (UI shell, main screens, design system)

## Done
- Design system: tokens.css, base.css, components.css, Inter font (woff2, OFL), ASSETS.md, STYLE_GUIDE.md
- Components: button, partCard, modal, toast, numberTicker
- ui.js shell (go, Back button, getMeta/saveCurrentMeta, applySettingsFromMeta), flow.js helpers + tests/ui-flow.test.js
- home.js

## Working on
- run.js, shop.js, results.js (waiting on real AI-4 runState and AI-6 boardView; building against the contract)

## Blocked / Questions for manager
- index.html mounts into `#app` (not `#root`); I use `#app`. No change needed.

## Changes I need from other AIs
- AI-8: tests/integration-tutorial.test.js fails on main right now (not my file, I did not touch it)

## For AI-5
- Read docs/STYLE_GUIDE.md. Use `getMeta()` and `saveCurrentMeta()` from `src/ui/ui.js`.
- After changing a setting, call `applySettingsFromMeta()` from `src/ui/ui.js` so the classes, audio and haptics update.
