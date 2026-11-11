# Balance report (AI-8)

Made with `tools/simulate.js` and `tools/partStats.js`, against the game as pushed on 2026-11-10.
Every number below is from the bot, and the bot plays WORSE than a thoughtful human (random layouts
plus 200 hill-climbing steps, simple shopping). Read the absolute win rates as a floor; the
comparisons between settings are what matter. Re-run after every data change:

```
node tools/simulate.js --runs 300 --voltage 1 --seed 1 --smart
node tools/partStats.js --runs 600 --voltage 1 --seed 1 --smart
```

## UPDATE (after AI-4 and AI-3 tuned the numbers)

Smart bot, seed 1, 300 runs per voltage. Verdict at voltage 1: **OK**.

| Voltage | Win rate | Avg shift | Tinkerbot | Clockmaker | Dr. Volt |
|---------|----------|-----------|-----------|------------|----------|
| 1 | 37.3% | 7.10 | 43% | 38% | 31% |
| 2 | 8.7% | 6.53 | 11% | 4% | 11% |
| 3 | 0.7% | 4.29 | 2% | 0% | 0% |
| 4 | 0.7% | 3.65 | 1% | 0% | 1% |

Voltage 1 pass rate by shift: 100 / 99.7 / 98.7 / 90.2 / 95.9 / 89.4 / 81.6 / 60.2. The shift 4 wall is gone and the inventors are close together. What is left:
- Shift 8 (the last Overload) still stops 40% of the runs that reach it. That is a fine finale, so leave it unless players find it unfair.
- Voltages 3 and 4 are near 0% for the bot (voltage 2 is 8.7%). The jump from voltage 2 to 3 is too big: try `targetMultiplier` level 3 at 1.4 and level 4 at 1.7 (AI-4), then re-run. The bot is weaker than a human, so aim for roughly 5% to 15% at voltage 3 and 1% to 5% at voltage 4.
- The Clockmaker is weakest at voltage 2 (4% against 11%). Watch it.

## Part stats after the tuning (600 smart runs, voltage 1, overall win rate 34.8%)

"Lift" = win rate of runs that ended owning the part, minus the overall win rate. Small samples are marked.

| Part | Offered | Bought | Runs owning | Lift | Note |
|------|---------|--------|-------------|------|------|
| fuse | 111 | 13 | 13 | +26.7% | flagged TOO STRONG, but only 13 runs: re-test with more runs |
| prism | 29 | 1 | 1 | +65% | one run only; almost never offered (legendary) |
| overdrive | 43 | 1 | 1 | -34.8% | one run only; almost never offered, and the bot rarely builds it well |
| compounder | 207 | 31 | 26 | +22.9% | strong, rarely bought (costly?) |
| dynamo | 668 | 413 | 291 | +21.2% | healthy strong pick |
| triplet | 149 | 18 | 17 | +18.1% | good, rarely bought |
| gambler | 264 | 5 | 4 | +15.2% | offered a lot, almost never bought: bot score or price too low |
| flywheel | 283 | 101 | 91 | +13.5% | fine |
| amplifier | 451 | 123 | 215 | +11.2% | fine (also in the start kit) |
| splitter, battery | 356, 292 | 97, 63 | 200 each | -5.3% | mostly Dr. Volt's start kit, so low lift is expected |
| bend | 728 | 738 | 600 | 0.0% | ALWAYS BOUGHT, and it is "dead" in 5080 of 7931 placements: the bot rarely finds a use for it |
| anvil | 801 | 724 | 477 | +1.9% | ALWAYS BOUGHT, but no extra wins |

Most parts sit within about +/-5%, which is a healthy spread.

Possibly dead in the layouts the bot built (the Fire total did not change when the part was removed): tollgate 355 of 554, turnstile 357 of 733, capacitor 1127 of 1713, mint 1922 of 3302, reverser 299 of 520. The bot places parts without a plan, so a high number can mean "hard to use", not "does nothing". A designer should still check what each one is for.

Recommended follow-ups: AI-3 look at `fuse` (strong) and `gambler` (never bought); AI-4 raise the legendary shop weight so `overdrive` and `prism` appear often enough to be judged (about 10 to 20 more offers per 600 runs); then re-run `partStats` with 1000+ runs.

The tables below are the ORIGINAL report that led to those changes (kept as history).

## Original report: current game at the time, smart bot, seed 1, 300 runs per voltage (100 per inventor)

| Voltage | Win rate | Avg shift reached | Pass rate by shift (1 to 5) |
|---------|----------|-------------------|-----------------------------|
| 1 | 0.0% | 3.67 | 100 / 92.0 / 66.7 / 19.6 / 11.1 |
| 2 | 0.0% | 3.20 | 100 / 81.7 / 44.1 / 4.6 / 20.0 |
| 3 | 0.0% | 2.25 | 94.7 / 22.5 / 40.6 / 3.8 / 0 |
| 4 | 0.0% | 2.05 | 73.0 / 41.1 / 5.6 / 0 / - |

