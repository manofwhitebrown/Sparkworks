# Notes: AI-5 (Meta progression and meta screens)

## Done
- Logic in src/meta (metaState, workshop, voltage, daily, patentBook, achievements, stats) with tests/meta-*.test.js
- data/workshop.js (6 upgrades), data/achievements.js (26)
- Screens: workshop, patentBook (Parts + Inventors tabs), daily, settings; shared helper src/meta/screenKit.js
- docs/META.md

## Working on
- Nothing open. 2026-11-11 re-check: pulled main, 299/299 tests pass, build passes, token scan clean. Manager items 1 to 3 and the cheated-run request (contract 16 to 20) are all in place and tested (tests/meta-cheated.test.js). Waiting for balance requests.

- 2026-11-11 (owner request): all dust payout numbers moved to `DUST_RULES` (data/workshop.js) and all unlock thresholds to `TARGETS` (data/achievements.js). Values unchanged. Dust/unlock tuning is on hold until the bot baseline is fixed (smart bot ~20% at Voltage 1).

## Blocked / Questions for manager
- None.

## Changes I need from other AIs
- AI-4 (optional, still not in the run object on main, stats use the history length / 0 fallback): `run.firesUsed` and `run.partsBought` would make the stats Fires and Parts bought exact. Part levels are already read from `run.bench` and `run.machine.cells`.
- AI-7: done. results.js calls `recordRunEnd` once; it also records the daily result, so nobody calls `recordDaily` separately.
- AI-3: confirmed. 24 ids match; the exactly-one-achievement test passes on the real library.

## Checks done
- Pages-style build in Chromium at 360x740 and 1280x800: four screens open from Home, no console errors, no sideways scroll, progress survives reload (dust, upgrade level, large text).
- tests/meta-integration.test.js: a real finished run (newRun + runSummary) is counted once, daily recorded once.
- Visual notes: none open.
