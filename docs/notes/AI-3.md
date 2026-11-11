# Notes: AI-3 (Parts and Twists)

## Done
- All 20 required parts + 4 extra parts (`prism`, `turnstile`, `echo`, `mint`), `parts/index.js`, `partMath.js`
- `twists.js` (6 twists, `applyTwists`, `twistNames` flag)
- `tests/helpers/fakeCtx.js`, `tests/parts-basic|behaviour|twists.test.js` (npm test passes)
- `tests/parts-simulate.test.js`: real `simulate` combos (Coil/Amplifier order, Splitter+Bend banks the copy, Reverser loop, Overdrive, Tollgate, banned parts)
- `docs/PARTS.md` (all 24 parts, 2 combo ideas each, twist list)

## Done in round 4 (manager's list in `docs/manager/to-AI-3.md`)
- **Part A:** every `describe(level, rot)` rewritten for kids (max 10 words a sentence, no jargon, directions in words); `example(level)` added to all parts (`{ before, after }` for the number 2, or `null`); `tests/parts-text.test.js`; `docs/PARTS.md` regenerated.
  - The numbers in the manager's drafts did not match the real parts in a few places (Rectifier +2, Gambler x5, Ember +1, Counter every 2nd at all levels). I used the REAL numbers because the text must be exact.
  - `example` runs the part's real `onPass` on a tiny fake ctx (`makeExample` in `partMath.js`), so the example can never disagree with the part.
- **Part B:** 7 new parts: `spring`, `sideamp`, `bouncer`, `workbench`, `jackpot`, `finisher`, `starter` (31 parts now). `tests/parts-new.test.js`.
- **Part C:** 3 new twists: `closedRow`, `loneSpark`, `noMult`. Tests in `tests/parts-twists.test.js`.

## Registration of the 7 new parts: DONE
AI-5 added the unlock achievements, so `spring, sideamp, bouncer, workbench, jackpot, finisher, starter` are now registered in `index.js` (31 parts).

## Working on
- Nothing blocking. Parts, twists, tests and PARTS.md are finished. Next: retune `dynamo` and `capacitor` in small steps ONLY when the bot shows real lifts (manager item 4 and 5).

## Extra parts (my 4 designs, written before coding)
- `prism` (legendary, cost 10, split, directional): the spark goes straight AND a copy goes toward the rotation AND a copy goes toward the opposite of the rotation, each with 70% / 85% / 100% of the value. Build-around: put Amplifier and Compounder BEFORE it so three paths carry the big number, then make all three paths reach the vault. Combos: `amplifier` before it, `bend` after the side copies to steer them home. Banned by `noSplit` (it has the split tag).
- `turnstile` (rare, cost 5, route, directional): a rotating gate. Spark 1 turns to face the rotation, spark 2 goes straight, spark 3 turns to the opposite of the rotation, then it repeats. A new path puzzle: each spark takes a different road, so you build three roads. Combos: `anvil` / `flywheel` on one road, `reverser` on another.
- `echo` (rare, cost 5, add, state): adds a part of the total already banked in this Fire (`ctx.fire.bankedTotal`): +10% / +15% / +25% of it. Spark 1 gets nothing, later sparks get more. Combos: `ember` (both reward later sparks), `compounder` (the add makes the value bigger before it multiplies).
- `mint` (common, cost 3, economy, add): takes 20% of the spark's value and pays coins: 1 coin per 10 value taken, max 3 / 5 / 8. Trade value for coins. Combos: `amplifier` before it (more value = more coins), `tollgate` (double coin income).

## Blocked / Questions for manager
- `npm test` has 2 failures in files I do not own: `core-platform.test.js` (needs `@capacitor/core` installed) and `integration-tutorial.test.js` (imports a `.css` file under Node). Not mine, left alone.
- I add one helper file `src/engine/parts/partMath.js` (pure boost and label maths, no ctx). It lives in my own folder. Tell me if you want it inside each part instead.

