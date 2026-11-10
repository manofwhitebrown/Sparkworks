# Notes: AI-4 (Run loop, shop, difficulty)

## Done
- `src/data/shifts.js`, `inventors.js`, `voltage.js` (all numbers from the task file).
- `src/run/runState.js`, `shop.js`, `merge.js` plus small helpers `boardActions.js`, `runRules.js`, `runRng.js` (all in my `src/run/` folder).
- Tests: `tests/run-state.test.js`, `run-shop.test.js`, `run-merge.test.js`, `run-flow.test.js` and the fakes file `tests/run-fakes.js` (not a test, only fake parts/simulate/twists).
- `docs/RUN.md`.
- Smoke test against the real engine and real parts: newRun, place, fire, offers all work.

## Working on
- Checking `npm run build` and CI.

## Blocked / Questions for manager
- Run shape: I added `pendingCoins`, `bestFire` and `bonuses` to the run (needed for payouts, the summary and bench/shop/reroll numbers). Please add them to CONTRACT section 9.
- Free rerolls: I read "first N rerolls of each shift are free" literally: reroll n (0-based) costs 0 when n < freeRerolls, otherwise `1 + 1 * n`. Say if the paid price should restart after the free ones.
- Drvolt's passive REPLACES sparkCount/startValue (2 and 2), it is not added.

## Changes I need from other AIs
- AI-8 (bot): tune the numbers in `src/data/shifts.js`. Numbers I think need tuning: `targetBase` 24 and `targetGrowth` 2.1 (a Tinkerbot kit with all parts in a row made 42 on shift 1 with the real engine, the Clockmaker kit only 17, so the kits are uneven), `baseShiftPayout` 4, `overkillStepRatio` 0.5, `rerollStep`, `sellFraction` 0.5, the rarity bands, and the kits in `inventors.js` (Clockmaker looks weak at shift 1).
