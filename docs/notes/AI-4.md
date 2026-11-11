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
- Drvolt's passive (startValue 2) REPLACES the default, it is not added.

## Changes I need from other AIs
- AI-8 (bot): tune the numbers in `src/data/shifts.js`. Numbers I think need tuning: `targetBase` 24 and `targetGrowth` 2.1 (a Tinkerbot kit with all parts in a row made 42 on shift 1 with the real engine, the Clockmaker kit only 17, so the kits are uneven), `baseShiftPayout` 4, `overkillStepRatio` 0.5, `rerollStep`, `sellFraction` 0.5, the rarity bands, and the kits in `inventors.js` (Clockmaker looks weak at shift 1).

## Answers to other AIs
- AI-8: my functions mutate the run in place and never drop extra fields, so `run.tutorial` and your `firesLeft = 3` stay as they are. Only `startNextShift` resets `firesLeft` (to the normal number), so keep the tutorial to shift 1. `sellPart` takes `{ kind: 'bench', index }` or `{ kind: 'board', x, y }`. A failed buy returns `{ ok: false, reason }` and leaves coins unchanged.

## Balance change (answers AI-3's 0% win rate)
- Bot showed shift targets were far too steep (smart bot: 0% wins, average shift 3.6). Swept `targetBase` / `targetGrowth` with `tools/simulate.js`; set 16 / 1.45. Results (90 runs, all inventors): dumb bot V1 about 1% wins, smart bot V1 20% (average shift 6.6), V2 3%, V3 1%, V4 1%.
- AI-3 and AI-8: please rerun `partStats` now, win rate is no longer 0. Voltage 2-4 may still be too hard for these bots; a human plays better than the smart bot, so I did not lower the multipliers. AI-8: your call after more runs.

## Inventor check (100 runs each, voltage 1, smart bot / simple bot)
- Tinkerbot 44% / 9%, Clockmaker 43% / 2%, Dr. Volt 10% / 0%. Clockmaker is fine. Dr. Volt was weak.
- I changed Dr. Volt's KIT (allowed): splitter, splitter, battery, coil (was splitter, battery, coil, bend). Smart bot 10% -> 22%.
- Question for manager: his passive (2 sparks, start value 2) is the real problem. Keeping 3 sparks with start value 2 gave 36% smart / 5% simple, close to the others. I did NOT change the passive because it is in the spec. Say yes and it is a one-line change in `src/data/inventors.js`.

## Dr. Volt final (owner said yes)
- Passive is now `startValue: 2` only (3 sparks kept). Kit back to the spec: splitter, battery, coil, bend. Bot (100 runs, V1): smart 36%, simple 5%, close to Tinkerbot 44% / 9%. The two-splitter kit overshot (54% smart), so it was reverted.
- AI-5 (Patent Book / inventor screens): the old text "fewer sparks" for Dr. Volt is gone, use `tagline` and `passive` from `getInventor`.

## Stage 3 balance pass (owner asked me to finish what was left)
Checked `docs/manager/to-AI-4.md` and every other AI's notes: the reroll restart, `getTarget` x `targetMultiplier`, cheat-set shop phase and kit tuning were already done (AI-3 confirmed). Open items I applied now, all in my own files, from AI-8's `docs/BALANCE.md` follow-ups:
- `voltage.js`: V3 `targetMultiplier` 1.8 -> 1.4, V4 2.4 -> 1.7. V3 `fewerSparks` moved from shift 2 (22% pass) to shift 5. Smart bot (120-150 runs, seed 1): V3 0.8% -> 1.7% (avg shift 4.5 -> 5.4), V4 1.7% -> 2.5% (avg shift 3.7 -> 4.6), V1 33%, V2 8.7%. I also tried V3 without `coldStart`: 3.3%, a small gain, so I kept the twist (design intent).
- `shifts.js`: legendary weights 5 -> 8 (shifts 3-5) and 12 -> 18 (shifts 6-8), commons lowered to match, so `overdrive` and `prism` show up. Shifts 1-2 stay 0.
- New run fields `firesUsed` and `partsBought` (AI-5's request), counted in `fire` and `buyOffer`, also returned by `runSummary`. Old saves are safe. Tests added. AI-5: you can now make the Fires and Parts bought stats exact.
- Tests and `docs/RUN.md` updated for the new numbers.
- NOT changed (waiting for manager): `targetGrowth` stays 1.45. AI-3's sweep says 1.40 gives smart 50.7% / normal 9.3%, but V1 is already 33% smart, so I left it. Also not applied: `baseShiftPayout` 4 -> 6 (BALANCE item 11) and the V3 smart-bot win rate is still below the 5-15% hope; the bot plays worse than a human, so I did not loosen V3 more.
- Question for manager: contract section 12 item 10 should list `firesUsed` and `partsBought`.
