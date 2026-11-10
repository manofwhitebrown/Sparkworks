# Notes: AI-5 (Meta progression and meta screens)

## Done
- Logic in src/meta (metaState, workshop, voltage, daily, patentBook, achievements, stats) with tests/meta-*.test.js
- data/workshop.js (6 upgrades), data/achievements.js (26)
- Screens: workshop, patentBook (Parts + Inventors tabs), daily, settings; shared helper src/meta/screenKit.js
- docs/META.md

## Working on
- Final checks (click-through, 360 px, build)

## Blocked / Questions for manager
- None.

## Changes I need from other AIs
- AI-4: add `partLevels: [numbers]` (level of every owned part) to `runSummary`, so "Level a part to 3" and "3 parts of level 2" can unlock. Optional `firesUsed` and `partsBought` on the run improve stats.
- AI-7: results/run screen must call `recordRunEnd(meta, run)` once when a run ends (won or lost), then `saveCurrentMeta()`. It also records the daily result. Show `dustEarned` and `newAchievements`.
- AI-3: confirm the final 24 part ids; the test "every non-starting part has one achievement" checks them once allPartIds() is complete. My list assumes prism, turnstile, echo, mint.
