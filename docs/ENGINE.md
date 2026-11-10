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
   - `steps` above `CONFIG.maxSteps` (60): `fizzle` (reason `steps`).
   - The spark would enter the same cell for the `CONFIG.maxVisitsPerCell` + 1 = 5th time: `fizzle` (reason `steps`).
     This ends closed loops early (see "Visit limit" below).
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
The exact event order is in the captured log below.

## Visit limit (contract section 12, item 8)

A spark may ENTER the same cell at most `CONFIG.maxVisitsPerCell` (4) times. The 5th entry makes it fizzle
with reason `steps`, at that cell, and that refused entry makes no `enter` event (the same way the 61st step
makes none). Rules:

- It is counted per spark, not per Fire: every spark, also every child, starts with a clean count.
- A source spark's first cell `(0, sourceRow)` counts as visit 1. A child's birth cell does not count,
  because the child moves away first.
- Why: in a closed loop a part such as an Amplifier used to act on every lap until the 60-step limit,
  and stacked up to about 1e100. With the limit, a ring with two level 3 Amplifiers on straight cells gets
  8 passes (x6,561) instead of 20 (x3.5 billion).
- Normal play is not touched: a Reverser double pass (Coil entered 3 times) works as before.
  The step limit (60) stays as the second safety net for long walks that never repeat a cell 5 times.

## Edge cases

- **Empty board:** each spark walks straight to the vault. Total = `sparkCount * startValue`.
- **Blocked cell:** the spark fizzles there (`blocked`), the part on that cell (if any) never acts.
- **Loops:** a closed loop ends by the visit limit (below); the spark fizzles with reason `steps`. A very long
  walk that never repeats a cell 5 times still ends by `maxSteps`. Splitters inside a loop are stopped by the 120-spark cap.
- **Bad machine:** a source row outside the board fizzles every spark. Cells outside the board are ignored.
  Use `validateMachine` in the UI to show a friendly message.

## Result and events

`{ events, total, coins, banked, fizzled, errors }`. With `recordEvents: false`, `events` is `[]` and no event
objects are built (much faster); every other number is identical. `end` is always the last event.
Positions in `fizzle` events: for `edge`, the last cell INSIDE the board; for `blocked` and `steps`, the cell the spark is in.

## Coins

`ctx.addCoins(n)` ignores anything that is not a finite number above 0 and rounds down to a whole number
(0.9 gives nothing, 2.7 gives 2). So `coins` is always a whole number that is never negative.

## A real captured event log (Splitter + Amplifier)

Made by running the real parts with `simulate()`. A test (`tests/engine-events.test.js`) re-runs this machine
and fails if the log below ever stops matching, so it can be trusted as a sample.

Machine: Splitter (level 1, pointing right, rot 0) at x=1, Amplifier (level 1) at x=2, `sparkCount` 1, seed 1.
The Splitter sends a copy with 50% of the value to the right.

<!-- captured-machine -->
```json
{"cols":5,"rows":4,"sourceRow":1,"sparkCount":1,"startValue":1,"cells":[{"x":1,"y":1,"partId":"splitter","level":1,"rot":0},{"x":2,"y":1,"partId":"amplifier","level":1,"rot":0}],"blocked":[],"banned":[],"flags":{},"seed":1}
```

Result: `{ total: 3, coins: 0, banked: 2, fizzled: 0, errors: 0 }`. One event per line:

<!-- captured-log -->
```json
{"n":0,"type":"spawn","spark":1,"x":0,"y":1,"dir":"right","value":1,"parent":0}
{"n":1,"type":"enter","spark":1,"x":0,"y":1,"dir":"right","value":1}
{"n":2,"type":"enter","spark":1,"x":1,"y":1,"dir":"right","value":1}
{"n":3,"type":"split","spark":1,"x":1,"y":1,"partId":"splitter","child":2,"dir":"right","value":0.5,"label":"50%"}
{"n":4,"type":"enter","spark":1,"x":2,"y":1,"dir":"right","value":1}
{"n":5,"type":"value","spark":1,"x":2,"y":1,"partId":"amplifier","before":1,"after":2,"label":"x2"}
{"n":6,"type":"enter","spark":1,"x":3,"y":1,"dir":"right","value":2}
{"n":7,"type":"enter","spark":1,"x":4,"y":1,"dir":"right","value":2}
{"n":8,"type":"bank","spark":1,"value":2,"runningTotal":2}
{"n":9,"type":"spawn","spark":2,"x":1,"y":1,"dir":"right","value":0.5,"parent":1}
{"n":10,"type":"enter","spark":2,"x":2,"y":1,"dir":"right","value":0.5}
{"n":11,"type":"value","spark":2,"x":2,"y":1,"partId":"amplifier","before":0.5,"after":1,"label":"x2"}
{"n":12,"type":"enter","spark":2,"x":3,"y":1,"dir":"right","value":1}
{"n":13,"type":"enter","spark":2,"x":4,"y":1,"dir":"right","value":1}
{"n":14,"type":"bank","spark":2,"value":1,"runningTotal":3}
{"n":15,"type":"end","spark":0,"total":3,"coins":0}
```

Things to notice when you compare with a hand-written sample:

- The `split` event (n=3) is emitted at the moment the part runs. The child's `spawn` event (n=9) only comes
  AFTER the parent has finished its whole walk. The child spark first shows up at `spawn`.
- The child's first `enter` is the NEXT cell (x=2), not the cell it was born in (x=1).
- `spawn` for a source spark is followed by an `enter` of cell (0, sourceRow). Every cell the spark visits has an `enter`,
  also empty ones.
- `spark` on a `split` event is the PARENT; the new spark's id is in `child`.
- `bank` has no x and y. `end` has `spark: 0`.
- `value` is made only when the value really changes (the Splitter does not change the parent, so it has none).