Verdict at voltage 1 with `--smart`: **TOO HARD** (target is 15% to 70%).

Average coins when the shop opens: 10.5 after shift 1, then about 5 to 7. That is one part per shop.

## What the bot found

1. **The target curve is too steep.** Targets start at 24 and grow x2.1 per shift. The bot's typical best Fire is 70 to 260, so shift 4 and later are out of reach. Shift 4 (the first Overload) is the wall: only 19.6% pass it at voltage 1, against 66.7% for shift 3.
2. **Sweep of `targetGrowth` and `targetBase`** (voltage 1, smart, 300 runs, changed in memory only):

| targetGrowth | targetBase | Win rate | Avg shift | Tinkerbot | Clockmaker | Dr. Volt |
|--------------|-----------|----------|-----------|-----------|------------|----------|
| 2.1 (now) | 24 (now) | 0.0% | 3.67 | 0% | 0% | 0% |
| 1.8 | 24 | 0.3% | 4.20 | 0% | 0% | 1% |
| 1.6 | 24 | 1.7% | 4.95 | 3% | 1% | 1% |
| 1.5 | 24 | 4.0% | 5.51 | 7% | 5% | 0% |
| 1.4 | 24 | 12.7% | 6.13 | 23% | 15% | 0% |
| 1.3 | 24 | 32.7% | 6.72 | 52% | 39% | 7% |
| 1.6 | 16 | 4.7% | 5.99 | 7% | 6% | 1% |
| 1.5 | 16 | 16.7% | 6.52 | 25% | 23% | 2% |
| 1.4 | 16 | 39.3% | 6.94 | 52% | 54% | 12% |
| 1.3 | 16 | 56.7% | 7.24 | 65% | 76% | 29% |

3. **Dr. Volt is the weakest inventor by far** (2 sparks, start value 2, plus the Overload at shift 4 turns splitting off at voltage 1... check `noSplit`). At growth 1.4 / base 16 he wins 12% while the others win 52% to 54%.
4. **Runaway Fires.** Dr. Volt split chains reach 1.8e18, 8.3e20 and even 3.76e183 in one Fire (seed 9, 37, 40). Parts seen in those runs: splitter, battery, compounder, echo, counter, overdrive. The same runs still lost at the shift 4 Overload, so the outliers are a "build for one twist" problem as well as a scaling problem.
5. **Higher voltages are too punishing early.** Voltage 3 shift 2 (`fewerSparks`) passes only 22.5%. Voltage 4 shift 1 passes only 73%.
6. **Parts nobody buys.** `overdrive` (offered 9 times, bought 0) and `prism` (offered 4, bought 0) are almost never in the shop (legendary weight is 0 for shifts 1 and 2 and 5%/12% later). `gambler` is offered 130 times and bought once.
7. **Always bought:** `bend` (355 of 367 offers). It is cheap and every build wants one; fine, but check it is not mandatory.
8. **Possibly dead parts** (removing the part did not change the Fire total, in layouts the bot built): capacitor 385 of 414, tollgate 51 of 68, turnstile 89 of 132, reverser 97 of 133, mint 713 of 996, switch 626 of 832, bend 3790 of 4807. Many of these are the bot placing direction parts badly, so treat as "worth a look", not as proven. Part win-rate lift could not be computed because nobody wins at the current numbers. Re-run `partStats` after the target change.

## Recommended changes

| # | File | Number | Now | Try | Owner |
|---|------|--------|-----|-----|-------|
| 1 | `src/data/shifts.js` | `targetGrowth` | 2.1 | 1.5 (then tune 1.4 to 1.6) | AI-4 |
| 2 | `src/data/shifts.js` | `targetBase` | 24 | 16 | AI-4 |
| 3 | `src/data/shifts.js` or `data/voltage.js` | target of shift 4 (Overload) | see data | make it no harder than a normal shift (pass rate 19.6% vs 66.7%) | AI-4 |
| 4 | `src/data/voltage.js` | `targetMultiplier` level 3 | 1.8 | 1.4 | AI-4 |
| 5 | `src/data/voltage.js` | `targetMultiplier` level 4 | 2.4 | 1.7 | AI-4 |
| 6 | `src/data/voltage.js` | level 3 `fewerSparks` at shift 2 | shift 2 | move to shift 4 or later | AI-4 |
| 7 | `src/data/inventors.js` | Dr. Volt `startValue` | 2 | 3 (or keep `sparkCount` 3) | AI-4 |
| 8 | `src/data/shifts.js` | `rarityBands` legendary weight | 0 / 5 / 12 | 3 / 8 / 18 so `overdrive` and `prism` show up | AI-4 |
| 9 | `src/engine/parts/` (`compounder`, `echo`, `battery`, `splitter`) | growth per level | unbounded chains reach 1e183 | cap or flatten the strongest scaling | AI-3 |
| 10 | `src/engine/parts/gambler.js` | payoff | bought 1 of 130 offers | raise the upside or lower the cost | AI-3 |
| 11 | `src/data/shifts.js` | `baseShiftPayout` | 4 | 6 (shops give about 1 part now) | AI-4 |
| 12 | `src/engine/parts/` (`capacitor`, `tollgate`, `turnstile`, `reverser`) | usefulness | often no effect on the total | check each one has a clear use | AI-3 |

