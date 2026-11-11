# Notes: AI-1 (Foundation and DevOps)

## Done
- **Skeleton (Stage 0)** pushed first: package.json, vite config, index.html, .gitignore, a stub for every file in contract
  section 8, docs/CONTRACT.md (token replaced by a placeholder), README.md. Where AI-2/3/4/6 had already pushed real files,
  their versions were kept.
- **Core (Part B)**: events, rng (mulberry32 + FNV-1a hashString), format, loop, save, with tests (`tests/core-*.test.js`).
- **Platform**: notifications (daily 10:00 reminder, quiet hours, nothing in a browser), haptics.
- **main.js** (50 lines): loads meta, starts the one loop, red error bar, save hooks, calls `startApp()`.
- **docs/ARCHITECTURE.md**, **docs/ANDROID.md**.
- **CI/CD (Part C)**:
  - `ci.yml`: secret scan, `npm ci`, `npm test`, `npm run build`. GREEN.
  - `pages.yml`: deploy to GitHub Pages on every push to main. Deploy workflow succeeded. Site: https://manofwhitebrown.github.io/Sparkworks/
  - `android.yml`: debug APK on every push to main, artifact `sparkworks-debug-apk` (about 4.3 MB). BUILT AND UPLOADED.
    Signed release APK on a tag like `v0.1.0` (needs the 4 ANDROID_* secrets, see docs/ANDROID.md).
  - Capacitor Android project committed (`com.sparkworks.game`, portrait only, debug build installs next to release),
    amber-spark icon and splash made by `assets/make_icons.py`.
- **Exit test**: `npm ci`, `npm test` (273 pass), `npm run build`, `npm run dev` all fine on the latest main. CI green.

## Working on
- Integration helper (build doctor): watching CI after each push. Nothing broken right now.

## Latest check (2026-11-11, on main at f6e9857)
- Clean `npm ci`, `npm test` (299 of 299 pass), `npm run build` (JS about 47 KB gzipped): all fine.
- GitHub Actions on the latest pushes (ebd32de and d29babc): CI, Pages deploy and Android debug APK are ALL green.
  Pages: https://manofwhitebrown.github.io/Sparkworks/ (also in README). APK artifact: `sparkworks-debug-apk`.
- Secret scan (real token shape) finds nothing in the repo. CONTRACT.md has the placeholder, not the token.
- README folder map now lists `src/cheats/` (AI-2) and `docs/manager/`.
- Manager items 1 to 5 in `docs/manager/to-AI-1.md`: all done. Amendment 15 (secret scan shape) is what CI uses. Section 12 of
  CONTRACT.md is untouched.
- FYI, no action needed: `npm run build` prints a Vite warning that `src/ui/ui.js` is imported both statically (main.js, screens)
  and dynamically (`src/tutorial/tutorial.js`). It is harmless (the dynamic import just does not make a separate chunk). AI-8 may
  switch tutorial.js to a normal import if they want a quiet build. I did not touch their file.
- FYI for the manager: `src/main.js` does not yet call `installCheats()` (to-AI-2 allows AI-2 ONE line there). When AI-2 adds it,
  I will re-run the exit test and report here.

## Round 4 (2026-11-11)
1. README folder map: added `docs/WORDS.md` (AI-8, not pushed yet, so the link is dead until they push) and
   `docs/manager/BEGINNER_REVIEW.md`. Noted that the Hint helper is `src/tutorial/suggest.js` (there is no `src/hints`).
2. Bundle size (main at 3f77760): all JS + CSS + HTML together = **64.8 KB gzipped** (main chunk 52.7 KB, cheat menu chunk 7.6 KB,
   Capacitor web chunks about 2 KB). Limit is 400 KB. Tests: 376 of 376 pass, build OK, no new dependencies.
   I will add a line here after each big push of the other AIs.
3. CI test discovery: `npm test` runs `tests/*.test.js`, so every new `tests/*.test.js` file is picked up with no change.
   Today 52 test files run. `tests/integration-plain-text.test.js` does not exist yet (AI-8 has not pushed it); it will run
   as soon as it lands. Reminder for AI-8: the file name must end in `.test.js` and sit directly in `tests/` (not in a subfolder).
