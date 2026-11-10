# Notes: AI-4 (Run loop, shop, difficulty)

## Done
- `src/data/shifts.js`, `inventors.js`, `voltage.js` (all numbers from the task file).
- `src/run/runState.js`, `shop.js`, `merge.js` plus small helpers `boardActions.js`, `runRules.js`, `runRng.js` (all in my `src/run/` folder).
- Tests: `tests/run-state.test.js`, `run-shop.test.js`, `run-merge.test.js`, `run-flow.test.js` and the fakes file `tests/run-fakes.js` (not a test, only fake parts/simulate/twists).
- `docs/RUN.md`.
- Smoke test against the real engine and real parts: newRun, place, fire, offers all work.

## Working on
- Waiting for the manager's review and AI-8's bot tuning. `npm run build` passes; all my run tests pass.
- Not mine: `tests/integration-tutorial.test.js` fails under `node --test` (it imports `src/ui/styles/tokens.css`, Node cannot load .css). Owner: AI-8 / AI-7.

## Blocked / Questions for manager
- Run shape: I added `pendingCoins`, `bestFire` and `bonuses` to the run (needed for payouts, the summary and bench/shop/reroll numbers). Please add them to CONTRACT section 9.
- Free rerolls: I read "first N rerolls of each shift are free" literally: reroll n (0-based) costs 0 when n < freeRerolls, otherwise `1 + 1 * n`. Say if the paid price should restart after the free ones.
- Drvolt's passive REPLACES sparkCount/startValue (2 and 2), it is not added.

## Changes I need from other AIs
- AI-8 (bot): tune the numbers in `src/data/shifts.js`. Numbers I think need tuning: `targetBase` 24 and `targetGrowth` 2.1 (a Tinkerbot kit with all parts in a row made 42 on shift 1 with the real engine, the Clockmaker kit only 17, so the kits are uneven), `baseShiftPayout` 4, `overkillStepRatio` 0.5, `rerollStep`, `sellFraction` 0.5, the rarity bands, and the kits in `inventors.js` (Clockmaker looks weak at shift 1).

## Answers to other AIs
- AI-8: my functions mutate the run in place and never drop extra fields, so `run.tutorial` and your `firesLeft = 3` stay as they are. Only `startNextShift` resets `firesLeft` (to the normal number), so keep the tutorial to shift 1. `sellPart` takes `{ kind: 'bench', index }` or `{ kind: 'board', x, y }`. A failed buy returns `{ ok: false, reason }` and leaves coins unchanged.

## Balance change (answers AI-3's 0% win rate)
- Bot showed shift targets were far too steep (smart bot: 0% wins, average shift 3.6). Swept `targetBase` / `targetGrowth` with `tools/simulate.js`; set 16 / 1.45. Results (90 runs, all inventors): dumb bot V1 about 1% wins, smart bot V1 20% (average shift 6.6), V2 3%, V3 1%, V4 1%.
- AI-3 and AI-8: please rerun `partStats` now, win rate is no longer 0. Voltage 2-4 may still be too hard for these bots; a human plays better than the smart bot, so I did not lower the multipliers. AI-8: your call after more runs.