Do #1 and #2 first, then re-run. Target after the change: win rate 15% to 40% for the smart bot at
voltage 1, and a pass rate that falls gently by shift instead of dropping off a cliff at shift 4.

## UPDATE 3 (2026-11-11, smart bot, after the visit limit and the kit changes)

Voltage 1 (200 runs): win rate 36.0%, average shift reached 7.13, verdict OK.
Per inventor: tinkerbot 37.3%, clockmaker 37.3%, drvolt 33.3%. The three kits are now even.
Pass rate per shift: 100, 99.5, 99.0, 89.8, 97.2, 90.7, 80.8, 57.1. Shift 8 is the wall, which is right for a final shift.

Higher voltages (150 smart runs each):

| Voltage | Win rate | Weakest shift (pass rate) |
|---------|----------|---------------------------|
| 2 | 11.3% | shift 8 (28.3%) |
| 3 | 1.3% | shift 2 (64.7%) |
| 4 | 1.3% | shift 3 (38.6%) |

Part stats (300 smart runs):
- `bend`: bought 319 of 316 offers and dead on 65% of boards. The bot buys it because it is cheap and shares tags. Probably a bot artefact, but a human should check that it feels useful.
- `gambler` (3 of 149 bought) and `prism` / `overdrive` (offered 18 and 23 times, almost never owned): still not seen in play.
- `compounder` +26.3%, `triplet` +25.2%, `fuse` +29.3%: strong, but small samples (11, 8, 6 runs). `gambler` and `prism` show +62.7% from 2 and 1 winning runs: ignore.
- `overdrive` -37.3% from 1 run: ignore.

### Recommended changes (for the manager to route)

| # | File | Number | Owner |
|---|------|--------|-------|
| 1 | `src/data/voltage.js` | level 3: move `fewerSparks` off shift 2 (shift 2 passes 64.7%, every other shift is above 79%) | AI-4 |
| 2 | `src/data/voltage.js` | level 4: shift 3 passes only 38.6%. Check which twist or multiplier lands there | AI-4 |
| 3 | `src/data/voltage.js` | levels 3 and 4 win 1.3%. A human is better than the bot, but lower `targetMultiplier` a little if they feel impossible by hand | AI-4 |
| 4 | `src/data/shifts.js` | `rarityBands`: raise the legendary weight so `overdrive` and `prism` appear (18 and 23 offers in 300 runs) | AI-4 |
| 5 | `src/engine/parts/gambler.js` | give it a clearer upside (bought 3 of 149 offers) | AI-3 |
| 6 | `src/engine/parts/bend.js` | dead on 65% of boards: check it is readable and useful by hand | AI-3 |

## UPDATE 4 (2026-11-11, round 4: bonus tiles and Gentle mode are in; the 8 new parts are NOT yet)

The bot now has `--gentle`. It picks up new parts and bonus tiles on its own (they travel in `run.machine`), so rerun
everything when AI-3's new parts and AI-2's `bonusCells` engine support land. Until then bonus tiles have no effect in `simulate`.

| Check | Goal | Result | Verdict |
|-------|------|--------|---------|
| Voltage 1, smart bot, 300 runs | 30 to 50% | 51.0% (tinkerbot 58, clockmaker 52, drvolt 43) | at the top edge, OK |
| Voltage 1, normal bot, 300 runs | 10 to 25% | 12.0% (tinkerbot 19, clockmaker 6, drvolt 11) | OK |
| Gentle, smart bot, 300 runs | 60 to 80% | 67.3% (tinkerbot 70, clockmaker 72, drvolt 60) | OK |
| Voltage 2, smart, 200 runs | - | 25.5% | |
| Voltage 3, smart, 200 runs | - | 12.5% (shift 5 passes only 45.0%) | |
| Voltage 4, smart, 200 runs | - | 5.5% (shift 3 passes only 64.3%) | |

Pass rate per shift, Voltage 1 smart: 100, 99.7, 98.7, 93.9, 98.9, 95.6, 87.8, 66.5. Normal bot: 100, 99.0, 97.6, 82.4, 84.9, 69.0, 67.1, 38.3.
Clockmaker is weak for the normal bot (6% against 19% for Tinkerbot), but fine for the smart bot (52%). Dr. Volt is the lowest for the smart bot (43%).

