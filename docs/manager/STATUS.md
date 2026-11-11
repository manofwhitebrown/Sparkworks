# Project status (manager)

Reviewed: 2026-11-11. Stage 1 is nearly done. 362 of 362 tests pass, `npm run build` passes, about 32 KB gzipped JS, no token in the repo.

## Priorities, in order
1. **Balance: the bot wins 0.0% of runs.** Nothing can be tuned until it can win some. AI-8 diagnoses, AI-4 and AI-3 retune. Goal at Voltage 1: smart bot wins about 30 to 50%, normal bot about 10 to 25%.
2. **A fully playable loop in the browser** (home, run, shop, results, tutorial) on the Pages build. AI-7 leads, AI-8 and AI-5 plug in.
3. **The look and feel** on the real build (AI-6 and AI-7): the Fire sequence must feel great.
4. Then polish, QA, and the Android APK check.

## ROUND 3 (2026-11-11): phone layout check (real mobile browser, 7 phone sizes)
Good: no sideways scroll, no small buttons, home/Workshop/Patent Book/Daily/Settings are clean.
Bugs, worst first (owners in brackets, details in each `to-AI-N.md`):
1. Board overlaps the HUD on small phones (360x640, 375x667, 320x568) [AI-7, AI-6].
2. Shop is overfull at 360x640: "Next shift" covers the bench; the sticky button is flush to the screen edge [AI-7].
3. Shop mini board ignores taps but the text says to tap a cell [AI-7, AI-6].
4. Big phones waste space: the board stays about 380x282 on a 412x915 phone [AI-7, AI-6].
5. Board dead space, mismatched backdrop, vault particles bleeding at the right edge [AI-6].
6. Home: two big Locked cards, plain-dot logo, tight bottom nav [AI-7].
7. Bug: Continue run shows after skipping the tutorial [AI-7, AI-8, AI-5].
8. Tiny 11px text; uneven shop card heights [AI-7, AI-5].
Rule for the round: every item must look right at 320x568, 360x640, 375x667, 360x740, 390x844, 412x915, 430x932, normal and largeText. AI-8 checks and reports.

## ROUND 4 (2026-11-11): make it beginner-proof, then give it more to play with
The owner did not know sparks can be steered to side cells. The tutorial never teaches it. Full review: `docs/manager/BEGINNER_REVIEW.md` (12 stuck points). Order of work for everybody: ROUND 3 first, then ROUND 4.
- **A. Teach it:** path preview, "never touched" feedback, How to Play screen, tutorial v2 with a steering lesson, plain part texts with examples, Overload banner, loss tips, Gentle mode, Hint button. (AI-7 leads, AI-6 draws, AI-8 tutorial and words, AI-3 texts, AI-2 path helpers.)
- **B. More to play with:** 8 new parts, bonus tiles on side cells, 2 new inventors, 3 new twists, about 8 new achievements. (AI-3, AI-2, AI-4, AI-5, AI-6 icons.)
- **C. Keep it honest:** bot and balance with the new content, one set of words (`docs/WORDS.md`), a plain-text test. (AI-8.)
New contract items 21 to 27 are at the end of `docs/CONTRACT.md`.

## Rules reminder
Only edit files you own. Small pushes. `npm test` and `npm run build` must be green before every push.
