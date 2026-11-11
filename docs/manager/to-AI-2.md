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

---
## NEW JOB (manager): the hidden cheat menu
You are the least busy AI, so this is yours. Finish the visit-limit item above first, then build this. It helps the owner test the whole game fast (reach shift 8, try any part, see Overloads and the results screen) without playing 10 minutes per run. Plain code, many small files, same rules as always.

### Your files (new folder)
`src/cheats/gate.js`, `sha256.js`, `menu.js`, `runCheats.js`, `shopCheats.js`, `metaCheats.js`, `debugTools.js`, `docs/CHEATS.md`, `tests/cheats-*.test.js`. ONE allowed edit outside your folder: add `import { installCheats } from './cheats/gate.js'; installCheats();` to `src/main.js` (say so in your notes so AI-1 knows).

### Hidden, and behind a password
1. There is NO button anywhere. The gate: **7 quick taps (within 3 seconds) in the top-left 80 x 80 px corner of the screen** opens a small password prompt. Listen on `document` for `pointerdown` with a passive listener and NEVER block or change normal taps (normal play in that corner must be unaffected). `installCheats()` sets this up and does nothing else.
2. The prompt is a small modal with a password input. Wrong password: a short shake and the word "No."; never say what is right or close. After 3 wrong tries, lock the prompt for 30 seconds. A correct password unlocks cheats **for this page session only**; never save the unlocked state.
3. The password check: compare `sha256('sparkworks-cheat-v1:' + typedText)` (hex, lowercase) with this constant:
   `79e462e3d89797fff918de7f096d3d8684aa723b3da8733aac721ef0e6144b48`
   Write your own plain-JavaScript `sha256` (sync, about 50 lines, no libraries) in `src/cheats/sha256.js` and test it with the standard vectors (`''` -> `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`, `'abc'` -> `ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad`). **NEVER write the password itself anywhere** (code, docs, tests, notes, commits). The repo is public. The owner knows it. In tests use a fake password and a fake hash passed as a function argument.
4. Keep the bundle light: `gate.js` and `sha256.js` are tiny and static; after the correct password load the real menu with `import('./menu.js')`.
5. Styles: inject a `<style>` element from JavaScript (no `.css` import) using the CSS variables (`var(--panel)`, `var(--spark)`...) with fallbacks to the palette hex values. A full-screen dark overlay, tabs **RUN / SHOP / META / DEBUG**, big buttons (44 px), works at 360 px wide, closes with the Android Back button and `Esc`. A header line: "CHEATS: runs that use cheats earn no rewards".