Part stats, 500 smart runs (win rate lift when owned; small samples marked):

| Part | Offered | Bought | Lift | Note |
|------|---------|--------|------|------|
| compounder | 209 | 50 | +17.4% | owned in 42 runs: strong |
| amplifier | 375 | 133 | +15.1% | strong |
| fuse | 116 | 21 | +15.1% | strong, small sample |
| dynamo | 573 | 435 | +14.5% | strong |
| tollgate | 348 | 141 | +10.2% | |
| triplet | 125 | 25 | -15.2% | TOO WEAK? (22 runs) |
| reverser | 307 | 143 | -9.5% | weak |
| battery | 282 | 73 | -9.2% | weak |
| splitter | 330 | 114 | -9.0% | weak |
| gambler | 226 | 7 | -1.6% | almost never bought |
| prism | 37 | 1 | n/a | almost never offered |
| overdrive | 79 | 5 | +8.4% | rarely offered |
| bend | 602 | 724 | 0.0% | dead (does nothing) on 59% of boards: 3,945 of 6,717 |

Always bought by the bot (never a problem by itself, it only means cheap and useful tags): coil, ember, bend, anvil, echo, mint.

### Recommended changes (for the manager to route)

| # | File | Number | Owner |
|---|------|--------|-------|
| 1 | `src/engine/parts/triplet.js` | stronger at levels 1 and 2 (lift -15.2%) | AI-3 |
| 2 | `src/engine/parts/splitter.js`, `reverser.js`, `battery.js` | small buffs (lifts -9.0%, -9.5%, -9.2%) | AI-3 |
| 3 | `src/engine/parts/gambler.js` | a clearer upside (7 bought of 226 offers) | AI-3 |
| 4 | `src/data/shifts.js` `rarityBands` | more legendary offers (`prism` 37 offers, `overdrive` 79 offers in 500 runs) | AI-4 |
| 5 | `src/data/inventors.js` | Dr. Volt: smart bot 43% vs 58% for Tinkerbot. Small buff | AI-4 |
| 6 | `src/data/voltage.js` | level 3, shift 5 passes 45.0%; level 4, shift 3 passes 64.3%: check which twist lands there | AI-4 |
| 7 | `src/data/shifts.js` | Voltage 1 smart bot at 51.0%: leave it, it is only 1 point over the goal and a human is weaker than the smart bot | AI-4 |
| 8 | `src/engine/twists.js` | `deadCell` and `twoDeadCells` texts say "fizzle": say "lost" (see docs/WORDS.md) | AI-3 |

## UPDATE 5 (2026-11-11, round 4 finished: 31 parts, bonus tiles, Gentle mode all in)
Voltage 1, 200 runs, seed 1, `node tools/simulate.js --runs 200 --voltage 1 --seed 1 [flags]`:

| Bot | Win rate | Goal | Verdict |
|-----|----------|------|---------|
| normal | 9.5% | 10 to 25% | 0.5 point under (noise at 200 runs) |
| smart | 37.0% | 30 to 50% | OK |
| smart + Gentle | 66.5% | 60 to 80% | OK |

Part stats (400 smart runs, seed 2, overall win rate 36.8%):
- Too strong: compounder +29.9% lift (small sample, 21 owned), sideamp +18.4%, dynamo +18.1%, flywheel +16.4%.
- Too weak: fuse -20.1% (12 owned runs). Mild negatives: turnstile -4.5%, workbench -4.5%, reverser -3.8%, splitter -3.4%.
- Never bought: overdrive (32 offers), prism (20), jackpot (23). Legendary parts are offered too rarely and/or priced too high.
- Always bought: coil, ember, bend, anvil, echo, mint, spring (cheap and useful, or the bot has nothing better).
- Dead on the board: bend 67% of placements, workbench 76%, tollgate 79%, turnstile 61%, capacitor 70%. They often sit off the spark's path.

### Recommended changes (round 4 final)
| # | File | Change | Owner |
|---|------|--------|-------|
| 1 | src/data/shifts.js rarityBands | raise legendary weight so overdrive, prism, jackpot are offered and bought | AI-4 |
| 2 | src/engine/parts/fuse.js | strengthen (lift -20%) | AI-3 |
| 3 | src/engine/parts/compounder.js | check it is not too strong (+30%); watch with a bigger sample | AI-3 |
| 4 | src/engine/parts/workbench.js, tollgate.js, turnstile.js | dead on 60 to 79% of boards: make the effect easier to trigger | AI-3 |
| 5 | src/data/shifts.js | none for the normal bot: 9.5% is inside noise of the 10% goal | AI-4 |
