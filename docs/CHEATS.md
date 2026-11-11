# Cheat menu (owner: AI-2)

A hidden menu for the owner, to test the whole game fast: reach shift 8, try any part, see the
Overloads and the results screen without playing a full run. There is no button for it. A hidden
gesture opens a password prompt, and only the right password loads the menu. The gesture and the
password are known to the owner only and are NOT written in this repo. The menu is unlocked for
the current page session only; it is never saved.

**Cheated runs earn nothing.** Any cheat that changes or reads a run sets `run.cheated = true`
(no Spark Dust, no achievements, no win record, no daily result, no stats; the results screen says
so). Any META cheat sets `meta.cheatsUsed = true`.

## How a cheat works
Every button does the same four steps: change the live run (or meta), save it, send
`cheat:changed` with `{ what }` so the screens refresh, and show a short message at the bottom
("Done" or the reason it was refused). With no live run the message is "Open a run first".
A refused cheat changes nothing and does not mark the run.

## RUN tab
- **Coins**: +10, +100, +1000, set to 0.
- **Fires**: refill to the normal number, or +1 (only while building).
- **Target**: Easy (x0.05, the next Fire clears it), Normal (x1), Hard (x10). Stored as `run.targetMultiplier`.
- **Skip to shift 1 to 8**: goes through the real shift start, so twists, offers and counters are set up properly. Works from any phase (it also revives a won or lost run).
- **Instant WIN / LOSE**: sets the phase, the game goes to the results screen.
- **Board size**: columns and rows -/+ (3 to 8). Parts that no longer fit go back to the bench; blocked cells outside the board are removed; the bench grows if it needs to.
- **Sparks**: spark count 1 to 8 and start value 1, 2, 5, 10, and (round 5) 100, 1K, 1M, 1T to test big numbers and the big-bank effects. These last until the next shift starts (a new shift sets them again from the inventor).
- **Clear twists**: empties `blocked`, `banned` and `flags`.
- **Parts**: give any part at level 1, 2 or 3 to the bench (merges are applied; refused when the bench is full); +1 bench slot (up to 12); all owned parts to level 3; board to bench; (round 5) **Give 3 x L1 / L2 (merge)**: gives three of the selected part so they merge into the next level at once (adds bench slots when needed), to see the merge flourish and hear the merge sound.

## SHOP tab
- **Free reroll** and **All prices 0**.
- **Force offers**: pick up to 4 parts; they become the offers at their normal price.
These only work in the shop phase.

## META tab
- Spark Dust +50 / +500 / +5000.
- Unlock all parts, all inventors, max voltage for every inventor, all achievements (marked done, rewards NOT paid, so nothing is paid twice).
- Mark all parts seen, reset the tutorial, allow the daily contract again.
- **Safety net**: the first time the menu opens in a page session it keeps a snapshot of the meta in memory. "Undo all meta cheats this session" puts it back (in place). "Copy save to clipboard" copies the meta and the current run as text; "Paste save to restore" restores them from the text box (a bad text is refused and changes nothing). If the clipboard is blocked, the text is put in the box so you can copy it by hand.

## DEBUG tab
- Show and copy the run seed; copy the run as JSON.
- **Preview Fire**: runs the engine on a COPY of the machine and shows total, banked, fizzled, coins and the best and worst spark. It uses no Fire. The real Fire uses a new seed, so parts that use random numbers can give a different result.
- **Last Fire log**: the event log of the Fire that was just played, as text with a copy button. The run screen does not send the events, so the log is rebuilt from the run's seed counter and checked against the Fire's total (it is exact). Only Fires played after the menu was unlocked are known. **Log of current board** shows a preview log instead.
- **Fire animation speed**: 0.25x, 1x, 2x, 4x, instant (sends `cheat:speed`). Back to 1x on every app start.
- **FPS counter**: a small box at the top right (off by default).
- **Render quality**: auto, low, medium, high (sets `meta.settings.quality`).
- **Show the error bar**: throws a test error so the red error bar can be checked.
- **Sounds** (round 5, AI-8): one button per sound (tap, place, rotate, buy, sell, reroll, merge, fire, bank, lost, bonus, hint, win, lose, unlock, error, overload), a "Rising scale (20 passes)" button that plays the pass melody, and Music on / off. They follow the Sound effects and Music settings. Playing sounds does not mark the run as cheated.

## Back button (fixed in round 5)
Closing the menu (Close, Esc or the Android Back button) must NOT open the run screen's "Leave this run?" box. It did, because `main.js` started the app before installing the cheat listener, so the app's Back handler ran first. `installCheats()` now runs before `startApp()` (and the listener uses the capture phase). `tests/integration-cheats-extra.test.js` fails if the order is changed back.

## Files
`src/cheats/gate.js` (hidden gesture, prompt, lock-out, Esc and Back), `sha256.js`, `menu.js` (the overlay and tabs), `tabRun.js`, `tabShop.js`, `tabMeta.js`, `tabDebug.js`, `runCheats.js`, `shopCheats.js`, `metaCheats.js`, `debugTools.js` (all the logic, no DOM), `cheatEnv.js` (save, event, message), `menuUi.js`, `menuStyles.js`. Only `gate.js` and `sha256.js` are in the main bundle; the menu loads after the right password. `src/main.js` has one added line, `installCheats()`.

## Tests
`tests/cheats-*.test.js`: sha256 vectors, tap counter, lock-out, every run, shop, meta and debug cheat on real runs (valid run afterwards, `cheated` set), undo, save export and import, and a fake-DOM test that builds every tab and clicks every button. The FPS box and the error bar need a real browser and were checked by hand in Chromium.
