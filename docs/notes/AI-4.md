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
- (superseded below) `targetGrowth` stayed 1.45 at first. AI-3's sweep says 1.40 gives smart 50.7% / normal 9.3%, but V1 is already 33% smart, so I left it. Also not applied: `baseShiftPayout` 4 -> 6 (BALANCE item 11) and the V3 smart-bot win rate is still below the 5-15% hope; the bot plays worse than a human, so I did not loosen V3 more.
- Question for manager: contract section 12 item 10 should list `firesUsed` and `partsBought`.

## Final balance numbers (owner said "just go for it")
- `shifts.js`: `targetGrowth` 1.45 -> 1.40 and `baseShiftPayout` 4 -> 5 (6 made V1 too easy: smart 55%, V2 39%). Tests now read the payout from `SHIFT_RULES`, so a payout change no longer breaks them.
- Bot (150 runs, seed 1, smart): V1 52.7%, V2 28.7%, V3 12.7%, V4 4.7%. Normal bot V1 14.7%. V3 and V4 are inside AI-8's hoped ranges; V1 smart is a touch above 50% but the bot is weaker than a human, so manager/AI-8 may nudge `targetGrowth` to 1.42 if it feels easy in real play.
- Manager: please approve or adjust; every number is in `src/data/shifts.js` and `voltage.js`.

## ROUND 4 (manager's list in `to-AI-4.md`)
Done and pushed (tests in `tests/run-round4.test.js`, 12 new):
1. **Gentle mode**: `bonuses.gentle` (+1 Fire, targets x0.7, +4 coins), numbers in `GENTLE_RULES`. Bot check by a scratch script (the tools do not take bonuses): smart bot 71% (goal 60-80%), simple bot 59%. AI-8: please add a `--gentle` option to `tools/simulate.js` so this can be re-run.
2. **Bonus tiles**: `src/run/bonusCells.js` sets `machine.bonusCells` at every shift start (rules in `docs/RUN.md`). Numbers in `BONUS_CELL_RULES`. The later `add` range (+4..+8) and the 50% mult chance are my guesses: tune with the bot once AI-2's engine reads the tiles.
5. **Loss tips**: `runSummary(run, deps)` returns `neededTotal`, `bestFireLastShift`, `tipId`, plus `gentle`. AI-7 shows the text for `'steer' | 'merge' | 'coins' | 'order'`.
6. `docs/RUN.md` updated.

NOT done yet, waiting for other AIs (I will not reference part ids that do not exist, it would break `newRun`):
3. Ms. Bounce and The Banker in `inventors.js`: waiting for AI-3's `spring`, `sideamp`, `workbench` part files. The Banker's passive (+2 coins at the start of every shift) needs a new passive field `shiftStartCoins`; I will add it to `runRules.js` and `startShift` when I add the inventor.
4. Shop weights for the new parts and the new twists (`closedRow`, `loneSpark`, `noMult`) in the Overload shifts: waiting for AI-3's part and twist ids. Shop weights already come from rarity, so new parts appear on their own as soon as AI-5/AI-1 add them to the pool.

Questions for manager: contract section 12 item 10 should also list `everOwned`, `maxLevelSeen`, `shiftBestFire`, `firesUsed`, `partsBought` and `machine.bonusCells` (rebuilt each shift).
