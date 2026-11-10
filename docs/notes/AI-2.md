# Notes: AI-2 (Engine core)

## Done
- `src/data/config.js`: `CONFIG` (cols, rows, sourceRow, sparkCount, startValue, maxSteps, maxSparksPerFire, maxValue, firesPerShift).
- `src/engine/eventTypes.js`: `EVT`.
- `src/engine/board.js`: `DIRS, rotToDir, dirToRot, stepFrom, makeMachine, cloneMachine, getCellAt, placePart, removePart, validateMachine`.
- `src/engine/simulate.js`: `simulate(machine, options)` returns `{ events, total, coins, banked, fizzled, errors }`.
- Tests: `tests/engine-basic|advanced|board|speed.test.js`, shared fakes in `tests/engine-helpers.test.js`. `npm test` passes.
- `docs/ENGINE.md` written.
- Checked against AI-3's 24 real parts on 300 random boards: 0 errors, events/no-events agree.
- Speed: 10,000 simulations (5x4, recordEvents false) take about 70 ms.

## Working on
- Nothing open. Waiting for manager review (Stage 2).

## Answers to other AIs
- To AI-3: `ctx.fire.partsOnBoard` counts ACTIVE parts only: parts that sit on the board, are not in `machine.banned`, have a known part id and an `onPass`. Parts on blocked cells still count (the cell is dead but the part is placed). Parts disabled during the Fire still count (it is fixed at the start).
- Latest check: after `npm install`, `npm run build` passes and `npm test` is 220 of 221. Only `integration-tutorial` (AI-8, imports a `.css` file under Node) fails.
- Earlier check: 213 of 215 pass; the 2 failures are `core-platform` (needs `npm install`) and `integration-tutorial` (imports `.css`), both not mine.

## Blocked / Questions for manager (how I read unclear parts of the contract)
1. Order of work with chains of splits: I use one first-in-first-out line per source spark (parent, its children, then grandchildren). Spawn order therefore equals id order.
2. `maxSteps`: a spark fizzles when `steps > 60` (task file wording), counted in moves.
3. Cap: sources always get a slot (splits stop early enough to leave room for unborn source sparks). Total sparks <= 120.
4. If a part throws, effects it already had (value, children) stay; only the rest is skipped.
5. `total` is also capped at `maxValue`. `addCoins` accepts any finite non-zero number (negative allowed); the engine does not floor coins at 0.
6. `fizzle` x,y for reason `edge` = last cell inside the board (so the renderer can draw it at the edge). `end` event has `spark: 0`.
7. `ctx` is one reused object per `simulate` call (fast). Parts must not keep a reference to it.
8. `tests/engine-helpers.test.js` holds the shared fake parts; it ends in `.test.js` so it is also run by `npm test` (it has one tiny test).

## Changes I need from other AIs
- None.
