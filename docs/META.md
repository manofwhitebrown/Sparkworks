# META (AI-5): what is kept between runs

Owner: AI-5. Logic is in `src/meta/*`, data in `src/data/achievements.js` and `workshop.js`.

## Spark Dust

`dust = floor((2 + 2 x shiftsCleared + (won ? 10 : 0) + 3 x (voltage - 1)) x (10 + dustBoostLevel) / 10)`

Examples: lost after clearing 2 shifts = 6. Win at Voltage 1 = 28. Each dustBoost level adds 10%.

## Workshop upgrades

| id | name | effect | levels | prices |
|----|------|--------|--------|--------|
| startCoins | Seed Money | +1 starting coin per level. | 5 | 8, 12, 18, 26, 36 |
| benchSize | Bigger Bench | +1 bench slot per level. | 3 | 15, 30, 50 |
| shopSlots | Wider Shelf | +1 offer in every shop. | 1 | 40 |
| freeRerolls | Free Reroll | +1 free shop reroll per shift. | 3 | 12, 24, 40 |
| extraFires | Spare Fuse | +1 Fire in every shift. | 1 | 120 |
| dustBoost | Dust Magnet | +10% Spark Dust per level. | 5 | 10, 16, 24, 34, 46 |

## Achievements (26)

| id | name | how | reward |
|----|------|-----|--------|
| firstLight | First Light | Clear shift 1. | 5 dust |
| steadyHands | Steady Hands | Clear shift 3. | inventor clockmaker |
| halfway | Halfway There | Clear shift 4. | part ember |
| bigSpark | Big Spark | Bank 1,000 in one Fire. | part compounder |
| firstWin | Shift Supervisor | Win a run. | inventor drvolt |
| tinkerWin | Tinkerer | Win a run with Tinkerbot. | part reverser |
| clockWin | On the Dot | Win a run with the Clockmaker. | part fuse |
| voltWin | Shocking Result | Win a run with Dr. Volt. | part triplet |
| sixthShift | Deep Shift | Reach shift 6. | 8 dust |
| trio | Triple Trouble | Have 3 parts of level 2 at once. | 10 dust |
| levelThree | Fully Tuned | Level a part to 3. | part turnstile |
| collector | Parts Hoarder | Own 8 different parts at once. | 10 dust |
| splitFamily | Split Family | Own a Splitter and a Triplet at once. | 8 dust |
| frugal | Penny Pincher | Finish a run with 20 coins left. | 8 dust |
| dailyDone | Clocked In | Finish the daily contract. | part mint |
| dailyWin | Daily Grind | Win the daily contract. | part echo |
| tenRuns | Regular | Finish 10 runs. | 10 dust |
| twentyFiveRuns | Veteran | Finish 25 runs. | 15 dust |
| fiveWins | On a Roll | Win 5 runs. | 15 dust |
| hundredK | Power Surge | Bank 100,000 in one Fire. | part flywheel |
| million | Megawatt | Bank 1,000,000 in one Fire. | 20 dust |
| mainsWin | Mains Master | Win at Voltage 2. | part rectifier |
| highWin | High Voltage Hero | Win at Voltage 3. | part overdrive |
| overloadWin | Overloaded | Win at Voltage 4. | part prism |
| allInventors | Whole Crew | Win a run with every inventor. | 25 dust |
| allVoltages | Fully Charged | Win at every voltage. | 30 dust |

Every part outside the starting 12 is unlocked by exactly one achievement (tested).

## Rules worth knowing

- `recordRunEnd(meta, run)` counts a finished run once (sets `run.recorded = true`), pays dust, checks achievements, and records the daily result when `summary.daily` is a date string.
- Starting parts count as seen, so only new unlocks show a NEW badge.
- Daily: seed from `hashString("sparkworks-daily-" + date)`, Voltage 1, uses the player's unlocked parts and Workshop bonuses. Streak counts consecutive local days.
- `repairMeta` accepts anything and never throws.

## Where the numbers live (one pass to rebalance)
- Dust payout per run: `DUST_RULES` in `src/data/workshop.js` (base, per shift cleared, win bonus, per voltage, boost % per level).
- Upgrade prices and max levels: `WORKSHOP_UPGRADES` in the same file.
- Unlock thresholds: `TARGETS` at the top of `src/data/achievements.js`; dust rewards are in each achievement's `reward`. Descriptions are built from `TARGETS`, so text and checks stay in sync.
- Nothing in `src/meta/*` or the screens holds a balance number. Values are unchanged for now: waiting for the bot baseline to improve.
