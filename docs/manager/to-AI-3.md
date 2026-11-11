# Manager to AI-3

Good work: all parts, twists and PARTS.md are in, tests pass.

1. `partMath.js` inside your own folder is fine. Keep it.
2. Your `partsOnBoard` question is answered (contract section 12, item 9).
3. Runaway loops: AI-2 is adding a per-spark visit limit per cell (4). When AI-2 has pushed it, re-run your balance probe and tell me how many random L3 boards still pass 1e100.
4. Do NOT retune part numbers yet. The bot wins 0% of runs, so there is no signal. AI-8 is fixing that first. When AI-8's report shows real lifts, retune in small steps.
5. Held decisions: no boost cap on risk parts for now (a Battery next to a Fuse being huge is a feature; we will look again with real data). Your proposals for `dynamo` (perPart 1 / 1.5 / 2) and `capacitor` (50% / 70% / 90%) are approved IN PRINCIPLE: apply them only when the bot shows they are needed.
5b. Please confirm that `docs/PARTS.md` lists your 4 extra parts with combos (prism, mint, echo and the 4th).

---
## ROUND 4 (manager, 2026-11-11): plain texts, new parts, new twists. Read `docs/manager/BEGINNER_REVIEW.md` first
**Part A (do first): rewrite every `describe()` for beginners and kids.** Rules: at most 10 words per sentence, no jargon (not "pass", "banked", "value", "stores", "fizzle", "trigger"), say "number" for the spark's value, name directions in words for directional parts, keep it exact (it must match the real numbers). Add `example(level)` returning `{ before, after }` for a sample spark (use 2 as the sample number; `null` when it makes no sense, for example Bend). Use the second argument `rot` in `describe(level, rot)` for directional parts: "Turns the spark DOWN." (contract 21). Starting drafts, fix anything that is not exact:
- Coil: "Adds 3." Dynamo: "Adds 1 for every part on the board." Ember: "Later sparks get more: +1 for each spark that went before." Anvil: "Gets stronger each spark: +2, then +4, then +6."
- Amplifier: "Doubles the spark (x2)." Compounder: "Big numbers grow more, up to x4." Overdrive: "Huge x6, but only for the FIRST spark of each Fire." Counter: "Every 2nd spark gets x3." Flywheel: "Grows each spark: x1.5, x2, x2.5." Fuse: "The first spark gets x15. Then it burns out."
- Bend: "Turns the spark DOWN." Switch: "Even number: straight on. Odd number: turns DOWN." Reverser: "Sends the spark back. Works once per Fire." Turnstile: "Each spark takes the next road: DOWN, then straight, then UP."
- Splitter: "The spark goes straight. A copy (half the number) goes DOWN." Triplet / Prism: "The spark goes straight. Copies go UP and DOWN."
- Capacitor: "Keeps 40% of one spark and gives it to the next spark." Battery: "Parts next to it work 50% stronger." Rectifier: "Odd number: +2. Even number: x2." Gambler: "Random multiplier: x0.5, x1, x2 or x5." Mint / Tollgate / Echo: use the same plain style.
Update `docs/PARTS.md` and the tests that check the old texts.
**Part B: 8 new parts** (cost, rarity, numbers are a start; AI-8's bot will tell us if they are off). Each file has the header and the new `example`. Use only `ctx` (contract section 6 and 22).
1. `spring` (common, tags add+route, directional, cost 4): adds +2 / +4 / +7 AND turns the spark the way it points. "Adds 2 and turns the spark DOWN."
2. `sideamp` (common, mult, cost 5): x2 / x2.5 / x3, but only when the spark is moving up or down (it came from a bend). Moving sideways: nothing. This rewards steering.
3. `bouncer` (common, route+risk, cost 3): sends the spark UP or DOWN at random (50/50, seeded `ctx.rng`). L2 also adds +2, L3 adds +5.
4. `workbench` (common, economy, cost 4): once per Fire pays 1 coin for every 2 parts on the board (at most 3 / 4 / 6 coins). Use `ctx.state` to pay only once.
5. `jackpot` (legendary, risk, cost 10): chance 20% / 25% / 30% for x20 / x25 / x30, else x0.9.
6. `finisher` (rare, mult, cost 6): works ONLY in the last column (uses `ctx.x` and `ctx.cols`): x3 / x4 / x6. Otherwise nothing, and `ctx.note('Last column only')`.
7. `starter` (common, add, cost 3): works ONLY in the first column: +6 / +10 / +16. Same note idea.
8. `portal` (rare, route, cost 6): STRETCH, only when AI-2 pushes portal pairs. "Two Portals work as a pair: a spark that goes in one comes out of the other." If AI-2 skips it, skip it too.
Send the new ids to AI-5 (Patent Book and achievements) and AI-4 (shop weights and inventor kits), and ask AI-6 for icons, in your notes. The part list in the contract grows from 24 to 31 (or 32 with Portal).
**Part C: 3 new Overload twists** in `src/engine/twists.js`, each with a plain `description` a kid can read: `closedRow` (one whole row except the source row is blocked), `loneSpark` (only 1 source spark, start number 5), `noMult` (all parts tagged `mult` are banned for the shift). Keep the old ones. Tell AI-4 the ids so they can put them in `shifts.js`.
