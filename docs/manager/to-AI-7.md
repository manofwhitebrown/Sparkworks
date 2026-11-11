# Manager to AI-7

I see home and run screens in the repo, plus the shop and results screens. Good.

Do the things AI-8 asked for (they are all right and in the contract):
1. Call `initAudio()` on the first tap and `applySettings(meta.settings)` (from `src/audio/audio.js`) whenever settings load or change.
2. The run screen must accept `params = { run, tutorial: true }` and use that run instead of creating a new one.
3. `ui:fireDone` must carry `{ total }` (this Fire's total), so the tutorial can check that the swap gave a higher number.
4. Check every `data-tut` attribute from the contract exists: board, bench, fire, hud, offers, reroll, continue.
5. Results screen: `recordRunEnd` exactly ONCE per finished run, then `clearRun()`. Test it with a reload in the middle.
6. Use the Pages build to play a full run by hand: home, place, fire, shop, merge, finish, results, new run. Write every bug and every ugly spot in your notes. The look must be consistent and premium (see your own quality-bar checklist).
7. Note: AI-1 fixed the `.css` import problem in tests (the test no longer fails).

---
## Requests (manager): cheat menu support (contract items 16 to 20)
1. Export `getCurrentRun()` from `src/ui/ui.js`: returns the live run object the run and shop screens use, or `null`.
2. In `run.js` and `shop.js`, listen for `cheat:changed` (via `core/events.js`): re-render from the run, call `saveRun`, and if `run.phase` is `'won'` or `'lost'` go to the results screen; if it is `'shop'` go to the shop; if `'build'` go to the run screen. Remove the listener in `unmount`.
3. In `run.js`, listen for `cheat:speed` with `{ speed }` and pass it to `view.play` (`'instant'` = skip at once). Reset to 1 on app start (not saved).
4. Results screen: when `run.cheated` is true show a clear line "Cheated run: no rewards" and skip the reward animations.
5. The cheat menu is a full-screen overlay on top of your screens and uses your CSS variables. Keep `z-index` space free above your modal (use something like 9000 for the menu).

---
## ROUND 3 (manager, 2026-11-11): phone layout and polish. TOP PRIORITY, do these before anything else
I tested the Pages build in a real mobile browser at 320x568, 360x640, 375x667, 360x740, 390x844, 412x915, 430x932 (also with `largeText`). No sideways scroll and no small buttons: good. But these are real bugs on small phones. All the files are yours. Pass rule for every item: it must look right at ALL seven sizes, normal and `largeText`.

1. **Board covers the top panel (run screen).** `.boardWrap` in `screens.css` has a fixed height (width `min(100%, 40dvh*1.25)` plus `aspect-ratio`), but its parent `.boardSlot` can shrink (`flex: 1 1 auto; min-height: 0`). So the board overflows its slot and paints over the HUD. Measured overlap: 45px at 320x568, 24px at 360x640, 15px at 375x667. It hides "Fires left" and, when a part is selected, the progress bar and the "Bench" label. Fix so the board never overlaps the HUD, bench, info panel or FIRE at any size. Ideas: size the board from the room it really has (ResizeObserver or plain CSS), and on short screens (`max-height: 700px`) make the HUD smaller (put "Fires left" on the same row as the target). The HUD must never be hidden.
2. **Use the room on big phones.** At 412x915 and 430x932 the board is only about 380x282 with 90 to 135px of empty space above it. The `40dvh` cap is too small. Let the board grow to fill the free space (still square cells, still 5x4). AI-6 will make the canvas scale with whatever box you give it.
3. **Shop is overfull on small phones.** At 360x640 the "Next shift" button sits on top of the bench and cuts off the info panel. Fix: the shop content scrolls, and "Next shift" stays reachable with at least 12px (plus `--safe-bottom`) of space under it. `.stickyBottom` uses a NEGATIVE bottom offset, which pins the button flush to the screen edge; remove that. Nothing may hide under it.
4. **Shop mini board does nothing.** In `shop.js` the board gets an empty `onCellTap`, but the panel text says "Tap a part, then tap a cell to place it." That is misleading. Minimum: change the shop text to say what really happens (parts you buy go to the bench; you place them on the next shift). Better, if it is simple: make the board tappable in the shop and give it a bigger size.
5. **Shop offer cards have uneven heights.** Use equal-height cards (`grid-auto-rows: 1fr`) and keep the price at the bottom of every card (`margin-top: auto`).
6. **Home: the two "Locked" inventor cards waste space on a fresh save.** Show unlocked inventors as full cards. Show locked ones as a compact row of small tiles (still at least 44px tall, lock icon plus "Win a run to unlock"). Make sure the bottom nav keeps at least 16px under it at 360x640 (today it is about 6px) and that the four nav labels do not touch their button edges.
7. **Home: make the logo mark premium.** Today it is a plain 14px dot. Replace it with a proper glowing spark, about 48 to 64px: a bright core with a soft glow made from a radial-gradient (static) and pulsed with `transform` and `opacity` only. No `filter: blur`, no big `box-shadow` on moving things (contract section 3). Keep `html.reduceMotion` working. Light is the hero.
8. **Bug: "Continue run (shift 1)" shows up after you skip the tutorial.** The tutorial run (`run.tutorial === true`) stays in the save slot, and `home.js` shows Continue for any saved run in phase build or shop. Fix both parts: (a) Home must ignore a saved run with `tutorial: true` (no Continue button, and the main button says PLAY, not NEW RUN); (b) when `tutorial:finished` arrives (skip or last step), call `clearRun()` if the saved run is a tutorial run. Add a test. AI-8 will add an integration test for the skip path.
9. **Small text.** In `tokens.css` raise `--fs-tiny` from 11px to 12px (largeText stays at 13px or more). That fixes `.pcRarity` and `.pcDesc`. Check nothing breaks in the shop cards.

Tell me in your notes which items you finished and send a screenshot description per size for items 1 and 3.

---
## ROUND 4 (manager, 2026-11-11): teach the player. Read `docs/manager/BEGINNER_REVIEW.md` first
Finish ROUND 3 items 1, 2, 3 and 8 first, then do these in order. All text follows the plain-words rules in `BEGINNER_REVIEW.md` (kids first).
1. **Path preview** (contract 25): while building, call `simulate(machine, { recordEvents: true })`, then AI-2's `pathCells(events)`, and give the list to `view.setPreview(cells)` after every placement, move, rotate, sell. Add a small "Path" toggle button on the run screen (setting `showPath`: ON by default for the first 3 runs and always in Gentle mode). The preview shows the PATH only, never the numbers. Cap the cost: one simulate per change.
2. **After-Fire recap**: under the HUD show one short line, for example "3 sparks reached the vault: 42. 1 lost." and, when a part never got touched (AI-2's `touchedParts`), "Not touched: Coil. The spark never went there. Try the Path button." Call `view.setDim(cells)` for those parts. Clear it on the next change.
3. **How to Play screen** (new file `src/ui/screens/howto.js`, route `howto`): 6 swipe cards, each with a title, 2 short sentences and an AI-6 diagram (`createDiagram`): 1 "Sparks run to the vault", 2 "Parts change the spark", 3 "Order matters", 4 "Steer with Bend and friends: use ALL the board", 5 "Only the right edge counts. Other edges lose the spark", 6 "Buy 3 the same to level up. Beat 8 shifts to win". A "Replay tutorial" button at the end. Open it from a "?" button on Home and on the run screen (44 px, top right).
4. **Part texts everywhere** (shop cards, selected panel, Patent Book via `partCard`): show AI-3's `describe(level, rot)` and the example "2 -> 5" in a small line. For directional parts show a small arrow glyph that follows the rotation. Pass `rot` from the placed part.
5. **Shop help**: on each offer card show how many of that part the player owns when at least 1: "You have 2. Buy 1 more to level up." Show "Bench is full. Sell or place a part." when a buy fails for that reason. First time the shop opens, one tip line about Reroll and Sell (once, remembered in meta flags through `core/save.js`).
6. **Overload banner**: at the start of an Overload shift (4 and 8) show a banner for 3 seconds with the twist's name and its plain description (AI-3 wrote `description`). Make the twist chip in the HUD tappable to open the same text again.
7. **Home**: one goal line under the logo: "Clear 8 shifts to win." Explain Voltage in one short line ("Higher Voltage = harder."). Add the **Gentle mode** switch (contract 24) with the text "Easier: more Fires, smaller targets." Gentle runs show a small "Gentle" pill in the HUD.
8. **Hint button** on the run screen (small, secondary, "Hint 3" = 3 per shift): calls AI-8's `suggestPlacement(run)` and highlights the suggested bench part and cell with a pulsing ring; tapping it again places nothing, the player still decides. Emit `ui:hintUsed`.
9. **Loss and win tips** on the results screen: if `tipId` (AI-4) is present show a friendly box: `steer` "Tip: Bend and Splitter can send sparks to the side. The Path button shows where they go.", `merge` "Tip: buy 3 of the same part to level it up.", `coins` "Tip: spend your coins. Coins do not score.", `order` "Tip: try the Amplifier AFTER the Coil." Also show "You needed X. Your best Fire was Y." using `neededTotal` and `bestFireLastShift`. Never blame the player.
10. **Tiny first-use tips** (each once, remembered): after the first placement "Tip: drag a part to move it."; after the first selection of a directional part "Tip: tap Rotate to change the arrow."
11. Emit `ui:sparkLost` when the log has a fizzle by an edge (AI-6 draws the marker, AI-8 owns the sound). Test the new screens at the seven phone sizes of ROUND 3.
