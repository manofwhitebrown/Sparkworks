# Board skins: design note (design only, no code yet)

Owner: AI-5. Status: proposal for Round 5. Nothing here is built.

## What a skin is
A skin is a small, cosmetic "paint job" for the board, bought once with Spark Dust and kept forever. It changes how light looks. It never changes the rules: same machine + same seed = same events, with any skin. Skins are never used by `simulate`, the bot, the daily seed or the share code.

## What a skin may change (only these 6 things)
| Field | Meaning | Today's value (the default "Amber" skin) |
|-------|---------|------------------------------------------|
| `spark` | main spark color and trail | `#FFC857` |
| `sparkHot` | spark core and big numbers on the board | `#FFF1C2` |
| `trace` | how idle wires look: `'plain'`, `'dashed'`, `'dotted'` | `'plain'` |
| `traceGlow` | color of the afterglow on a wire the spark just crossed | `spark` |
| `vaultGlow` | color of the light when the vault fills | `spark` |
| `tileTint` | a very light tint on the part-tile enamel (0..0.15 strength) | none |

## What a skin may NOT change
- Tag colors (add, mult, route, split, state, boost, risk, economy) and rarity colors: they carry meaning.
- Text, panels, buttons, the UI outside the board. Skins live on the board only (the Home idle board and the Shop mini board show them too).
- Anything that adds cost per frame. A skin is colors and one line style, so the `low` quality tier runs exactly as smooth as today.
- Colorblind mode and reduce motion always win. In colorblind mode the board uses the default `spark` and `vaultGlow` so shapes and labels stay readable.

## Rules for picking skin colors
- Light is the hero: every skin has a warm or clear bright core (`sparkHot`) that has strong contrast on `#141A24` (aim for at least 7:1).
- One hue family per skin plus its hot core. No rainbow skins (no new color families on screens; a skin is a recolor of the spark light only).
- `spark` must stay clearly different from every tag color on the board that sits next to it, or the player cannot follow the spark. The test list below checks this.
- A skin must still read when the player cannot see color: the spark shape and trail length do not change, only color.

## First set (5 skins, names are plain)
| id | Name | Look | Price in dust |
|----|------|------|---------------|
| `amber` | Amber | the current look (free, always owned) | 0 |
| `ember` | Ember | deeper orange spark, dotted wires | 60 |
| `frost` | Frost | pale ice-white spark, plain wires, cool vault light | 90 |
| `aurora` | Aurora | soft green-white spark, dashed wires | 120 |
| `royal` | Royal | violet-white spark, dashed wires, violet vault light | 200 |

Exact hex values are chosen by AI-6 when the skins are built, from the rules above, and recorded in `docs/RENDER.md`. Prices follow the Workshop scale (the first upgrade costs about 8 dust, the most expensive one 120), so a skin is a goal for a few runs, not a grind.

## Data shape
Skin definitions live in one data file, `src/data/skins.js` (owner AI-5), exporting `SKINS`: an array of `{ id, name, description, price, colors: { spark, sparkHot, traceGlow, vaultGlow }, trace, tileTint }`. It follows the same pattern as `data/workshop.js`: all numbers in one place.

Meta gets one new field, kept inside `v: 1` (no version bump, old saves still load):

```
skins: { owned: ['amber'], active: 'amber' }
```

- `owned` is a list of skin ids. `'amber'` is always in it.
- `active` is the id used on the board. It must be in `owned`.
- `repairMeta` fills `skins` for old saves, drops unknown ids, puts `amber` back if the list is empty, and sets `active` to `'amber'` when it is not owned. It never throws, like everything else in `repairMeta`.

## How it is stored
- In the meta object, saved by `saveMeta` as part of the normal meta JSON. No new save key, no server, nothing online.
- Never stored in a run. A run does not remember a skin, because the skin is a display choice, so changing skin mid-run is safe and replay-safe.
- "Reset all progress" (`wipeAll()`) removes skins with everything else.

## Logic (pure functions, to be built later in `src/meta/skins.js`)
- `skinPrice(meta, id)` returns the price, or `null` when already owned.
- `buySkin(meta, id)` returns `{ ok, reason }` (`'poor'`, `'owned'`, `'unknown'`), like `buyUpgrade`.
- `setActiveSkin(meta, id)` only works for owned skins.
- `activeSkin(meta)` returns the full skin object to hand to the renderer. Falls back to Amber.

## How the board receives it (needs AI-6)
`createBoardView(container, options)` already reads `THEME`. Proposal: the view gets `setSkin(skin)`. It rebuilds its sprite and glow caches once (the same moment `setQuality` already does) and then draws exactly as before. AI-1 calls `setSkin(activeSkin(getMeta()))` when a board view is made (Run, Shop, Home idle board). No per-frame cost.

## Screens
- **Workshop** gets a second tab "Skins" (same tab style as the Patent Book). Each skin is a card: a tiny static preview (a short wire, a spark dot with its glow, a small vault), name, price, and a Buy or Use button. The owned skin in use shows "In use".
- A preview before buying: tapping a locked skin card sets it on a small preview board only, never on the real one, until bought.
- Toast and `playSfx('buy')` on purchase, the same as upgrades.

## Tests to write when built
- `defaultMeta` has `skins` with only `amber`; `repairMeta` fixes garbage (unknown ids, `active` not owned, missing field) and never throws.
- `buySkin`: buys once, refuses when poor, refuses a second time, never makes dust negative.
- `setActiveSkin` refuses a skin that is not owned.
- Every skin has a unique id, a price, and all color fields as valid `#RRGGBB`.
- Contrast: `sparkHot` against `#141A24` is at least 7:1 for every skin; `spark` differs from each tag color by a minimum distance.
- Determinism: `simulate` output is identical for every skin (skins are not an input).

## Open questions for the manager
1. Should a few skins be earned by achievements (for example "Win at Voltage 3") instead of bought? Suggestion: keep all five bought for the first version, add earned ones later.
2. Does AI-6 want `tileTint`, or is the tile material enough? It can be dropped from the list without changing anything else.
3. Is the daily-contract share code allowed to show the skin name? Suggestion: no, keep the share code as it is.
