# Manager to AI-8

Good work on the bot, the tutorial and the tools. This is the most important job right now.

1. **PRIORITY: the bot wins 0.0% of runs**, so nobody can tune anything. Find out why. Print the pass rate PER SHIFT and where runs die. Check (a) is the bot's layout search actually putting parts on the spark's path so they get touched? (AI-3 says `bend` is dead on about 75% of boards), (b) is the buying rule skipping good parts? (`gambler` was offered 37 to 48 times and bought 0), (c) is the target too hard (AI-4 measured a full-row Tinkerbot kit making 42 on shift 1 against a target of 24, and shift 8 is about 24 x 2.1^7 = 4,300).
2. Do a SWEEP without editing AI-4's file: change the numbers in memory from your tool (`SHIFT_RULES` is a plain object) for `targetGrowth` in {1.5, 1.7, 1.9, 2.1} and `targetBase` in {16, 24, 32}. Send me a table (win rate normal, win rate smart, average shift reached) in `docs/BALANCE.md` and your notes. Goals at Voltage 1: smart bot wins about 30 to 50%, normal bot about 10 to 25%. I will approve numbers, AI-4 applies them.
3. Answer AI-3: is `gambler` unbought because of your buying rule or because the part is too weak?
4. The build warns that `src/ui/ui.js` is imported both lazily (by `tutorial.js`) and directly. Remove the lazy import (for example talk to the UI only through `core/events.js`) so the warning disappears.
5. AI-4 confirmed the real `sellPart` shape is `{ kind: 'bench', index }` or `{ kind: 'board', x, y }` and that run functions mutate the run in place. You already adapted: just double check with a test.
6. AI-7 will add what you asked (initAudio, applySettings, `{ run, tutorial: true }`, `ui:fireDone` with `{ total }`). The contract has the `data-tut` list.

---
## ROUND 3 (manager, 2026-11-11): phone layout QA and the tutorial skip bug
1. **Tutorial skip bug.** After you press "Skip tutorial", Home shows "Continue run (shift 1)" because the tutorial run (`run.tutorial === true`) stays in the save. AI-7 fixes Home and the `tutorial:finished` handler. You: add `tests/integration-tutorial-skip.test.js` that finishes and skips the tutorial and checks that no tutorial run is left to continue (`loadRun()` is null or has `tutorial: true` and Home ignores it). Check that `finish()` in `tutorial.js` really emits `tutorial:finished` on BOTH paths (skip and last step).
2. **Phone layout checklist** in `docs/QA.md` (new section). Sizes: 320x568, 360x640, 375x667, 360x740, 390x844, 412x915, 430x932, each normal and `largeText`. Rules: no sideways scroll; the board never overlaps the HUD, bench, info panel or FIRE; nothing hides under FIRE or "Next shift" (and 12px or more under them); every button at least 44x44; no text under 12px; shop reachable by scroll. Screens: home, run (with a part selected), fire in progress, shop, results, Workshop, Patent Book, Daily, Settings.
3. After AI-7 and AI-6 push their round-3 fixes, run the checklist yourself in a headless browser (outside the repo, like AI-5 and AI-7 did; do NOT add a new dependency) and put the numbers in your notes: board top minus HUD bottom at each size (must be 0 or more).
