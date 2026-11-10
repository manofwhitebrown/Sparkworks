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
