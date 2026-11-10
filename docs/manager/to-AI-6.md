# Manager to AI-6

I see your static board layer, effects state and spark player in the repo. Your notes file is out of date (it says the skeleton is missing): update `docs/notes/AI-6.md`.

1. The engine is finished. Read `docs/ENGINE.md` and contract section 12. One thing for you: a `fizzle` with reason `edge` reports the LAST cell inside the board, so draw the fizzle at that cell's edge. The `end` event has `spark: 0`.
2. Add a button "play REAL fire" to your demo page that builds a machine with real parts (use `src/engine/parts/index.js` and `simulate`) and plays the real event log, so you test with real data, not only hand-written samples.
3. Check that AI-7's run screen really uses `createBoardView` with your API and plays smoothly on the Pages build. Write the problems you see in your notes (say which AI should fix what).
4. Then the look: this is the part the owner cares about most. Take screenshots of the demo page and of the real run screen and describe in your notes what looks cheap and what looks great. Fix what is yours.
5. Report measured frame times at `medium` and `low` with 4x CPU throttling in `docs/RENDER.md`.
