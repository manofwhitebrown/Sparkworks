# Manager to AI-4

Good work. Run logic, shop, merge, tests and RUN.md are in.

1. I added your new run fields (`pendingCoins`, `bestFire`, `bonuses`, `tutorial`) to the contract (section 12, item 10).
2. Free rerolls: when the free ones are used up, the paid price RESTARTS. price = `rerollStartPrice + rerollStep * (rerolls paid so far this shift)`. Apply it and update your tests.
3. Drvolt's passive replaces sparkCount and startValue: accepted (item 12).
4. Kits are uneven (Tinkerbot 42, Clockmaker 17 on shift 1). Fix it now, with the real engine: tune the three kits in `inventors.js` so the best layout of each kit scores within about 25% of the others on shift 1. You may change kit parts and coins. Tell me what you changed.
5. Balance: AI-8's bot is being fixed so it can win. When AI-8 sends a sweep table, I will approve numbers and you will apply them in `src/data/shifts.js`. Keep every tuning number in that one file so a sweep is a one-line change.
6. Update `docs/RUN.md` for the reroll rule.

---
## Small request (manager): cheat support
Contract items 16 to 20. Please make `getTarget(run)` multiply by `run.targetMultiplier` when it is a number (default 1). Add a test. Also make sure `startNextShift(run)` works when the cheat menu sets `run.phase = 'shop'` and `run.shift = N - 1` (it should simply move to shift N). Do not remove unknown extra fields from the run (`cheated`).

---
## ROUND 4 (manager, 2026-11-11): Gentle mode, bonus tiles, inventors, loss tips. Read `docs/manager/BEGINNER_REVIEW.md` first
1. **Gentle mode** (contract 24): `bonuses.gentle` makes a run easier for beginners and kids: 3 Fires per shift (+1), targets x0.7, +4 start coins. Keep the numbers in one place (`SHIFT_RULES` or a new `GENTLE_RULES`). Ask AI-8's bot to check that a smart bot wins about 60 to 80% in Gentle mode. Tests.
2. **Bonus tiles** (contract 23, engine work by AI-2): a new file `src/run/bonusCells.js` that makes `machine.bonusCells` for a shift from the shift number and the seeded rng. Rules: none on shift 1. From shift 2: one tile; from shift 5: two tiles. Put them on EMPTY cells that are NOT on the source row (so the player has to steer the spark to get them). Shifts 2 to 4: `add` +3 to +6; later: some `mult` x2. Never on a blocked cell. Same seed gives the same tiles. This is the main trick that teaches players to use the side cells.
3. **Two new inventors** in `src/data/inventors.js` (unlocks are AI-5's job): **Ms. Bounce** ("Loves steering. Starts with Bend, Bend, Spring and Side Amp.", passive: +1 shop slot) and **The Banker** ("Turns coins into power. Starts with Mint, Tollgate and Workbench.", passive: +2 coins at the start of every shift). Use the new part ids from AI-3 (wait for `spring`, `sideamp`, `workbench`). Their text must follow the plain-words rules in `BEGINNER_REVIEW.md`.
4. **Shop weights** for the new parts (AI-3 sends the ids): new common parts about as often as old commons, `finisher` / `portal` as rares, `jackpot` as legendary. Use the new twists (`closedRow`, `loneSpark`, `noMult`) in the Overload shifts.
5. **Loss tips**: `runSummary(run)` also returns `neededTotal` and `bestFireLastShift` for the shift where the run ended, and `tipId` (or `null`), chosen by simple rules, first match wins: `'steer'` if the player never owned a route part (bend, switch, spring, splitter...), `'merge'` if no part ever reached level 2, `'coins'` if the player ended with 6 or more unspent coins, `'order'` otherwise. AI-7 shows the text for each id.
6. Update `docs/RUN.md` and write answers in your notes.
