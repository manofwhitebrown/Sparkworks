# ENGINE: how a Fire runs

Owner: AI-2. Files: `src/engine/simulate.js`, `board.js`, `eventTypes.js`, `src/data/config.js`.

`simulate(machine, options)` is pure and headless. No DOM, no timers, no `Date`, no `Math.random`.
Same machine + same seed = the same events, every time. It never changes the machine it is given.

## How a spark walks

1. A source spark is born at `(0, sourceRow)` moving `right`, with `startValue`. The engine emits `spawn`.
2. The spark ENTERS a cell (`enter`).
   - Blocked cell: `blocked` + `fizzle` (reason `blocked`). The spark ends.
   - Else, if the cell holds an active part, the part's `onPass(ctx)` runs. It may change the value, the direction, make children, give coins.
3. The spark moves ONE cell in its CURRENT direction (a part may have turned it). `steps` goes up by 1.
   - Landed on `x = cols`: `bank`. Its value is added to the total.
   - Left by any other edge: `fizzle` (reason `edge`).
   - `steps` above `CONFIG.maxSteps` (60): `fizzle` (reason `steps`). This is what stops loops.
4. Go to 2.

A part acts every time a spark enters its cell, also when the spark comes back in a loop.

## Order of work

- Source sparks run one at a time: 1, 2, 3 ... `sparkCount`.
- A spark's children (made by `ctx.split`) run right after it, before the next source spark. Children go in a
  first-in-first-out line: the parent, then its children in the order they were made, then THEIR children.
- Spark ids are numbered 1, 2, 3 in creation order, so they also match the order of `spawn` events.
- At most `CONFIG.maxSparksPerFire` (120) sparks per Fire. Extra splits are ignored. Room is kept for source
  sparks that are not born yet, so the cap never removes a real source spark.
- A child starts by MOVING one cell. It does not trigger the part that made it.
- A booster is a part with `boostFor(level)`. Each part's `ctx.boost` = product of `boostFor` of its (up to 4)
  neighbours. Banned parts do not count.
- Parts in `machine.banned` are left out: they are empty cells. A part that calls `ctx.disable()` stops
  acting for the rest of this Fire.

## What `ctx` can do

Read: `value`, `dir`, `level`, `rot`, `boost`, `state`, `fire`, `rng()`.
Act: `setValue(v, label)`, `setDir(dir)`, `turnToFacing()`, `split(dir, value, label)`, `addCoins(n)`, `disable()`, `note(label)`.

- `setValue` clamps to `[0, maxValue]`. NaN, Infinity and non-numbers are ignored (old value stays).
  A `value` event is made only when the value really changed. `setDir` makes a `turn` event only on a real change.
- `state` is empty at the start of every `simulate` call and kept across sparks inside one Fire.
- If `onPass` throws, the error is caught and counted in `result.errors`. The game goes on.
  Anything the part did before throwing stays.

## Three worked examples (per spark, start value 1)

Coil = +3, Amplifier = x2, both on row 1 (the source row).

**Coil then Amplifier** (Coil at x=1, Amplifier at x=2): 1 + 3 = 4, then 4 x 2 = **8**.

**Amplifier then Coil** (Amplifier at x=1, Coil at x=2): 1 x 2 = 2, then 2 + 3 = **5**.
With 3 sparks that is 24 and 15. Order matters.

**Splitter** (a part at x=1 that calls `ctx.split('right', ctx.value)`, Coil at x=2):
the parent enters x=1 (still 1), the child is born with value 1. The parent moves to x=2: +3 = 4, banks 4.
The child's first action is to move to x=2 as well: +3 = 4, banks 4. Per spark **8**, so 24 for the Fire.
Event order: `spawn 1`, `enter`, `split`, `enter`, `value`, `bank`, `spawn 2`, `enter`, `value`, `bank`, then the next source spark.

## Edge cases

- **Empty board:** each spark walks straight to the vault. Total = `sparkCount * startValue`.
- **Blocked cell:** the spark fizzles there (`blocked`), the part on that cell (if any) never acts.
- **Loops:** a loop ends by `maxSteps`; the spark fizzles with reason `steps`. Splitters inside a loop are
  stopped by the 120-spark cap.
- **Bad machine:** a source row outside the board fizzles every spark. Cells outside the board are ignored.
  Use `validateMachine` in the UI to show a friendly message.

## Result and events

`{ events, total, coins, banked, fizzled, errors }`. With `recordEvents: false`, `events` is `[]` and no event
objects are built (much faster); every other number is identical. `end` is always the last event.
Positions in `fizzle` events: for `edge`, the last cell INSIDE the board; for `blocked` and `steps`, the cell the spark is in.
