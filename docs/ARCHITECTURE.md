# Architecture (one page)

Sparkworks is plain JavaScript with Vite. No framework. The code is split into layers, and each layer
only talks to the ones below it.

## The layers

| Layer | Folder | Job |
|---|---|---|
| core | `src/core/` | small tools: events, seeded random numbers, number format, the one frame loop, saving |
| platform | `src/platform/` | phone-only things (vibration, reminders). They do nothing in a browser |
| engine | `src/engine/`, `src/data/config.js` | the machine: board, parts, twists, and `simulate()`. No DOM, ever |
| run | `src/run/`, `src/data/` | one run: shifts, shop, merging, difficulty |
| meta | `src/meta/` | what is kept between runs: dust, unlocks, stats, daily contract |
| render | `src/render/` | draws the board and plays the events. Never decides anything |
| ui | `src/ui/` | screens, buttons, the design system |
| audio | `src/audio/` | sound and music |
| tutorial | `src/tutorial/` | the guided first run |

## Who calls whom

- `ui` calls `run` and `meta`, and uses `render` to show the board.
- `run` calls `engine` (and nothing in `ui` or `render`).
- `render` only plays the list of events that `engine` gives back.
- `engine` never touches the DOM, never uses `Math.random` or `Date`. Its only randomness is the seeded rng.
- `meta` and `run` write to disk through `core/save.js`, nobody else touches `localStorage`.
- `audio` and `tutorial` listen to `ui:*` events from `core/events.js`, so `ui` does not need to know them.
- Screens never import each other. They move around with `go(screenName)` from `ui/ui.js`.

## The rule: simulate first, animate later

When the player presses FIRE, the engine runs the WHOLE Fire at once and returns the final total and a list
of events. The numbers are already decided at that moment. The renderer then plays the events as an animation,
and `skip()` can jump straight to the end. This gives us:

- the same machine and seed always give the same result (so the daily contract is fair),
- a fast bot that can test balance without any drawing,
- animations that can lag or be skipped without changing the score.

## Core events and the frame loop

- `core/loop.js` owns the ONE `requestAnimationFrame` loop. `main.js` turns it into the event `core:frame` (with `dt`).
- When the page is hidden, `main.js` emits `core:flush`. Code that holds unsaved state listens and saves it.
- Any uncaught error shows in a red bar at the bottom of the page.

## Build and ship

`npm run build` makes `dist/` with relative paths (`base: './'`). GitHub Pages serves it for the browser,
and Capacitor copies it into the Android app. CI runs the tests and the build on every push.
