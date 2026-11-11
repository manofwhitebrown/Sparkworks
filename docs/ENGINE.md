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

Read: `value`, `dir`, `level`, `rot`, `boost`, `state`, `fire`, `rng()`, and the position fields
`x`, `y` (the cell of THIS part) and `cols`, `rows` (the board size). They are read only and set for every part call,
so a part can know where it stands (a Finisher works only when `x === cols - 1`).
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

## Bonus tiles (contract item 23)

`machine.bonusCells = [ { x, y, kind: 'add' | 'mult', amount } ]` is optional. A spark that ENTERS such a cell gets the
bonus, also on an empty cell, also on the source cell and on every re-entry in a loop. Rules:

- Order inside one cell: the part runs first (if there is an active one), then the bonus, then (if a portal) the jump.
- `add`: value + amount. `mult`: value x amount. The result is clamped to `[0, maxValue]` like `setValue`.
- A bonus makes a `bonus` event only when the value really changes (like `value`). A `x1` or `+0` tile is silent.
- A blocked cell stays blocked: the spark fizzles first, so there is no bonus. Banned parts do not matter (the tile still pays).
- A child spark does not get the bonus of the cell it was born in (it moves away first), only the cells it enters.
- Bad tiles are ignored by `simulate` (outside the board, unknown `kind`, amount not a number). If two tiles share
  a cell, the first one wins. `validateMachine` reports all of these in plain English.
- The visit limit still applies, so a loop cannot pay a bonus forever.

Event: `{ n, type: 'bonus', spark, x, y, kind, amount, before, after }`.

## Portal pair (contract item 23, stretch)

Two cells with `partId: 'portal'` are partners: the first and the second in `machine.cells` order that are on the board.
A lone portal (and a third or fourth one) does nothing. The engine knows the id `portal` by itself, so it works even when
the part file is missing; the part's own `onPass` (if AI-3 gives it one) runs as usual first and should do nothing.

- A spark that enters one portal appears in the partner cell with the SAME direction and value, and its next step goes
  out of the partner. The partner cell makes no `enter` event; the `portal` event is the jump.
- Order inside the entry cell: part, bonus tile, jump. The partner cell's own bonus tile is not paid by a jump
  (the spark never "entered" it).
- Loop limits: entering the first portal is one visit of it, the jump counts as one visit of the partner cell. A jump
  does not add a step. If the partner would get its 5th visit, the spark fizzles there with reason `steps`.
- `machine.banned` containing `'portal'` switches the pair off. A blocked entry cell fizzles the spark as always;
  a blocked partner cell switches the pair off (the spark walks on from the entry cell).
- A child born in a portal cell does not jump at once (it moves away first), like for any other part.

Event: `{ n, type: 'portal', spark, x, y, toX, toY, dir, value }` where `x, y` is the portal entered and
`toX, toY` the partner.

## Path helpers for the UI (`src/engine/pathInfo.js`)

Pure functions that read an event log. They never change it.

- `pathCells(events)`: the cells that any spark (source sparks and their children) entered, each cell once, in first-visit
  order, as `[{ x, y }]`. A portal jump adds the partner cell right after the portal. A blocked cell the spark walked
  into is included (the spark did enter it).
- `touchedParts(events)`: the cells where a part really acted (at least one spark entered it while the part was active:
  not banned, not on a blocked cell, not yet disabled), in first-touch order. A part that changes nothing still counts.
  Portal ends count when a spark used the pair.

How `touchedParts` is exact from the log alone: an `enter` event has an OPTIONAL `partId` field, set only when an active
part acts in that cell (it is left out for empty cells, blocked cells, banned parts and disabled parts). Renderers
may ignore it.

## Fire stats for the juice (`src/engine/fireStats.js`)

`fireStats(events)` reads the event list of one Fire and returns plain numbers, so the renderer (AI-6) and the audio (AI-8)
can scale their effects. Pure, changes nothing, never NaN or Infinity, bad input gives all zeros (multiplier 1).
A 120-spark Fire takes well under 1 ms (a test checks it).

| field | meaning |
|---|---|
| `chainLength` | the most changes ONE spark had: `value`, `turn`, `split`, `bonus`, `portal` events |
| `biggestMultiplier` | largest after / before of a `value` event (events labelled `+n` or `-n` do not count) or of a `mult` bonus tile; 1 when none |
| `biggestBank` | the largest single banked value; 0 when nothing banked |
| `bankedCount`, `lostCount` | number of `bank` and of `fizzle` events |
| `splitCount` | number of `split` events |
| `intensity` | 0..1 overall size: 40% bank (log10, full at 1e6), 25% multiplier (log2, full at x64), 20% chain (full at 12), 15% splits (full at 10) |

