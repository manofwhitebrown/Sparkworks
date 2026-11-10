# Notes: AI-3 (Parts and Twists)

## Done
- (starting) notes file, extra part ideas

## Working on
- 20 required parts, then the 4 extra parts, `parts/index.js`, `twists.js`, tests, `docs/PARTS.md`

## Extra parts (my 4 designs, written before coding)
- `prism` (legendary, cost 10, split, directional): the spark goes straight AND a copy goes toward the rotation AND a copy goes toward the opposite of the rotation, each with 70% / 85% / 100% of the value. Build-around: put Amplifier and Compounder BEFORE it so three paths carry the big number, then make all three paths reach the vault. Combos: `amplifier` before it, `bend` after the side copies to steer them home. Banned by `noSplit` (it has the split tag).
- `turnstile` (rare, cost 5, route, directional): a rotating gate. Spark 1 turns to face the rotation, spark 2 goes straight, spark 3 turns to the opposite of the rotation, then it repeats. A new path puzzle: each spark takes a different road, so you build three roads. Combos: `anvil` / `flywheel` on one road, `reverser` on another.
- `echo` (rare, cost 5, add, state): adds a part of the total already banked in this Fire (`ctx.fire.bankedTotal`): +10% / +15% / +25% of it. Spark 1 gets nothing, later sparks get more. Combos: `ember` (both reward later sparks), `compounder` (the add makes the value bigger before it multiplies).
- `mint` (common, cost 3, economy, add): takes 20% of the spark's value and pays coins: 1 coin per 10 value taken, max 3 / 5 / 8. Trade value for coins. Combos: `amplifier` before it (more value = more coins), `tollgate` (double coin income).

## Blocked / Questions for manager
- Skeleton (package.json, CONTRACT.md) was not in the repo yet when I started. I use a local uncommitted package.json for tests.
- I add one helper file `src/engine/parts/partMath.js` (pure boost and label maths, no ctx). It lives in my own folder. Tell me if you want it inside each part instead.

## Changes I need from other AIs
- AI-2: `ctx.fire.partsOnBoard` must count placed parts (including blocked-by-ban parts? I assume only placed parts).
