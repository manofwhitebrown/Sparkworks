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

## Stage 2
- Manager review: APPROVED. The 8 answers below are the official rules.
- Done: `addCoins` change + test; `tests/engine-events.test.js` (500 random boards, all real parts, contract checker; also checks the sample log in docs); real captured Splitter + Amplifier event log in `docs/ENGINE.md`.
- Note for AI-6: a child's `spawn` event comes AFTER the parent's whole walk, while its `split` event comes at the moment the part runs. Details in docs/ENGINE.md.

## Stage 2, item 2 (visit limit): DONE (it was missed first because I had not pulled `docs/manager/to-AI-2.md`)
- `CONFIG.maxVisitsPerCell = 4` in `src/data/config.js`. `simulate` counts entries per cell for each spark (a reused `Uint8Array`, reset per spark, so no extra allocation). The 5th entry fizzles with reason `steps`, at that cell, with no `enter` event.
- Tests in `tests/engine-advanced.test.js`: closed loop ends early (17 enters), a part in the loop acts exactly 4 times, the limit is per spark not per Fire (3 sparks = 3 x 17 enters), `maxSteps` still works on a 40-cell corridor, and a Reverser + Coil + Bend double pass with REAL parts still gives 10.
- `docs/ENGINE.md` has a new "Visit limit" section. Speed unchanged (10,000 sims in about 75 ms). `npm test` 265 of 265, build OK.
- Effect check: a ring with two level 3 Amplifiers on straight cells now gets 8 amplifier passes instead of 20.
- FYI for AI-3 and AI-8: a looping spark never banks, so loops cost value; they no longer give runaway numbers.

## Cheat menu (manager's NEW JOB): DONE
- Files (all in `src/cheats/`): `gate.js`, `sha256.js`, `menu.js`, `tabRun.js`, `tabShop.js`, `tabMeta.js`, `tabDebug.js`, `runCheats.js`, `shopCheats.js`, `metaCheats.js`, `debugTools.js`, `cheatEnv.js`, `menuUi.js`, `menuStyles.js`. Docs: `docs/CHEATS.md` (no password, hash or gesture in it). Tests: `tests/cheats-gate|sha256|run|meta|debug|menu.test.js`.
- **One edit outside my folder (AI-1, please note):** `src/main.js` now has `import { installCheats } from './cheats/gate.js';` and a last line `installCheats();`.
- Only `gate.js` + `sha256.js` are in the main bundle. The menu is its own chunk (about 7.6 KB gzipped), loaded after the right password.
- Checked by hand in headless Chromium at 360 x 740 on the dev server: the hidden gesture opens the prompt (a shorter one does not), wrong tries show "No.", the 3rd locks it with a countdown, Esc closes; the real menu opens, RUN / SHOP / META / DEBUG buttons change the live run (coins, target, skip to shift 4 with its Overload cell, board size, give part), `cheat:changed` refreshes the screens, undo works, the FPS box shows, the error bar shows the test error. I do NOT know the real password, so that part was tested with wrong passwords and with the menu opened by import. The password check itself is covered by tests with a fake password.
- Things I decided (tell me if you disagree): giving parts is refused when the bench is full (use "+1 bench slot"); shrinking the board or "Board to bench" raises the bench bonus so nothing is lost; spark count and start value last until the next shift starts; Preview Fire uses the machine's current seed (real Fires use a new one); the last Fire log is rebuilt from the run's seed counter and matched against `run.lastFire.total` (exact in 30 of 30 test runs); the menu layer uses z-index 100000 (the gate prompt does too), the style guide asked for about 9000 but nothing of AI-7's is above 70.

## ROUND 4 (beginner round): DONE, items 1 to 4 (Portal included)
- **1. `ctx.x`, `ctx.y`, `ctx.cols`, `ctx.rows`** are in (read only, set on every part call). Tests in `tests/engine-round4.test.js`, a line in `docs/ENGINE.md`.
- **2. `src/engine/pathInfo.js`**: `pathCells(events)` and `touchedParts(events)`. Tested against real `simulate` logs (loops, splits, blocked, banned, disabled, portals) in `tests/engine-path.test.js`.
  To make `touchedParts` exact from the log alone, `enter` events now have an OPTIONAL `partId` field. It is set only when an active part acts in that cell (not for empty, blocked, banned or disabled cells). Old consumers can ignore it.
- **3. Bonus tiles**: `machine.bonusCells = [{ x, y, kind: 'add' | 'mult', amount }]`. The part runs first, then the bonus. New event type `EVT.BONUS`.
  `validateMachine` checks `bonusCells`, `cloneMachine` copies it (deeply).
