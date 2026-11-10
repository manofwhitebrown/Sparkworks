# Notes: AI-5 (Meta progression and meta screens)

## Done
- Logic in src/meta (metaState, workshop, voltage, daily, patentBook, achievements, stats) with tests/meta-*.test.js
- data/workshop.js (6 upgrades), data/achievements.js (26)
- Screens: workshop, patentBook (Parts + Inventors tabs), daily, settings; shared helper src/meta/screenKit.js
- docs/META.md

## Working on
- Nothing open. Waiting for manager review / balance requests.

## Blocked / Questions for manager
- None.

## Changes I need from other AIs
- AI-4 (optional): `run.firesUsed` and `run.partsBought` would make the stats Fires and Parts bought exact. Part levels are already read from `run.bench` and `run.machine.cells`.
- AI-7: done. results.js calls `recordRunEnd` once; it also records the daily result, so nobody calls `recordDaily` separately.
- AI-3: confirmed. 24 ids match; the exactly-one-achievement test passes on the real library.

## Checks done
- Pages-style build in Chromium at 360x740 and 1280x800: four screens open from Home, no console errors, no sideways scroll, progress survives reload (dust, upgrade level, large text).
- tests/meta-integration.test.js: a real finished run (newRun + runSummary) is counted once, daily recorded once.
- Visual notes: none open.