## Changes I need from other AIs
- **AI-2:** `ctx.x`, `ctx.y`, `ctx.cols`, `ctx.rows` are NOT in `simulate.js` yet (contract item 22). `finisher` and `starter` are written for them and do NOTHING until they exist (they never crash). When you push, tell me and I will add real `simulate` tests for both.
- **AI-2:** `portal` (stretch) is NOT built. I will build it once portal pairs are in `simulate`. Tell me the event shape and how a part tells the engine it is a portal.
- **AI-4:** new twist ids for `shifts.js`: `closedRow`, `loneSpark`, `noMult`. New part ids for shop weights and inventor kits: `spring`, `sideamp`, `bouncer`, `workbench`, `jackpot` (legendary), `finisher` (rare), `starter`. `jackpot` costs 10 like the other legendaries.
- **AI-5:** the same 7 part ids for the Patent Book and unlocks (rarity and cost are in `docs/PARTS.md`). Twist ids above if you list them anywhere.
- **AI-6:** icons for `spring` (add + route), `sideamp`, `bouncer`, `workbench` (economy), `jackpot`, `finisher`, `starter`.
- **AI-7:** `describe(level, rot)` now takes the rotation (pass `cell.rot`, or nothing in the shop) and `example(level)` returns `{ before, after }` or `null`.
- AI-2: `ctx.fire.partsOnBoard` must count placed parts (including blocked-by-ban parts? I assume only placed parts).

## Balance worries (to confirm with the bot)
- `jackpot` is the strongest new part on paper: average multiplier x4.7 / x6.1 / x9.6 for cost 10, but it can also lose 10% per pass. Build-around for sure; watch it. `starter` at the source cell is a flat +6 / +10 / +16 for every spark for cost 3, so it may be better than `coil`. `bouncer` L1 is a pure coin flip with no bonus, so it is a risk part you only want with two good roads.
- Labels I used instead of the manager's long note text: `finisher` shows `last col` and `starter` shows `1st col` (labels stay short).
- `fuse` L3 x15 and `overdrive` L3 x6 may be too strong when stacked with Battery (boost 2 turns x15 into x29). Maybe cap boost on risk parts.
- `prism` L3 gives 3 full-value roads; strong, but costs 10 and needs 3 roads to reach the vault.
- `mint` may be too weak at L1 (max 3 coins). `echo` is weak when sparks bank late.
- `ember` and `echo` do nothing for a 1-spark machine (`fewerSparks` twist hurts them).

## Balance probe (my own, 6000 random 5x4 boards with 6 random parts, real `simulate`; AI-8's bot will confirm)
- Typical effect (average log10 of total with / total without the part): top at L3 are `dynamo` 0.36, `prism` 0.28, `fuse` 0.27, `rectifier` 0.25, `coil` 0.24, `anvil` 0.24. No part is wildly dominant. Nothing is useless alone except the route parts, which look negative only because random rotations break the road.
- `dynamo` leads at both levels. With 6+ parts it is +6/+12/+18 against `coil` +3/+5/+8, so it is clearly better than `coil` late in a run (early, with 2-3 parts, `coil` wins). I did NOT change it yet. If the bot agrees, try `perPart` 1 / 1.5 / 2.
- `tollgate`, `mint` and `capacitor` score about 0 for score on random boards. That is expected for the economy parts (their value is coins), but `capacitor` looks a bit weak: try storing 50% / 70% / 90%.
- Runaway loops: 0.1% of random L3 boards pass 1e6, a few reach 1e100+. A closed loop lets `compounder`, `amplifier` or `prism` stack up to the 60-step limit, because their caps apply per pass, not per Fire. That is an engine/loop-design question for the manager, not a part number. If it matters, ask AI-2 for a per-spark pass limit on one cell.

## First bot run (`node tools/partStats.js --runs 200`, normal and `--smart`)
- Overall win rate was 0.0% in both runs, so every "lift" is 0.0% and I cannot tune any part number from it. Probably shift targets (AI-4) or the bot's building (AI-8) are too hard; not a parts problem. I changed NO part numbers.
- `gambler` was offered 37-48 times and bought 0 times, `overdrive` 0 of 4, `prism` 0 of 1. For `gambler` this may be the bot's buying rule (it may skip `risk` parts) or the part being too weak at L1 (x0.5 25% of the time). AI-8: please say which. If it is the part, I would make the L1 table x0.5 (15%), x1 (25%), x2 (35%), x4 (25%).
- `bend` is always bought and is "dead" on about 75% of boards (placed but never touched). Likely the bot placing bends badly, not a part issue.
- I will retune `dynamo` and `capacitor` (see the balance probe above) as soon as a run has a non-zero win rate.

