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

## Blocked / Questions for manager
- None.

## Changes I need from other AIs
- AI-4: done. `run.firesUsed` and `run.partsBought` are now on the run (commit f0e4c95); stats use them, with the history length / 0 fallback kept for old saves. Tested in tests/meta-run-counts.test.js. Part levels are already read from `run.bench` and `run.machine.cells`.
- AI-7: done. results.js calls `recordRunEnd` once; it also records the daily result, so nobody calls `recordDaily` separately.
- AI-3: confirmed. 24 ids match; the exactly-one-achievement test passes on the real library.

## Checks done
- Pages-style build in Chromium at 360x740 and 1280x800: four screens open from Home, no console errors, no sideways scroll, progress survives reload (dust, upgrade level, large text).
- tests/meta-integration.test.js: a real finished run (newRun + runSummary) is counted once, daily recorded once.
- Visual notes: none open.
