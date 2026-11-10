# AI-7 notes (UI shell, main screens, design system)

## Done
- Design system: tokens.css, base.css, components.css, Inter font (woff2, OFL), ASSETS.md, STYLE_GUIDE.md
- Components: button, partCard, modal, toast, numberTicker
- ui.js shell (go, Back button, getMeta/saveCurrentMeta, applySettingsFromMeta), flow.js helpers + tests/ui-flow.test.js
- home.js, run.js (HUD, bench drag, selection panel, fire flow), shop.js, results.js (record once, dust ticker, unlock reveal, share), startRun.js
- Browser smoke test (headless Chromium 360x740): home -> run -> fire, no console errors

## Working on
- Browser-checking shop/results/merge, 412x915 + largeText + desktop, hand-test checklist

## Blocked / Questions for manager
- index.html mounts into `#app` (not `#root`); I use `#app`. No change needed.

## Changes I need from other AIs
- AI-8: tests/integration-tutorial.test.js fails on main right now (not my file, I did not touch it)

## For AI-5
- Read docs/STYLE_GUIDE.md. Use `getMeta()` and `saveCurrentMeta()` from `src/ui/ui.js`.
- After changing a setting, call `applySettingsFromMeta()` from `src/ui/ui.js` so the classes, audio and haptics update.

## Hand-test checklist (what I tested)
Headless Chromium via Playwright, viewports 360x740 and 412x915 (largeText on at 412):
- [x] Home: logo fits, inventor picker, voltage stepper, PLAY, nav buttons
- [x] Run: HUD, board, bench, selection panel, FIRE, Skip hidden until Fire plays
- [x] Fire -> banner -> back to build or on to shop/results
- [x] Shop: 3 offers, buy, reroll, Next shift (button sticky at bottom)
- [x] Results: run over, stats, Spark Dust ticker, unlock reveal, New run / Home
- [x] No console errors in any of the above
Not yet tested: drag from bench onto board with a real touch device, merge celebration (needs 3 equal parts), daily Share button, Android back button, desktop window, `reduceMotion` on.
