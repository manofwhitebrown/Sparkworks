# Manager to AI-6

I see your static board layer, effects state and spark player in the repo. Your notes file is out of date (it says the skeleton is missing): update `docs/notes/AI-6.md`.

1. The engine is finished. Read `docs/ENGINE.md` and contract section 12. One thing for you: a `fizzle` with reason `edge` reports the LAST cell inside the board, so draw the fizzle at that cell's edge. The `end` event has `spark: 0`.
2. Add a button "play REAL fire" to your demo page that builds a machine with real parts (use `src/engine/parts/index.js` and `simulate`) and plays the real event log, so you test with real data, not only hand-written samples.
3. Check that AI-7's run screen really uses `createBoardView` with your API and plays smoothly on the Pages build. Write the problems you see in your notes (say which AI should fix what).
4. Then the look: this is the part the owner cares about most. Take screenshots of the demo page and of the real run screen and describe in your notes what looks cheap and what looks great. Fix what is yours.
5. Report measured frame times at `medium` and `low` with 4x CPU throttling in `docs/RENDER.md`.

---
## Update (manager): three facts about the REAL event log (from AI-2, see `docs/ENGINE.md`, captured example at the end)
Your hand-written sample logs may not match these. Make the player follow the real log:
1. A child's `split` event comes at the moment the PARENT part runs (the child is shown leaving the part then), but the child's `spawn` event only comes AFTER the parent has finished its whole walk. Show the child leaving the part at `split` time and let it wait there (or ride along as a small glowing dot) until its own `enter` events start.
2. The child's first `enter` is the NEXT cell, not the cell it was born in.
3. `bank` has no `x` or `y` (the vault position is always the right edge of the spark's row: use the last cell from the spark's previous `enter`). `end` has `spark: 0`.
Also: use the "play REAL fire" button on your demo page to check all three with real logs. Fix `dev/sampleEvents.js` so it matches the real order.

---
## ROUND 3 (manager, 2026-11-11): board fit and polish (phone check)
I tested the Pages build in a real mobile browser. AI-7 fixes the layout boxes (the board was overlapping the HUD on small phones). Your part is that the board draws well in whatever box it gets:
1. **Scale with the box.** AI-7 will give the board a bigger box on tall phones (it is only about 380x282 on a 412x915 phone today). `createBoardView` must resize and keep cells square and sharp (DPR cap 2) from the real size, with no fixed sizes. Test your demo page at 284x211 (smallest), 328x243 and 400x300.
2. **Dead space and backdrop.** `FOOTER = 0.45` in `layout.js` leaves a dark strip under the grid, and the canvas shows a lighter rectangle that does not match the page background. Make it look intentional: either a rounded dark panel with a thin border that frames the board and the vault total, or a transparent canvas that blends in. Use the space under the grid for the vault total, not for nothing.
3. **Vault particles bleed past the right edge** of the board (seen at the end of a Fire). Keep them inside the canvas (clamp or fade near the edge).
4. **Shop mini board** (about 25px cells at 360 wide): confirm it draws clearly at that size and, if AI-7 turns on taps there, that `onCellTap` works with the real layout.
5. Send me the frame times again after changing the layout (medium and low, 4x throttling).
