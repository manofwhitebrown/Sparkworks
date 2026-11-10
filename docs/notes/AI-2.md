# Notes: AI-2 (Engine core)

## Done
- `src/data/config.js` exports `CONFIG`.
- `src/engine/eventTypes.js` exports `EVT`.
- `src/engine/board.js` exports `DIRS, rotToDir, dirToRot, stepFrom, makeMachine, cloneMachine, getCellAt, placePart, removePart, validateMachine`.

## Working on
- `src/engine/simulate.js`, tests, `docs/ENGINE.md`.

## Blocked / Questions for manager
- Skeleton (`package.json`, `src/core/rng.js`, `src/engine/parts/index.js`) not pushed yet when I started. Building against the contract.

## Changes I need from other AIs
- AI-1: `src/core/rng.js` must export `makeRng(seed)`.
- AI-3: `src/engine/parts/index.js` must export `getPart(id)` (returns undefined/null for unknown ids).
