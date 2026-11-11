# Notes: AI-5 (Meta progression and meta screens)

## Done
- Logic in src/meta (metaState, workshop, voltage, daily, patentBook, achievements, stats) with tests/meta-*.test.js
- data/workshop.js (6 upgrades), data/achievements.js (26)
- Screens: workshop, patentBook (Parts + Inventors tabs), daily, settings; shared helper src/meta/screenKit.js
- docs/META.md

## Working on
- Nothing open. 2026-11-11 re-check: pulled main, 299/299 tests pass, build passes, token scan clean. Manager items 1 to 3 and the cheated-run request (contract 16 to 20) are all in place and tested (tests/meta-cheated.test.js). All stage-1 items closed. Waiting for balance requests (dust/unlock numbers on hold until the bot baseline is fixed).

- 2026-11-11 (owner request): all dust payout numbers moved to `DUST_RULES` (data/workshop.js) and all unlock thresholds to `TARGETS` (data/achievements.js). Values unchanged. Dust/unlock tuning is on hold until the bot baseline is fixed (smart bot ~20% at Voltage 1).

- Round 3 (2026-11-11): `.pbHint` in the Patent Book now uses `var(--fs-small)` (13px; 16px in largeText per tokens.css). `recordRunEnd` and `recordDaily` ignore any run/result with `tutorial === true` (nothing changes, run not marked recorded), tests in tests/meta-tutorial.test.js.
- **Intended:** a fresh save shows "12 of 24 found" in the Patent Book. 12 = the starting parts from the brief, 24 = every part in the library. The other 12 are each unlocked by exactly one achievement.

- Round 4 (2026-11-11): Gentle mode meta side, first-visit help lines (`meta.seenIntro`), Patent Book detail window (text + example + unlock hint per level, count from the real library), `repairMeta` keeps new inventors, 10 new achievements (planned list switches on when the parts/inventors exist), Whole Crew from the real inventor list. See docs/META.md "Round 4 additions". Tests: tests/meta-round4.test.js.

## Round 5 (aesthetics)
- **Done:** `docs/SKINS.md` (design only: 6 things a skin may change, 5 first skins, `meta.skins = { owned, active }`, `data/skins.js`, `setSkin` on the board view, tests list, 3 questions for the manager).
- **Done:** Workshop, Patent Book, Daily and Settings restyled (hero number panels, card surfaces with a static gradient, uppercase section labels, bigger level pips, dashed silhouette frame for locked parts, grouped Settings). All styles live in `src/meta/screenKit.js` and `patentBook.js`. Checked in Chromium at 360x740 and 390x844: four screens open, no sideways scroll, no page errors.
- **Colors:** no color invented. Surfaces use AI-1's tokens (`--surface-panel`, `--surface-raised`, `--surface-inset`, `--warm-wash`, `--edge-light`, `--shadow-1`), big numbers use `--font-display` with `--fs-hero` (Workshop dust) or `--fs-huge`, labels use `--fs-label` / `--ls-label`. All static, no blur, no animation. Checked again at 360x740 and 320x568 with largeText: no sideways scroll, no page errors.
- AI-1 tokens landed (fbabb0a) and are in use. Not used: `--noise` (on the shared panel/screen surfaces, AI-1's call).
- **Waiting on AI-6:** the new part tile look. The Patent Book uses `makePartCard`, so rarity borders follow automatically; I will re-check when AI-1/AI-6 push the new tile CSS.

## Blocked / Questions for manager
- Skins: see the 3 open questions at the end of docs/SKINS.md.

## Changes I need from other AIs
- **AI-4 (inventor ids):** I used `msbounce` (Ms. Bounce) and `banker` (The Banker). Please use exactly these ids in `inventors.js`, or tell me yours. A test fails if an inventor has no unlock achievement.
- **AI-3 (part ids):** my planned achievements reward `spring, sideamp, bouncer, workbench, jackpot, finisher, starter, portal`. If you use other ids, the `exactly one achievement` test will fail for them and I will remap. `example(level)` and `describe(level, rot)` are used by the Patent Book; the book calls `describe(level, 1)` (DOWN).
- **AI-4 (optional):** if `runSummary` returns `gentle: true` for gentle runs I use it; otherwise I read `run.bonuses.gentle`.
- AI-4: done. `run.firesUsed` and `run.partsBought` are now on the run (commit f0e4c95); stats use them, with the history length / 0 fallback kept for old saves. Tested in tests/meta-run-counts.test.js. Part levels are already read from `run.bench` and `run.machine.cells`.
- AI-7: done. results.js calls `recordRunEnd` once; it also records the daily result, so nobody calls `recordDaily` separately.
- AI-3: confirmed. 24 ids match; the exactly-one-achievement test passes on the real library.

## Checks done
- Pages-style build in Chromium at 360x740 and 1280x800: four screens open from Home, no console errors, no sideways scroll, progress survives reload (dust, upgrade level, large text).
- tests/meta-integration.test.js: a real finished run (newRun + runSummary) is counted once, daily recorded once.
- Visual notes: none open.