## Report to manager (after AI-4's retune: smart bot wins 28-29%, `partStats --runs 300 --smart`)
1. **Loop probe baseline (BEFORE AI-2's visit limit; `maxVisitsPerCell` is not in config yet):** 20,000 random L3 boards: 13 pass 1e12 and 1 passes 1e100. I will re-run it when AI-2 pushes the limit.
2. **`gambler` is a bot-rule artifact, not a weak part.** `tools/lib/shopBot.js` scores an offer as rarity + 2 x tags shared with owned parts. `gambler` has only the `risk` tag, shared only with `fuse`, so it always scores 1 and never wins. Same reason `prism` and `overdrive` look unbought (also rarely offered). AI-8: please give every part a fair score (for example a flat bonus per tag, or score by simulated gain). I did NOT change `gambler`. Its L1 average multiplier is about x1.78 for 3 coins, against Amplifier x2 for 5.
3. **The "TOO WEAK" flags are probably inventor kit confounds.** `splitter` and `battery` both show exactly -23.0% with exactly 100 owned runs, `triplet` and `overdrive` both -29.0%. Identical numbers point to the same set of runs: the Dr. Volt kit (the weakest inventor, wins 12%). Lift should be compared within one inventor. AI-8: please split `partStats` by inventor.
4. **"TOO STRONG" `compounder` (+25.5%) rests on 11 owned runs** (16 bought). Too few to act on. Its cap applies per pass, so unbounded loops are the real danger, and the visit limit should fix that. I did NOT change it.
5. **Decisions:** no part numbers changed. `dynamo` lift is +15.3%, below the tool's 25% "too strong" line, so I am not applying 1 / 1.5 / 2 yet. `capacitor` lift is +6.9% with 155 bought, so it is not too weak; I am not applying 50 / 70 / 90 yet.
6. `docs/PARTS.md` lists all 4 extra parts (`prism`, `turnstile`, `echo`, `mint`) with combos.

## Covering for AI-4 (owner asked me to; AI-4 seems away). I changed NO file of AI-4's.
- Checked the whole of `docs/manager/to-AI-4.md`: reroll price restart (`shop.js`, test, `RUN.md`), `getTarget` x `run.targetMultiplier` (+ test), `startNextShift` from a cheat-set shop phase keeping `cheated` (+ test), and the kit tuning (Dr. Volt: `startValue: 2` only, kit back to spec) are ALL already done and tested. `npm test`: 280 of 281 pass (only `core-platform`, needs `npm install`).
- Only open item: manager item 5, apply a sweep in `src/data/shifts.js` once approved. Here is a sweep (`tools/simulate.js --runs 150 --voltage 1 --inventor all --seed 1`, `targetBase` 16, only `targetGrowth` changed, then reverted):

| targetGrowth | normal bot wins | smart bot wins |
|--------------|-----------------|----------------|
| 1.45 (now)   | 2.0%            | 35.3%          |
| 1.40         | 9.3%            | 50.7%          |
| 1.35         | 16.7%           | 55.3%          |
| 1.30         | 24.0%           | 62.0%          |

- Goal was smart 30-50% and normal 10-25% at Voltage 1. The two cannot both be met by this one number. **1.40 is the closest** (normal 9.3%, smart 50.7%). Voltage 2 at 1.45 is 0% normal and 11.3% smart, so V2 needs the multipliers looked at too. Manager: say "apply 1.40" and it is a one-line change (`targetGrowth: 1.40`), or tell me another number.

## Loop probe AFTER AI-2's visit limit (`maxVisitsPerCell` 4), as asked in manager item 3
- Same kind of probe: 20,000 random 5x4 boards, 6 random L3 parts, real `simulate`, seed 777 (scratch script, not in the repo).
- Result: 5 boards pass 1e6, **2 pass 1e12, 1 passes 1e100** (max 1.8e111). Before the limit it was 13 passing 1e12 and 1 passing 1e100. The limit helped a lot (13 to 2 for 1e12), but one board still gets huge.
- The remaining board: `bend`(0,1) > `compounder`(1,1) > `prism`(2,1) rot 0 > `tollgate`(4,1), with an `amplifier` at (4,0) and a `counter`. The `prism` copy that goes backwards (left) re-enters the `compounder` and the `prism` again, and each pass makes more copies. This is the `prism` + `compounder` + loop case. It is a 1 in 20,000 random-board result and a real player would need to build it on purpose, so I changed NO numbers. Manager: if you want it gone, the options are a visit limit of 3, or a cap on `compounder` per Fire. Your call.
- Manager item 5b: confirmed, `docs/PARTS.md` lists all 4 extra parts (`prism`, `turnstile`, `echo`, `mint`) with combos.
