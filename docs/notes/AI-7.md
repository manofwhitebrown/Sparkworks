# AI-7 notes (UI shell, main screens, design system)

## Done
- Design system: tokens.css, base.css, components.css, Inter font (woff2, OFL), ASSETS.md, STYLE_GUIDE.md
- Components: button, partCard, modal, toast, numberTicker
- ui.js shell (go, Back button, getMeta/saveCurrentMeta, applySettingsFromMeta), flow.js helpers + tests/ui-flow.test.js
- home.js, run.js (HUD, bench drag, selection panel, fire flow), shop.js, results.js (record once, dust ticker, unlock reveal, share), startRun.js
- Browser smoke test (headless Chromium 360x740): home -> run -> fire, no console errors

- Cheat menu support (manager items 16-20): `getCurrentRun()` / `setCurrentRun()` / `getFireSpeed()` exported from ui.js; run.js and shop.js listen for `cheat:changed` (save, then route by `run.phase`, or re-render), listener removed in `unmount`; `cheat:speed` is stored in ui.js (reset to 1 in `startApp`, never saved) and run.js passes it to `view.play` ('instant' = play then `view.skip()`); results shows "Cheated run: no rewards" and skips the dust ticker and reveal when `run.cheated`; z-index space above 1000 kept free (documented in STYLE_GUIDE)
- Requests handled: core:flush saves meta (AI-1), run screen takes params.run + ui:fireDone carries { total } (AI-8), applySettings called on load

## Working on
- Browser-checking shop/results/merge, 412x915 + largeText + desktop, hand-test checklist

## Blocked / Questions for manager
- index.html mounts into `#app` (not `#root`); I use `#app`. No change needed.

## Changes I need from other AIs
- AI-2: when the cheat menu overlay lands, tell me if it needs anything else from ui.js. I emit nothing for cheats; I only listen to `cheat:changed` and `cheat:speed`.

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
Also tested (1280x800 desktop, reduceMotion + colorblind on):
- [x] Tap-select a bench part then tap a cell places it; bench count updates
- [x] Browser Back on Run opens "Leave this run?"; "Keep playing" closes it and stays on Run
- [x] Merge: buying a 3rd Coil merges to level 2, toast + celebration class, no errors
- [x] Desktop: centered 480 px column, colorblind rarity labels on compact cards
- [x] Touch drag from bench onto the board (simulated touch events): ghost shows, part placed; Leave path returns home
Cheat support, tested with Playwright Chromium 360x740 on the dev server (emitting the real events through core/events.js):
- [x] `getCurrentRun()` is the live run on run and shop, `null` on results
- [x] `cheat:changed` with phase shop -> shop screen (coins refresh); phase build -> run screen; cheated + lost -> results
- [x] `cheat:speed` 'instant': Fire banner after about 0.2 s; speed 1 again afterwards
- [x] Cheated results show the "Cheated run: no rewards" line, no dust ticker; a normal run still shows Spark Dust
- [x] No console errors
- [x] Daily Share button (Playwright, clipboard allowed): toast "Copied to clipboard.", clipboard holds the share code, "New run" is hidden for daily runs
Not yet tested: real Android back button, a physical device, the real cheat menu overlay (src/cheats has only gate.js and sha256.js so far: AI-2).
