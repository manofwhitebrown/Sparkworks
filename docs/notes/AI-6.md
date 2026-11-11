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

## ROUND 3 (board fit and polish) - done
1. Scale with the box: no fixed sizes; resize() reads the real box, DPR cap 2 (medium 1.5, low 1.25). Checked at 284x211,
   328x243, 400x300. The board is limited by the WIDTH of its box (cell = width / 6): a taller box cannot make cells bigger, it
   only centres the board. So the 412x915 phone stays about 380 wide unless AI-7 lets the board use more width.
2. Dead space and backdrop: transparent canvas + rounded dark panel with thin border; the footer now holds a "VAULT" label and a
   big running total (swells on bank). Added 0.3 cell of vertical padding so the grid never touches the border.
3. Vault particles: bounds = the panel; they fade near the edge and are removed outside. Test added.
4. Shop mini board (about 150 px, cells about 25 px): draws clearly (icons, pips, label). `onCellTap` works with the real layout
   (tested with a touch tap on a 284 px box, `cellAtPoint` and the tap callback agree). BUT `.miniBoard` in
   `src/ui/styles/screens.css` has `pointer-events: none`, so the canvas never receives taps: AI-7 must remove that (and give
   `onCellTap` a job) if taps in the shop are wanted.
5. Frame times re-measured (4x throttle, medium and low) in `docs/RENDER.md`: medium 0.3% / 5.5% slow frames (real fire / 500
   events), low 0% / 0.4%.

## ROUND 4 - done
(AI-5 had already added `bonusTiles.js`, `previewPath.js` and the 8 new icons in `iconShapes.js` for me; I built on them.)
1. `view.setPreview(cells)` / `setPreview(null)`: thin amber path with an arrow per step, own offscreen picture, hidden while a Fire plays.
2. `view.setDim(cells)` / `setDim(null)`: dim parts with a small "?".
3. Lost spark marker: red "x" at the edge for a `fizzle` with reason `edge`. I only draw (AI-7 emits `ui:sparkLost`).
4. Bonus tiles: floor plates with labels (`+3` / `x2`), corner badge when a part sits on them; `bonus` event plays a flash and a number pop.
5. Icons for the 8 new parts: done by AI-5 (checked in `tests/render-icons.test.js`). Portal is included in that set if AI-3 registered it.
6. `createDiagram(container, machineLike, events, options)` in `src/render/diagram.js` + 3 live diagrams on the demo page.
7. `docs/RENDER.md` updated with frame times (4x throttle, medium 0.3% / 1.0% slow frames, low 0.0% / 0.2%).
New view method `resetEffects()`. Tests: `tests/render-round4.test.js`.

## ROUND 5 - done (brief: docs/manager/ROUND5_AESTHETICS.md)
1. Tapered spark trail, white-hot core, afterglow. 2. Tag-colored value pops. 3. Conductor wires, energy pulses along the wire the
spark crossed. 4. Vault fills with light; hero bank slow-down and stronger shake (off with reduceMotion, off on low).
5. `view.playMerge(x, y, level, opts)` for `ui:merged`. 6. Tile material, tag plate shapes (icon family), legendary shimmer.
7. `fireScale.js` is my own small stand-in because `src/engine/fireStats.js` is not pushed yet. Tests: `tests/render-round5.test.js`.
Details and frame times: `docs/RENDER.md` (Round 5).

## Working on
- waiting for AI-2's `fireStats` (swap the math in `fireScale.js`) and AI-3's `docs/ART_BRIEF_PARTS.md` (per-part motion cues).

## Blocked / Questions for manager
- No real cheap Android phone here: all frame times are from headless Chromium without a GPU. Someone with the debug APK
  should run the demo or a real Fire and tell me the feel.

## Questions for manager (round 4)
- AI-2's `bonus` event is not in `eventTypes.js` / `simulate.js` / `ENGINE.md` yet. The player accepts `{ type: 'bonus', x, y, label? | kind+amount, before?, after? }`. If AI-2 uses other field names, tell me and I change one function (`showBonus` in `sparkPlayer.js`).
- AI-7: `createDiagram` needs a container with a width; its height follows the board's aspect. `destroy()` it in `unmount()`.

## Changes I need from other AIs (round 5)
- AI-1: on `ui:merged`, call `view.playMerge(x, y, newLevel)` (x, y of the merged part on the board). The event today carries only
  `{ partId }`; please add `x`, `y`, `level` to it, or tell me where the merge cell is known. Also call `view.setReduceMotion(flag)`
  from the settings so the legendary shimmer respects it.
- AI-1/AI-4: offer cards can reuse the new tile look through `drawPartTile` (exported from `src/render/partTile.js`).

## Changes I need from other AIs (older)
- AI-7 (round 3): `.boardWrap` is `aspect-ratio: 5 / 4` but the board's natural ratio is 6 : 4.75 (width : height). The view centres itself
  vertically in a taller box, so it looks fine, but a box of `aspect-ratio: 6 / 4.75` wastes no space. `.miniBoard` has
  `pointer-events: none` (see item 4 above).
- AI-7 (`src/ui/screens/run.js`, `drawBoard`): `view.setHighlightCells(run.machine.blocked)` passes BLOCKED cells as
  "valid drop" highlights. Please pass only the valid drop cells (or an empty list). The view now ignores blocked cells, so
  nothing breaks, but the call is misleading.
- AI-7: `meta.settings.quality` is `'auto'` by default and the run screen only calls `setQuality` for a fixed value. That is fine
  (the view starts at medium and lowers itself), but if you want the app to remember a drop, pass `onQualityDrop` to
  `createBoardView`.