4. `installCheats()` is now in `src/main.js` (AI-2's one allowed line). Exit test re-run after it: all green.

## Round 4: covering AI-7 (owner asked), second part (2026-11-11)
Earlier pushes did AI-7 items 4, 5, 6, 7. This push does the rest of the list in `docs/manager/to-AI-7.md` ROUND 4:
- **Item 1, Path preview**: a `Path: on/off` button beside FIRE. Default ON for the first 3 runs and always in Gentle mode
  (choice remembered in the tip flags as `showPath`). One `simulate` per change (cached by `machineKey`). It calls
  `view.setPreview(cells)` ONLY IF the view has it (see "Needs from AI-6" below).
- **Item 2, recap line** under the HUD: "3 sparks reached the vault: 42. 1 lost." plus "Not touched: Coil. The spark never went there.
  Try the Path button." Cleared on the next change. Calls `view.setDim(cells)` only if the view has it.
- **Item 3, How to Play** (`src/ui/screens/howto.js`, route `howto`, cards in `src/ui/howtoCards.js`): 6 swipe cards, "?" button on Home
  and in the run HUD, "Replay tutorial" (new `replayTutorial()` in `ui.js`), Back returns to where you came from. The pictures are
  small token rows made in CSS (AI-6's `createDiagram` does not exist yet).
- **Item 8, Hint button** ("Hint 3", 3 per shift, per run+shift): uses AI-8's `suggestPlacement`, selects the bench part and glows
  ONE cell; the player still decides. Emits `ui:hintUsed`; plays the `hint` sound.
- **Item 9, loss tips** on the results screen ("You needed X. Your best Fire was Y." + the tip). Not shown for cheated runs.
- **Item 10, first-use tips** (once each): drag tip after the first placement, rotate tip when a directional part is first selected.
- **Item 11**: emits `ui:sparkLost` `{ x, y, value }` for every spark lost by an edge.
- The scripted tutorial run hides Path and Hint and shows no tips.
- Tests: `tests/ui-runhelp.test.js` (8 new). Whole suite 471 of 471, build OK (JS about 61 KB gzipped).
- Checked in headless Chromium at 360x740 and 320x568: Home "?" -> How to Play (6 cards, counter follows the swipe) -> Back -> PLAY ->
  Hint (glowing cell, toast, "Hint 2") -> FIRE -> recap line. Replay tutorial works and skipping it leaves no Continue button.
  No console errors.

### Needs from AI-6 (not mine, not edited)
- `view.setPreview(cells)`: draw the path line (the screen already calls it when it exists).
- `view.setDim(cells)`: dim parts the spark never touched (same).
- `createDiagram` for the How to Play cards (today they use token rows; easy to swap in `howto.js`).
- A marker for `ui:sparkLost` (the event is emitted; AI-8 owns the sound).
### Note for AI-2
- I did not wait for `pathCells` / `touchedParts`: `sourcePathCells` and `untouchedParts` in `src/ui/teach.js` do the same job.

## Blocked / Questions for manager
1. **Secret scan shape.** The contract says CI should fail if `git grep -i` finds the token prefix. docs/CONTRACT.md itself
   contains that prefix (it is contract text), so a bare search always fails. CI scans for the real token SHAPE instead
   (prefix + 20 or more token characters). Please confirm this is fine. Note: for the same reason, the per-push check
   `git diff --cached | grep -i <prefix>` will only print something if someone touches CONTRACT.md.
2. **`core:flush` event.** The brief says main.js saves on page hide. But main.js does not own the live meta/run (the screens do), and
   saving its own older copy could erase newer progress. So main.js emits `core:flush` on `visibilitychange` (hidden) and
   `pagehide`. AI-7 (and whoever holds live run/meta state) should call `saveMeta` / `saveRun` when they hear it:
   `on('core:flush', () => { saveMeta(meta); saveRun(run); })`.
3. **Loop callbacks.** `startLoop(cb)` accepts several different callbacks (still ONE requestAnimationFrame); the same callback
   twice is ignored; `stopLoop()` stops everything. main.js also emits `core:frame` (with `dt`) so anyone can use
   `on('core:frame', fn)` instead.
4. **Pages via API.** I tried to turn on Pages from the API: the token is not allowed to (fine, it was already on).

## Changes I need from other AIs
- None right now.

## Things I fixed outside my files (tell the owners)
- **CI was red** because `src/ui/ui.js` (AI-7) imports `.css` files and a test (AI-8's tutorial test) reached it through
  `tutorial.js`; Node cannot import `.css`. I did NOT touch their files. Instead `npm test` now runs with a tiny loader
  (`tests/core-css-hooks.mjs`) that treats `.css` imports as empty modules, so any test may import UI code. AI-8 also made
  the tutorial import lazy, which is fine too.

## One-time setup for the owner
- Pages: Settings > Pages > Source = "GitHub Actions" (already done, deploys work).
- Release signing (only when you want a signed APK): add the 4 `ANDROID_*` secrets, see docs/ANDROID.md, then `git tag v0.1.0 && git push origin v0.1.0`.
- Rotate the GitHub token when the build phase is over (it was shared in a hand-off file).
