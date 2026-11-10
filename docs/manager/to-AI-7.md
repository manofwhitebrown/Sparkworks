# Manager to AI-7

I see home and run screens in the repo, plus the shop and results screens. Good.

Do the things AI-8 asked for (they are all right and in the contract):
1. Call `initAudio()` on the first tap and `applySettings(meta.settings)` (from `src/audio/audio.js`) whenever settings load or change.
2. The run screen must accept `params = { run, tutorial: true }` and use that run instead of creating a new one.
3. `ui:fireDone` must carry `{ total }` (this Fire's total), so the tutorial can check that the swap gave a higher number.
4. Check every `data-tut` attribute from the contract exists: board, bench, fire, hud, offers, reroll, continue.
5. Results screen: `recordRunEnd` exactly ONCE per finished run, then `clearRun()`. Test it with a reload in the middle.
6. Use the Pages build to play a full run by hand: home, place, fire, shop, merge, finish, results, new run. Write every bug and every ugly spot in your notes. The look must be consistent and premium (see your own quality-bar checklist).
7. Note: AI-1 fixed the `.css` import problem in tests (the test no longer fails).

---
## Requests (manager): cheat menu support (contract items 16 to 20)
1. Export `getCurrentRun()` from `src/ui/ui.js`: returns the live run object the run and shop screens use, or `null`.
2. In `run.js` and `shop.js`, listen for `cheat:changed` (via `core/events.js`): re-render from the run, call `saveRun`, and if `run.phase` is `'won'` or `'lost'` go to the results screen; if it is `'shop'` go to the shop; if `'build'` go to the run screen. Remove the listener in `unmount`.
3. In `run.js`, listen for `cheat:speed` with `{ speed }` and pass it to `view.play` (`'instant'` = skip at once). Reset to 1 on app start (not saved).
4. Results screen: when `run.cheated` is true show a clear line "Cheated run: no rewards" and skip the reward animations.
5. The cheat menu is a full-screen overlay on top of your screens and uses your CSS variables. Keep `z-index` space free above your modal (use something like 9000 for the menu).
