# AI-6 notes (Board renderer and juice)

## Done
- All files of the contract: theme, layout, icons (20 + default), juice math, timeline, glow, particles, static layer,
  tile sprite cache, effects, spark player, pointer input, board view, dev demo, `docs/RENDER.md`.
- Manager list (to-AI-6.md):
  1. Real log facts: child leaves at `split` time and waits as a small dot, `spawn` brings it back, first `enter` is the next
     cell, `turn` updates heading so edge fizzles leave the right side, `bank` uses the spark row. Sample logs renumbered to
     the real id order. Tests: `render-player` (real split order) and `render-realdata` (40 random real machines, with skip).
  2. Demo has "play REAL fire" and "REAL random machine" (real engine, real parts).
  3. Checked `src/ui/screens/run.js`: it uses `createBoardView` with the right API (tap, drag, play, skip, setQuality, destroy).
  4. Look: see below.
  5. Frame times at medium and low with 4x CPU throttling are in `docs/RENDER.md`.
- Medium quality now draws at DPR 1.5 (high stays at the contract cap 2): 4x throttle medium, 500-event fire went from 20% to
  5.5% slow frames.
- Valid-drop highlights are ignored on blocked cells (see AI-7 below).

## Look (screenshots of the demo page and of the real run screen, 390 px wide)
Great: the amber spark with its trail and hot core on the dark graphite board; part tiles with clear icons (readable at 32 px,
rarity also shown by border style, level by pips); number pops above the parts; the vault glowing and its total ticking up on
every bank; the idle board is calm and costs nothing.
Was cheap, fixed: the source was a tiny flat ring and the vault a flat black slot. The source is now a socket with a halo,
a hot core and a small arrow; the vault has an amber inner gradient, level ticks and a faint halo (all in the static
picture, so no runtime cost).
Still could be better (not done, judgement for the manager): empty cells are very quiet, so a board with few parts looks
sparse; the canvas has a blank band under the grid (room for the vault total); big numbers could get a slightly bigger
hero moment on the last bank of a Fire.

## Working on
- nothing open; waiting for the manager's review of the look.

## Blocked / Questions for manager
- No real cheap Android phone here: all frame times are from headless Chromium without a GPU. Someone with the debug APK
  should run the demo or a real Fire and tell me the feel.

## Changes I need from other AIs
- AI-7 (`src/ui/screens/run.js`, `drawBoard`): `view.setHighlightCells(run.machine.blocked)` passes BLOCKED cells as
  "valid drop" highlights. Please pass only the valid drop cells (or an empty list). The view now ignores blocked cells, so
  nothing breaks, but the call is misleading.
- AI-7: `meta.settings.quality` is `'auto'` by default and the run screen only calls `setQuality` for a fixed value. That is fine
  (the view starts at medium and lowers itself), but if you want the app to remember a drop, pass `onQualityDrop` to
  `createBoardView`.
