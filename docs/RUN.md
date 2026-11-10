# RUN: the life of one run (AI-4)

A run is plain JSON (see CONTRACT section 9). Every function below CHANGES the run you give it and
returns a small result object. The UI saves the run after each action. Every function also accepts an
optional last argument `deps` (`{ simulate, getPart, applyTwists }`) so tests can pass fakes.

Extra fields in the run (added by AI-4, all plain data): `pendingCoins` (coins from parts, paid when the
shift is cleared), `bestFire` (best single Fire), `bonuses` (the meta bonuses, 0 by default).

## The life of a run
1. **Shift start** (`newRun` for shift 1, `startNextShift` for the rest): `shiftTotal`, `pendingCoins`,
   `rerollsThisShift` reset to 0, `firesLeft` = Fires per shift; machine `blocked`, `banned`, `flags` cleared,
   `sparkCount` / `startValue` reset to the inventor's values; twists of this voltage and shift applied; a part on
   a newly blocked cell goes back to the bench (full bench: sold, reported in `sold`); new `machine.seed`. Phase `build`.
2. **Build**: place, move (swap), rotate, return to bench, sell. Not allowed in other phases (except selling in `shop`).
3. **Fire**: simulate a copy of the machine with a fresh seed. The total adds to `shiftTotal`.
   - `shiftTotal >= target`: shift cleared, coins paid. Shift 8: phase `won`. Else phase `shop` and offers are made.
   - no Fires left and below target: phase `lost`.
   - else: stay in `build`, the player may Fire again.
4. **Shop**: buy, sell, reroll. `startNextShift` moves on.
5. Merges (3 equal parts, same level, below max level -> 1 part of level + 1) are applied after every buy and at the start.

## Formulas
- `target(shift) = round(targetBase * targetGrowth^(shift - 1) * voltageMultiplier)` = `round(16 * 1.45^(shift-1) * mult)`.
- Clear payout = `baseShiftPayout (4)` + `1 * firesLeft` + overkill + `pendingCoins`.
  Overkill = `min(4, floor((shiftTotal - target) / (target * 0.5)))`.
- Sell value = `max(1, floor(cost * 0.5 * level))`.
- Reroll price = `1 + 1 * rerollsThisShift`; the first `bonuses.freeRerolls` rerolls of a shift cost 0.
- Offer weight = rarity weight (by shift band) x `min(2.5, 1 + 0.5 * owned parts sharing a tag)`.
  At least one offer shares a tag with an owned part when any candidate does. Never the same part twice.
- Randomness: `makeRng(seed + rngState)`, then `rngState + 1`. Same seed + same actions = same offers.
- Bench size = `startBenchSize (5)` + `bonuses.benchSize` + passive. Shop slots = 3 + `bonuses.shopSlots` + passive.

## Data tables
Shift rarity weights (common / rare / legendary): shifts 1-2 = 85/15/0, 3-5 = 65/30/5, 6-8 = 50/38/12.

| Inventor | Kit | Coins | Passive |
|----------|-----|-------|---------|
| tinkerbot | coil, coil, bend, amplifier | 6 | none |
| clockmaker | counter, anvil, bend, bend | 4 | benchSize +1 |
| drvolt | splitter, splitter, battery, coil | 5 | sparkCount 2, startValue 2 |

| Voltage | Target x | Twists by shift |
|---------|----------|-----------------|
| 1 | 1.0 | 4 deadCell, 8 twoDeadCells |
| 2 | 1.35 | 4 noSplit, 8 rust |
| 3 | 1.8 | 2 fewerSparks, 4 noSplit+deadCell, 6 coldStart, 8 rust+twoDeadCells |
| 4 | 2.4 | 3 fewerSparks, 4 noSplit+deadCell, 5 coldStart, 6 deadCell, 7 rust, 8 rust+twoDeadCells |

## Exported functions
`src/run/runState.js`
- `newRun({ inventorId, voltage, seed, poolIds, bonuses, daily })` -> the run.
- `getTarget(run)` -> number.
- `placeFromBench(run, benchIndex, x, y, rot)`, `moveOnBoard(run, fx, fy, tx, ty)`, `rotatePart(run, x, y)`,
  `returnToBench(run, x, y)` -> `{ ok: true }` or `{ ok: false, reason }`.
  Reasons: `wrong_phase`, `outside_board`, `blocked_cell`, `cell_occupied`, `no_such_bench_part`, `no_part_there`, `bench_full`.
- `fire(run)` -> `{ ok, result, passed, shiftCleared, runOver }` (`result` = full simulate result with events) or `{ ok: false, reason }` (`wrong_phase`, `no_fires_left`).
- `startNextShift(run)` -> `{ ok, shift, movedToBench, sold }`.
- `runSummary(run)` -> `{ won, shiftReached, shiftsCleared, voltage, inventorId, daily, bestFire, totalBanked, partsOwned, coinsLeft }`.

`src/run/shop.js`
- `makeOffers(run)` -> `{ ok }`; `buyOffer(run, index)` -> `{ ok, merged: [{ partId, newLevel }] }` or reason
  (`not_shop_phase`, `no_such_offer`, `already_sold`, `not_enough_coins`, `bench_full`).
- `sellPart(run, { kind: 'bench', index } | { kind: 'board', x, y })` -> `{ ok, coins }`.
- `rerollOffers(run)` -> `{ ok, price }`; `rerollPrice(run)` -> number.

`src/run/merge.js`: `findMerges(run)` -> groups `{ partId, level, members }`; `applyMerges(run)` -> `{ count, merges: [{ partId, newLevel }] }`.
