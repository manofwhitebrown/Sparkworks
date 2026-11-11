# RENDER: how the board view works (AI-6)

`createBoardView(container, options)` in `src/render/boardView.js` draws the machine on ONE canvas (Canvas 2D only),
plays event logs as an animation, and handles pointer input. No `shadowBlur`, no `ctx.filter` anywhere
(`git grep -n "shadowBlur\|ctx.filter" src/render` prints nothing).

## Files
| file | job |
|------|-----|
| `theme.js` | every color, font, timing number (mirrors contract section 10) |
| `layout.js` | square cells, half-cell margins for source and vault, `cellAtLocal`, `clampDpr` |
| `boardStatic.js` | pre-rendered picture: background, grid, trace, source, vault, blocked cells, vignette |
| `partTile.js`, `iconShapes.js`, `partIcons.js`, `partMeta.js` | part tiles (cached sprites), the 20 icons + default icon |
| `glow.js`, `particles.js` | glow sprite drawn once, stamped with `'lighter'`; fixed particle pool |
| `timeline.js` | pure math: event list to timed steps, tempo ramp |
| `juice.js` | pure math: pop sizes from `log10`, easing, shake scale (never NaN) |
| `effects.js` | small state: tile pops, popups, cell light, vault total, shake |
| `sparkPlayer.js` | plays the timeline, moves sparks, calls `onEventPlayed` once per event |
| `sparkDraw.js`, `boardDraw.js` | the draw order below |
| `input.js` | pointer events: tap, drag with ghost, `cellAtPoint` |

## Box and frame (round 3)
- The canvas is transparent. `boardStatic.js` draws a rounded dark panel with a thin `line` border and clips everything
  (grid, vignette) to it, so the corners blend into the page.
- Height of the canvas = width x (rows + FOOTER 0.45 + VPAD 0.3) / (cols + 1). Cells are `floor(width / (cols + 1))`: the board is
  limited by the WIDTH of its box, so a taller box does not make cells bigger (it only centres the board vertically). Only a
  wider box helps. Tested sizes: 284x211, 328x243, 400x300, shop mini 150 wide (cells about 25 px).
- The footer under the grid has a divider, a "VAULT" label and the running total (big, right-aligned under the vault slot,
  swells a little on every bank).
- Particles live inside the panel: they fade within 18 px of its edge and are removed outside it (no bleeding past the right
  edge). The demo page has size buttons for all this.

## Draw order (every frame that needs one)
1. the static picture (one `drawImage`)
2. part tiles from the sprite cache (selection, highlights, disabled and banned looks)
3. a very slight dim while a Fire plays (so the spark stands out)
4. `'lighter'` batch: cell light, spark trails, sparks, vault glow, particles
5. normal draw: flashes, notes, number popups, vault total, drag ghost
6. screen shake is a translate of the whole frame (off for `low` and `reduceMotion`)

An idle board is not redrawn at all (dirty flag). Valid-drop highlights are never put on blocked cells
(they cannot take a part, and a pulsing highlight would keep the idle board redrawing).

## Following the REAL event log
- `split` shows the child leaving the part at once (a small glowing dot nudged 0.3 cell in its direction); the child waits
  there. Its `spawn` (which only comes after the parent finished its whole walk) brings it back to the cell centre, and its
  first `enter` moves it to the NEXT cell.
- `turn` updates the spark's heading, so an `edge` fizzle (reported at the LAST cell inside the board) drifts out of the
  correct side.
- `bank` has no x/y: the vault is on the right edge of the spark's current row. `end` has `spark: 0`.
- Tests: `tests/render-realdata.test.js` plays 40 random machines made by the real engine and real parts.

## Quality levels
| | low | medium (default) | high |
|---|---|---|---|
| particle cap | 30 | 80 | 150 |
| particles | bank bursts only | all | all |
| trails | 3 dots | full | full |
| screen shake | off | on | on |
| max DPR | 1.25 | 1.5 | 2 |

`setQuality()` also resizes the canvas when the DPR cap changes. AUTO: if a Fire averages above 24 ms per frame over 30
frames, the view lowers itself one level and calls `options.onQualityDrop(level)`.
`reduceMotion`: no shake, no bursts, no trails, moves 1.5x faster, numbers just appear.

## Timing (speed 1)
- 130 ms per cell move, every pass of the same Fire is 10% faster (x0.9), floor 45 ms. `speed: 2` halves everything.
- value/split step 0.55 x move, turn/state/coins/disable 0.3 x move, bank pause 420 ms (scaled by the ramp), fizzle 300 ms,
  blocked 200 ms, end 350 ms. Number popups live 700 ms. `skip()` reports the remaining events in at most 250 ms.

## Measured frame times
Headless Chromium 153 (software rasteriser, NO GPU, so these are pessimistic), 390 x 900 viewport at DPR 2, Chrome DevTools
protocol CPU throttling. 60 fps = 16.7 ms. Measured with the demo page (`/dev/renderDemo.html`), a real random machine
(real engine) and the 500-event fire. Re-measured after the round 3 layout (framed panel, footer total):

| CPU | quality | real random fire | 500-event fire |
|-----|---------|------------------|----------------|
| 1x | low / medium / high | 16.7 avg, 0% slow frames | 16.7 avg, 0% slow frames |
| 4x | low | 16.7 avg, 0% frames over 20 ms | 16.7 avg, 0.4% over 20 ms |
| 4x | medium | 16.7 avg, 0.3% over 20 ms | 17.6 avg, 5.5% over 20 ms |
| 4x | high | 19.4 avg, 16.3% over 20 ms | 19.7 avg, 18.0% over 20 ms |

The layout change cost nothing measurable. `medium` draws at 1.5 DPR (before that cap, the 4x medium 500-event fire had 20% frames
over 20 ms). The profile shows the JavaScript of all render code is about 3% of the time; the rest is canvas rasterising (fill
rate), so lowering the pixel count is the lever. `skip()` on the 500-event fire reports all 500 events in about 1 s of wall time
including the tap delay. Real phones have a GPU, so expect better; still, please check on a real cheap Android phone.

## Demo page
`/dev/renderDemo.html` (Vite dev server only, not in the production build): sample fire, big fire (500 events), blocked
fire, **play REAL fire** (real engine + real parts), **REAL random machine**, skip, quality, reduce motion, fake blocked
cells, speed, and a frame-time readout.