Example: Coil then Amplifier gives `{ chainLength: 2, biggestMultiplier: 2, biggestBank: 8, bankedCount: 3, lostCount: 0, splitCount: 0 }`.

## Edge cases

- **Empty board:** each spark walks straight to the vault. Total = `sparkCount * startValue`.
- **Blocked cell:** the spark fizzles there (`blocked`), the part on that cell (if any) never acts.
- **Loops:** a closed loop ends by the visit limit (below); the spark fizzles with reason `steps`. A very long
  walk that never repeats a cell 5 times still ends by `maxSteps`. Splitters inside a loop are stopped by the 120-spark cap.
- **Bad machine:** a source row outside the board fizzles every spark. Cells outside the board are ignored.
  Use `validateMachine` in the UI to show a friendly message.

## Result and events

`{ events, total, coins, banked, fizzled, errors }`. The event types are in `EVT` (`src/engine/eventTypes.js`), including
`bonus` and `portal`. With `recordEvents: false`, `events` is `[]` and no event
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
{"n":2,"type":"enter","spark":1,"x":1,"y":1,"dir":"right","value":1,"partId":"splitter"}
{"n":3,"type":"split","spark":1,"x":1,"y":1,"partId":"splitter","child":2,"dir":"right","value":0.5,"label":"50%"}
{"n":4,"type":"enter","spark":1,"x":2,"y":1,"dir":"right","value":1,"partId":"amplifier"}
{"n":5,"type":"value","spark":1,"x":2,"y":1,"partId":"amplifier","before":1,"after":2,"label":"x2"}
{"n":6,"type":"enter","spark":1,"x":3,"y":1,"dir":"right","value":2}
{"n":7,"type":"enter","spark":1,"x":4,"y":1,"dir":"right","value":2}
{"n":8,"type":"bank","spark":1,"value":2,"runningTotal":2}
{"n":9,"type":"spawn","spark":2,"x":1,"y":1,"dir":"right","value":0.5,"parent":1}
{"n":10,"type":"enter","spark":2,"x":2,"y":1,"dir":"right","value":0.5,"partId":"amplifier"}
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
- `enter` has an optional `partId` when an active part acts in that cell (x=1 and x=2 above, not the empty cells).

## A real captured log with a bonus tile and a portal pair

Machine: a Portal at (1,1) with a `x2` bonus tile on the same cell, its partner Portal at (3,2), a Coil (+3) at (4,2),
`sparkCount` 1, seed 1. The spark enters (1,1), the bonus doubles it (1 to 2), the jump puts it in (3,2) going right,
it moves to (4,2) where the Coil makes it 5, and it banks. A test re-runs this machine too.

<!-- captured-machine-2 -->
```json
{"cols":5,"rows":4,"sourceRow":1,"sparkCount":1,"startValue":1,"cells":[{"x":1,"y":1,"partId":"portal","level":1,"rot":0},{"x":3,"y":2,"partId":"portal","level":1,"rot":0},{"x":4,"y":2,"partId":"coil","level":1,"rot":0}],"blocked":[],"banned":[],"flags":{},"seed":1,"bonusCells":[{"x":1,"y":1,"kind":"mult","amount":2}]}
```

Result: `{"total":5,"coins":0,"banked":1,"fizzled":0,"errors":0}`. One event per line:

<!-- captured-log-2 -->
```json
{"n":0,"type":"spawn","spark":1,"x":0,"y":1,"dir":"right","value":1,"parent":0}
{"n":1,"type":"enter","spark":1,"x":0,"y":1,"dir":"right","value":1}
{"n":2,"type":"enter","spark":1,"x":1,"y":1,"dir":"right","value":1}
{"n":3,"type":"bonus","spark":1,"x":1,"y":1,"kind":"mult","amount":2,"before":1,"after":2}
{"n":4,"type":"portal","spark":1,"x":1,"y":1,"toX":3,"toY":2,"dir":"right","value":2}
{"n":5,"type":"enter","spark":1,"x":4,"y":2,"dir":"right","value":2,"partId":"coil"}
{"n":6,"type":"value","spark":1,"x":4,"y":2,"partId":"coil","before":2,"after":5,"label":"+3"}
{"n":7,"type":"bank","spark":1,"value":5,"runningTotal":5}
{"n":8,"type":"end","spark":0,"total":5,"coins":0}
```

Notice: there is no `enter` for the partner cell (3,2); the `portal` event is the jump. The Portal cell's own `enter`
has no `partId` here because the part file `portal` does not exist yet. Once AI-3 adds it, that `enter` also carries
`partId: "portal"` (the test ignores that one field).
