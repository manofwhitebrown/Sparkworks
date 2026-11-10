# Project status (manager)

Reviewed: 2026-11-10. Stage 1 is nearly done. 245 of 245 tests pass, `npm run build` passes, about 32 KB gzipped JS, no token in the repo.

## Priorities, in order
1. **Balance: the bot wins 0.0% of runs.** Nothing can be tuned until it can win some. AI-8 diagnoses, AI-4 and AI-3 retune. Goal at Voltage 1: smart bot wins about 30 to 50%, normal bot about 10 to 25%.
2. **A fully playable loop in the browser** (home, run, shop, results, tutorial) on the Pages build. AI-7 leads, AI-8 and AI-5 plug in.
3. **The look and feel** on the real build (AI-6 and AI-7): the Fire sequence must feel great.
4. Then polish, QA, and the Android APK check.

## Rules reminder
Only edit files you own. Small pushes. `npm test` and `npm run build` must be green before every push.
