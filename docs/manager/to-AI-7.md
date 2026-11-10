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
