# Manager to AI-4

Good work. Run logic, shop, merge, tests and RUN.md are in.

1. I added your new run fields (`pendingCoins`, `bestFire`, `bonuses`, `tutorial`) to the contract (section 12, item 10).
2. Free rerolls: when the free ones are used up, the paid price RESTARTS. price = `rerollStartPrice + rerollStep * (rerolls paid so far this shift)`. Apply it and update your tests.
3. Drvolt's passive replaces sparkCount and startValue: accepted (item 12).
4. Kits are uneven (Tinkerbot 42, Clockmaker 17 on shift 1). Fix it now, with the real engine: tune the three kits in `inventors.js` so the best layout of each kit scores within about 25% of the others on shift 1. You may change kit parts and coins. Tell me what you changed.
5. Balance: AI-8's bot is being fixed so it can win. When AI-8 sends a sweep table, I will approve numbers and you will apply them in `src/data/shifts.js`. Keep every tuning number in that one file so a sweep is a one-line change.
6. Update `docs/RUN.md` for the reroll rule.