- **4. Portal pair (stretch)**: DONE, it was not too risky. New event type `EVT.PORTAL`. Rules are in `docs/ENGINE.md`.
- `docs/ENGINE.md` is updated (new sections, a second REAL captured log with a bonus tile and a portal pair, both logs are re-run by `tests/engine-events.test.js`). The random contract checker also runs 300 boards with bonus tiles and portal pairs.
- Speed is unchanged (10,000 sims of a 5x4 board with `recordEvents: false` in about 0.1 s). `npm test` 509 of 509, build OK.
- Bug I found and fixed in my own cheat menu (`src/cheats/runCheats.js`): "Board size" shrinking left bonus tiles outside the board; they are removed now, like blocked cells. `validateMachine` caught it.

### Final shape of the new events (for AI-3 and AI-6)
- `bonus`: `{ n, type: 'bonus', spark, x, y, kind: 'add' | 'mult', amount, before, after }`. Only made when the value really changes. It comes right after the part's own events of that cell and before the `enter` of the next cell.
- `portal`: `{ n, type: 'portal', spark, x, y, toX, toY, dir, value }`. `x, y` = the portal the spark entered, `toX, toY` = the partner. There is NO `enter` event for the partner cell. After the jump the spark's next `enter` is the cell it moves to out of the partner (same direction).
- `enter`: now may have `partId` (string) when a part acted there.
- **To AI-3 (portal part):** the engine finds a portal pair by the id `'portal'` itself (the first two cells with that id in `machine.cells` order, on the board, not banned). Your `portal.js` only needs the normal fields; its `onPass` should do nothing. Do not try to move the spark yourself. A lone portal does nothing.
- **To AI-6 (renderer):** draw a `portal` event as the spark leaving cell (x, y) and appearing in (toX, toY) with the same direction. A `bonus` event can pop the tile at (x, y) and show `before -> after`. For the path preview use `pathCells(events)` (it already includes portal exits).

## Build break from AI-1's report: FIXED
- `tests/cheats-meta.test.js` named the 3 old inventors, so it broke when AI-4 added `msbounce` and `banker`. It now compares with `INVENTORS` (and checks max voltage for every inventor), so a new inventor never breaks it. My mistake, thanks AI-1. No other test of mine names the inventor list.

## Working on
- Nothing open. Available for balance changes.

## Changes I need from other AIs (cheat menu)
- AI-7: all of it is in (`getCurrentRun`, `setCurrentRun`, `cheat:changed`, `cheat:speed`, cheated results line). Optional: send `{ events: out.result.events }` with `ui:fired`; the menu would then use the real log instead of rebuilding it.
- AI-5: `recordRunEnd` and `recordDaily` already ignore cheated runs (checked in the code). Nothing needed.
- AI-4: `getTarget` already uses `targetMultiplier`. Nothing needed.

## Answers to other AIs
- To AI-3: `ctx.fire.partsOnBoard` counts ACTIVE parts only: parts that sit on the board, are not in `machine.banned`, have a known part id and an `onPass`. Parts on blocked cells still count (the cell is dead but the part is placed). Parts disabled during the Fire still count (it is fixed at the start).
- Latest check: after `npm install`, `npm run build` passes and `npm test` is 220 of 221. Only `integration-tutorial` (AI-8, imports a `.css` file under Node) fails.
- Earlier check: 213 of 215 pass; the 2 failures are `core-platform` (needs `npm install`) and `integration-tutorial` (imports `.css`), both not mine.

## Blocked / Questions for manager (how I read unclear parts of the contract)
1. Order of work with chains of splits: I use one first-in-first-out line per source spark (parent, its children, then grandchildren). Spawn order therefore equals id order.
2. `maxSteps`: a spark fizzles when `steps > 60` (task file wording), counted in moves.
3. Cap: sources always get a slot (splits stop early enough to leave room for unborn source sparks). Total sparks <= 120.
4. If a part throws, effects it already had (value, children) stay; only the rest is skipped.
5. `total` is also capped at `maxValue`. `addCoins` (changed in Stage 2): ignores anything that is not a finite number above 0 and floors to a whole number, so `coins` is always a whole number >= 0.
6. `fizzle` x,y for reason `edge` = last cell inside the board (so the renderer can draw it at the edge). `end` event has `spark: 0`.
7. `ctx` is one reused object per `simulate` call (fast). Parts must not keep a reference to it.
8. `tests/engine-helpers.test.js` holds the shared fake parts; it ends in `.test.js` so it is also run by `npm test` (it has one tiny test).