### The cheats
Every action: do it, then `saveRun(run)` or `saveCurrentMeta()`, then `emit('cheat:changed', { what })`, and show a small toast text in the menu ("Done" or the reason it was refused). Get the live run with `getCurrentRun()` from `src/ui/ui.js` (AI-7 is adding it; if it does not exist yet or returns `null`, show "Open a run first").
**RUN tab** (any action here sets `run.cheated = true`)
- Coins: +10, +100, +1000, set to 0.
- Fires: refill Fires to the normal number; +1 Fire.
- Target: set `run.targetMultiplier` to 0.05 (easy, the next Fire clears it), 1 (normal), 10 (hard).
- Skip to shift N (buttons 1 to 8): set `run.phase = 'shop'`, `run.shift = N - 1`, then call `startNextShift(run)` (so twists and offers are set up properly).
- Instant WIN run / instant LOSE run: set `run.phase` to `'won'` / `'lost'`.
- Board size: columns and rows +/- 1 (min 3, max 8). Shrinking sends parts that no longer fit back to the bench. Remove blocked cells that fall outside.
- Spark count 1 to 8, start value 1 / 2 / 5 / 10.
- Clear twists (empty `blocked`, `banned`, `flags`).
- Give part: a list of ALL parts (`allPartIds()`), choose level 1/2/3, goes to the bench; plus "+1 bench slot" (add 1 to `run.bonuses.benchSize`). Apply merges afterwards (`applyMerges`).
- All owned parts to level 3. Move all parts from the board to the bench.
**SHOP tab** (also sets `run.cheated`)
- Free reroll (add `rerollPrice(run)` coins, then call `rerollOffers`).
- Set the price of all current offers to 0.
- Force offers: pick up to 4 parts; they become the current offers at their normal price.
**META tab** (sets `meta.cheatsUsed = true`)
- Spark Dust +50 / +500 / +5000.
- Unlock all parts, all inventors, max voltage for every inventor, all achievements (mark them done WITHOUT paying their rewards twice).
- Mark all parts as seen. Reset the tutorial (`tutorialDone = false`). Allow the daily contract again (`meta.daily.lastPlayed = ''`).
- **Safety net:** the first time the menu opens in a session, keep an in-memory snapshot of `meta`. A button "Undo all meta cheats this session" restores it. Also "Copy save to clipboard" and "Paste save to restore" (meta plus current run as JSON text) so the owner can back up before cheating.
**DEBUG tab**
- Show the run seed and copy it; "Copy run JSON".
- **Preview Fire:** run `simulate` on a copy of the machine with the current parts and show `total`, `banked`, `fizzled`, `coins` and the best/worst spark, WITHOUT using a Fire. (This also sets `run.cheated`.)
- Last Fire event log as text (with a copy button).
- Fire animation speed: 0.25x, 1x, 2x, 4x, instant (`emit('cheat:speed', { speed })`).
- FPS counter overlay (small, top-right, off by default; for this debug overlay only you may use your own `requestAnimationFrame`, and remove it when switched off).
- Quality override low / medium / high (set `meta.settings.quality` and call `applySettingsFromMeta()`).
- "Show the error bar" test button (throws a test error so AI-1's red error bar can be checked).

### Tests (`tests/cheats-*.test.js`)
sha256 vectors; the tap-counting logic as a PURE function (7 taps inside 3 s inside the corner opens, 6 does not, a slow 7th does not, taps outside the corner do not count); the lock-out after 3 wrong tries and its timer; every run and shop cheat on a real run made with `newRun` (use the real `startNextShift`, `applyMerges`, `rerollOffers`) leaves a valid run (`validateMachine(run.machine)` has no problems, no negative coins, no NaN) and sets `cheated`; the meta cheats on `defaultMeta()` end with a valid meta (`repairMeta` changes nothing); undo restores the snapshot.

### `docs/CHEATS.md`
What cheats exist and what they do. Do NOT write the password, the hash or the exact gesture in it.

### When you are done
Notes file: what is finished, and what you need from AI-7 (`getCurrentRun`, the `cheat:changed` and `cheat:speed` events), AI-5 (`recordRunEnd` and `recordDaily` must ignore cheated runs) and AI-4 (`targetMultiplier` in `getTarget`). I am sending those requests to them now.

---
## ROUND 4 (manager, 2026-11-11): beginner round. Read `docs/manager/BEGINNER_REVIEW.md` first (5 minutes)
Do these in order. Keep every old test green and keep `simulate` fast. All new fields are optional, so old machines still work.
1. **`ctx.x`, `ctx.y`, `ctx.cols`, `ctx.rows`** (contract 22): read-only, set for each part call. AI-3 uses them for position parts (Finisher: last column only; Starter: first column only). Tests and a line in `docs/ENGINE.md`.
2. **Path helpers for the UI** in a new file `src/engine/pathInfo.js` (pure functions, no state):
   - `pathCells(events)`: the list of `{ x, y }` cells that SOURCE sparks and their children entered, each cell once, in first-visit order.
   - `touchedParts(events)`: the list of `{ x, y }` cells where a PART acted (at least one spark entered a cell with an active part).
   AI-7 shows the path while the player builds and AI-7 dims parts that were never touched, so these must be exact. Test them against real `simulate` logs, including loops and splits.
3. **Bonus cells** (contract 23): `machine.bonusCells = [ { x, y, kind: 'add' | 'mult', amount } ]`. A spark entering the cell gets the bonus after the part there (if any) has run. Add a new event type in `eventTypes.js` (for example `bonus` with `x, y, kind, amount, before, after`) and write it in `docs/ENGINE.md`. A blocked cell stays blocked (the spark fizzles before the bonus). Tests: add bonus on an empty cell, mult bonus after a part, loop visits (the bonus applies on every entry, and the per-cell visit limit still ends loops).
4. **Stretch, only after 1 to 3 are pushed: Portal pair** for AI-3's `portal` part. Two cells with `partId: 'portal'` are partners (the first and the second in `machine.cells` order). A spark that enters one is moved to the other and keeps its direction; the next step goes out of the partner. A lone portal does nothing. It must count as one visit per portal for loop limits. Add an event so AI-6 can draw the jump. If it is too risky, tell me in your notes and skip it.
5. Tell AI-3 and AI-6 in your notes the final shape of the new events.
