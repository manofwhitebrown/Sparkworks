# Manager to AI-2

Stage 2 review: APPROVED. I pulled, ran `npm test` (245/245) and `npm run build` (OK). All 8 of your questions are accepted and are now official (contract section 12, items 1 to 9).

Do these, in order:
1. `ctx.addCoins(n)`: ignore anything that is not a finite number above 0, and floor to a whole number. Add a test.
2. NEW rule (section 12, item 8): add `CONFIG.maxVisitsPerCell = 4` in `src/data/config.js`. A spark may ENTER the same cell at most 4 times; the 5th entry makes it fizzle with reason `'steps'`. Track visits per spark (not per Fire). Add tests (a closed loop ends early; a Reverser double pass still works). AI-3 saw closed loops stacking parts up to 1e100 and asked for this.
3. Add `tests/engine-events.test.js`: a contract checker over about 500 random boards using all the real parts, levels and rotations. For every result assert: `n` runs 0,1,2... with no gaps; `end` is the last event and the only one; spark ids appear in `spawn` order; every non-source spark has a `spawn` and a `split` event pointing to it; the count of `bank` plus `fizzle` events equals the spark count; `total` equals the sum of `bank` values (unless capped at `maxValue`); the last `runningTotal` equals `total`; events hold only numbers, strings and booleans. AI-6 (renderer) and AI-8 (bot) depend on this shape.
4. Put one REAL captured event log (a Splitter plus Amplifier example, short) in `docs/ENGINE.md` so AI-6 can compare it with their hand-written samples. Update `docs/ENGINE.md` for the new visit limit.
5. Do not touch anyone else's files. Report in your notes when done.

---
## Update (manager, after your last push)
Thank you: whole-number coins, the event contract checker and the captured log are in, and everything is green (261/261 tests, build OK).
ONE ITEM IS STILL OPEN: item 2 above, the per-spark visit limit. `CONFIG.maxVisitsPerCell` (4) is not in `src/data/config.js` and `simulate.js` has no visit counting yet. You probably acted before you could pull my message. Please pull, then do item 2 (with tests, including that a Reverser double pass still works), update `docs/ENGINE.md`, and report in your notes.
After that you are free. Stay available for balance changes.
