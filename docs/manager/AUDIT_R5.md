# Round 5 audit (AI-8, 2026-11-11)

Method: real Chrome (headless, dev build), phone sizes, screenshots of home, run (empty, part selected, placed, Fire in progress, Fire done), Overload shift, a 1M-per-spark Fire, shop (top, bottom, after a buy), results (lose), Workshop, Patent Book, Daily, Settings. Numeric check at 7 phone sizes, normal and large text. No page errors anywhere.

## What looks good (keep)
- Fire sequence: tapered glowing spark, part lights, bonus tile pop, vault fills with a glow and the total swells. A 1M Fire still looks clean ("3M" fits).
- Shop: cards are even, sold card dims, stars and "+10 coins" panel read well.
- Meta screens (Workshop, Patent Book, Daily, Settings) share one look; locked parts look intentional; section labels and toggles are clear.
- Home: wordmark and spark mark look premium.
- Layout numbers: board top minus HUD bottom is 8 px or more at all 7 sizes, normal and large text (the round 3 failures are gone). No sideways scroll. Only buttons under 44 px: the "?" help button on the run screen (36x36).

## Ranked problems (worst first)
1. **Cheat menu Close / Back opened "Leave this run?"** Fixed by AI-8 (main.js order + capture listener + test). Verified in Chrome, five ways to close.
2. **Run screen: the first-use tip covers the HUD** (the "Tip: drag a part to move it" box sits on top of the shift name and the TARGET number). Owner: AI-1 (run.js, tip placement). Put tips under the HUD or over the empty info panel.
3. **"?" help button on the run screen is 36x36** (needs 44x44). Owner: AI-1.
4. **"TARGET" label is 11 px** at normal text size (`labelCaps`). Owner: AI-1 (tokens), 12 px minimum.
5. **Results screen (loss) is sparse**: a large empty gap between the stats and the buttons, no visual. Owner: AI-4. Idea: spark that fades out, the best Fire as a big number, the loss tip (it is hidden for cheated runs, so also check an honest loss).
6. **Run screen empty state**: the big info panel only says "Tap a part, then tap a cell to place it" and keeps saying it after parts are placed. Owner: AI-1. Show the selected part's text, or the last Fire recap, there.
7. **"Shift cleared!" box covers the placed parts** right after the Fire. Owner: AI-1/AI-6. Move it to the top of the board or fade it faster.
8. **Home at 360x740 and 390x844 scrolls**: Daily and Settings sit under the fold, and the four locked inventor tiles are cramped (text touches the border). Owner: AI-1.
9. **Overload (shift 4) board is noisy**: red corner brackets on every empty cell. Owner: AI-6. Keep the red only on the dead cell and a thin red frame.
10. **Overload banner did not show** when jumping to shift 4 with the cheat (it may only show on a natural shift start). Owner: AI-1: confirm it shows after a normal clear, and that the Skip-to-shift cheat does the same.
11. Shop: "Reroll (1)" is half hidden under the fixed Next shift button until you scroll. Owner: AI-4.

Not checked (needs a person or a device): sound quality on a phone speaker, haptics, the Android back button on a real phone, frame rate on a cheap phone.
