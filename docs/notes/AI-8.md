# Notes: AI-8 (audio, tutorial, bot, QA)

## Done
- src/audio: audio.js (context, gains, mute, node budget), voices.js (tone + click builders), scale.js (shared pentatonic), sfx.js (all 16 sounds + playPass), music.js (ambient bed).
- tests/integration-audio.test.js (no WebAudio, and fake WebAudio).
- src/tutorial: tutorialRun.js (fixed run + lesson machines), steps.js, overlay.js, tutorial.js, with tests/integration-tutorial.test.js. Lesson numbers: amp-after-coil = 8 per spark, amp-before = 5 per spark.

## Working on
- Re-running the balance report after AI-4 / AI-3 change numbers; keeping docs/QA.md up to date as screens appear; tutorial check on a real device once AI-7's run screen is in.

(older working note below)
- Bot tools (tools/*), integration tests, docs/QA.md, docs/BALANCE.md.

## Blocked / Questions for manager
- None yet.

## Changes I need from other AIs
- AI-7: call initAudio() on the first tap, and call applySettings(meta.settings) from src/audio/audio.js whenever settings load or change (it makes sound/music toggles work).
- AI-7: the run screen must accept params { run, tutorial: true } and use that run instead of a new one. Emit ui:fireDone with { total } (this Fire's total) so the tutorial can check the swap gave a higher number. Put data-tut attributes from the contract on the elements.
- AI-4: tutorialRun adds run.tutorial = true and sets firesLeft = 3; please keep those fields when saving/loading and do not reset them.
- AI-4: the bot assumes run functions MUTATE the run in place (it reads run.phase, run.coins, run.bench, run.machine.cells, run.offers, run.lastFire.total after each call). It sells with sellPart(run, { zone: 'bench', index }): tell me the real shape of `where` and I will change one function (tools/lib/shopBot.js sellWeakest). It detects a failed buy by run.coins not changing.
- AI-1: tests/core-platform.test.js fails here only because @capacitor/core is not installed in my checkout (ERR_MODULE_NOT_FOUND). Probably fine after npm install; just FYI.

## Top balance changes I recommend (details and numbers in docs/BALANCE.md)
1. AI-4 src/data/shifts.js targetGrowth 2.1 -> 1.5 (bot win rate 0% -> 16.7% with base 16).
2. AI-4 src/data/shifts.js targetBase 24 -> 16.
3. AI-4 shift 4 Overload is the wall (19.6% pass vs 66.7% at shift 3): make its target no harder than a normal shift.
4. AI-4 voltage.js level 3 targetMultiplier 1.8 -> 1.4.
5. AI-4 voltage.js level 4 targetMultiplier 2.4 -> 1.7 (shift 1 only passes 73%).
6. AI-4 voltage.js level 3: move fewerSparks off shift 2 (22.5% pass).
7. AI-4 inventors.js Dr. Volt startValue 2 -> 3 (he wins about 1/4 as often as the others).
8. AI-4 shifts.js rarityBands: raise legendary weights (overdrive and prism are never bought).
9. AI-3 cap runaway scaling in compounder / echo / battery / splitter chains (Fires up to 3.76e183 seen).
10. AI-3 gambler (bought 1 of 130 offers) and capacitor / tollgate / turnstile / reverser (often no effect): check they have a clear use.
Note: the bot is weaker than a human; use the comparisons, not the absolute win rates.

## Update (tutorial wiring, after reading AI-7's ui.js)
- startTutorial no longer navigates: ui.js already saves tutorialRun() and opens the run screen. The overlay now attaches to document.body (fixed), because showScreen clears #app. It retries finding a target for about 3 seconds (the run screen is drawn after startTutorial is called). It records 'done' through ui.js getMeta/saveCurrentMeta so a later settings save cannot undo it.
- ui:fireDone has no total, so the tutorial reads lastFire.total from the saved run. AI-7: adding { total } to the ui:fireDone event is still welcome (the tutorial uses it first).
- Balance now OK at voltage 1 (37.3%, smart bot). Voltages 3 and 4 are about 0.7%: see the UPDATE section of docs/BALANCE.md.
- Not yet done: watching the tutorial in a real browser and an Android build, and hearing the sounds. I cannot do that from here: someone with a device should follow docs/QA.md sections 1 and 2.
- Part stats (600 smart runs) are in docs/BALANCE.md: fuse looks strong (+26.7%, small sample), gambler is almost never bought (5 of 264), overdrive and prism are almost never offered. Tutorial now gets total straight from ui:fireDone (AI-7 added it); the saved-run fallback stays as a safety net.

## Update (2026-11-11)
- Build warning removed: tutorial.js no longer imports ui.js. When the tutorial ends or is skipped it emits `tutorial:finished` (core/events.js). Test added. 300/300 tests, build clean.
- Balance rerun: voltage 1 smart bot 36.0%, OK. Voltages 2/3/4: 11.3% / 1.3% / 1.3%. See "UPDATE 3" in docs/BALANCE.md.
- sellPart shape `{ kind: 'bench', index }` is what the bot uses (tools/lib/shopBot.js).

## Changes I need from other AIs (new)
- AI-7 (REQUIRED, small): in src/ui/ui.js startApp, add `on('tutorial:finished', function () { markTutorialDone(meta); saveCurrentMeta(); showScreen('home'); stopTutorial(); });` (or go('home')). Until this is added the tutorial overlay closes at the end or on Skip but the app stays on the run screen and tutorialDone is not saved, so the tutorial shows again on the next launch. This replaces the lazy import I removed.
- AI-4: voltage 3 shift 2 (64.7%) and voltage 4 shift 3 (38.6%) are the walls: see UPDATE 3.

## Round 3 (2026-11-11)
Done:
- tests/integration-tutorial-skip.test.js: skip and last step each emit `tutorial:finished` exactly once; the saved tutorial run has `tutorial: true` and is not continuable. 
- New helper `isContinuableRun(run)` (exported from src/tutorial/tutorial.js). Returns false for a null run, a tutorial run, or a phase other than build/shop.
- docs/QA.md: section 13 (phone layout checklist, 7 sizes, normal and largeText) and section 14 (tutorial skip and continue).

Baseline phone check BEFORE the round-3 fixes (headless Chrome, built app, tutorial skipped, board top minus HUD bottom in px, must be 0 or more):

| Size | normal | largeText | board size |
|------|--------|-----------|------------|
| 320x568 | -45 FAIL | -52 FAIL | 284x227 |
| 360x640 | -24 FAIL | -31 FAIL | 320x256 |
| 375x667 | -15 FAIL | -22 FAIL | 334x267 |
| 360x740 | 23 | 16 | 328x262 |
| 390x844 | 63 | 56 | 358x286 |
| 412x915 | 90 | 83 | 380x304 |
| 430x932 | 91 | 84 | 398x318 |

- No sideways scroll and no button under 44x44 on home, Workshop, Patent Book, Daily, Settings and the run screen at any size.
- Text under 12px: Patent Book at normal text size (11px: rarity label and unlock hints). Gone with largeText.
- Big phones: the board only reaches 380x304 on 412x915 and 398x318 on 430x932 (gap above it grows to 90 px).
- Not measured yet: shop, results, and the exact "Next shift" overlap. The headless script has no way to reach the shop yet (needs a won Fire); I will do it after AI-7 and AI-6 push their fixes, with the cheat menu or by playing the bot's moves.
- The script lives outside the repo (scratchpad, uses the Playwright already installed outside the project, no new dependency).

## Changes I need from other AIs (round 3)
- AI-7: Home must use `isContinuableRun(loadRun())` from `src/tutorial/tutorial.js` (or the same rule: not `run.tutorial`, phase build or shop) before showing "Continue run". Also add the `tutorial:finished` listener in ui.js (see above): mark tutorialDone, save meta, go home. Until then, Skip leaves the player on the tutorial run screen and meta is never saved (my headless test needed a seeded meta to get past it).
- AI-7 / AI-6: board overlaps the HUD at 320x568, 360x640 and 375x667 (table above).
- AI-7 / AI-5: Patent Book text is 11px at normal size.

## Round 4 (in progress)
Done so far:
- src/tutorial/suggest.js `suggestPlacement(run, deps)` + tests/integration-suggest.test.js (null on empty bench, under 20 ms).
- Tutorial v2: 11 steps. New steering lesson (Bend down, Coil below, Bend right = 12 per Fire, all three sparks reach the vault) and an "oops" text when the detour Fire makes 0 (spark lost off the bottom). Old bug fixed: with the retuned target 16 the first two Fires (12 + 15) already cleared the shift, so the "order matters" lesson was skipped. The tutorial run now has 10 Fires and `run.targetMultiplier` so the target is 84 (12 + 15 + 24 + 12 = 63, two more detour Fires clear it).
- The steering step swaps the bench to Bend, Bend, Coil by changing the live run object and emitting `cheat:changed` (run.js already redraws and saves on it).

Changes I need from other AIs (round 4):
- AI-7: the tutorial's "oops" step relies on `ui:fireDone` carrying `{ total }` (it does). Path preview should be ON during the tutorial run. A `run:changed` event name would be cleaner than reusing `cheat:changed`; tell me if you add it and I will switch (one line in src/tutorial/tutorialRun.js).

Round 4, second push:
- docs/WORDS.md written (the word list and the never-say list).
- tests/integration-plain-text.test.js: every part text (levels 1-3, all rotations), Overload text and tutorial text. 138 texts checked: only 2 break the rules. Both are AI-3's in src/engine/twists.js: `deadCell` and `twoDeadCells` say "fizzle" (say "lost"). They are in a KNOWN list at the top of the test so the suite stays green; AI-3: fix the text and delete the two KNOWN lines.
- Sounds: `lost` (soft sigh; `fizzle` now plays the same sound), `bonus` (pop), `hint` (chime). AI-7: call `playSfx('lost')` on `ui:sparkLost`, `playSfx('bonus')` when a bonus tile event is shown, `playSfx('hint')` when Hint is used. Sfx names list in the contract needs `lost, bonus, hint` added (manager).
- Bot: `--gentle` flag; new verdicts for normal bot (10 to 25%) and Gentle smart (60 to 80%). Results in docs/BALANCE.md UPDATE 4: Voltage 1 smart 51.0%, normal 12.0%, Gentle smart 67.3%. All three are inside their goals (smart is 1 point over). The bot picks up new parts and bonus tiles by itself; I will rerun when AI-3's 8 new parts and AI-2's bonusCells engine support are pushed (they are NOT in the repo yet).
- Part stats for AI-3 (500 smart runs): triplet -15.2%, reverser -9.5%, battery -9.2%, splitter -9.0%; compounder +17.4%, amplifier +15.1%, fuse +15.1%, dynamo +14.5%; gambler 7 bought of 226 offers; prism 37 offers in 500 runs. bend does nothing on 59% of boards.
- docs/QA.md section 15: round 4 screens and tutorial v2 checklist.

Still to do in round 4: rerun balance and partStats after the new parts and bonus-tile engine land; headless phone-size check after AI-7 and AI-6 finish round 4.

Top balance changes I recommend now: see "Recommended changes" in docs/BALANCE.md UPDATE 4 (8 rows).

## Round 4 final (2026-11-11)
- Rerun with the 8 new parts, bonus tiles and Gentle mode: normal 9.5%, smart 37.0%, smart Gentle 66.5% (docs/BALANCE.md UPDATE 5). 463/463 tests pass.
- For AI-3: fuse -20.1% lift (too weak), compounder +29.9%, sideamp +18.4%; workbench, tollgate, turnstile dead on 60 to 79% of boards. overdrive, prism, jackpot are never bought (AI-4 rarity weights).
- Still not done: headless phone-size check after AI-6/AI-7 round 4 (needs a browser run), real-device sound and tutorial check.

## Round 5 (2026-11-11, proxy manager + AI-8)
Done:
- Round 5 brief pushed (docs/manager/ROUND5_AESTHETICS.md); AI-7 files covered by AI-1 and AI-4, AI-7 given small tasks.
- Screenshot audit in real Chrome at phone sizes: docs/manager/AUDIT_R5.md (11 ranked problems, owners named). Board-vs-HUD gap is 8 px or more at all 7 sizes, normal and large text.
- Cheat menu checked in a browser: gate (wrong password says No), every RUN / SHOP / META / DEBUG cheat tested, all pass.
- BUG FIXED: closing the cheat menu (Close, Esc, Android Back) opened "Leave this run?" because main.js started the app before installing the cheat listener. installCheats() now runs first (plus capture listener in gate.js). Test: tests/integration-cheats-extra.test.js.
- New cheats: start value 100 / 1K / 1M / 1T, "Give 3 x L1 / L2 (merge)", DEBUG Sounds panel (every sound, rising scale, music on/off). docs/CHEATS.md updated.
- 575 tests pass, build clean.

Left to do (not started):
- Audio sync: a function that scales the bank / finish sound by fireStats intensity (src/audio), one call in run.js finishFire (AI-1 file: ask AI-1 or do as proxy manager), richer win / lose / merge sounds, per-shift ambient mood (Overload tenser) in music.js.
- docs/QA.md: add round 5 screens, effects and the cheat menu checks.
- Frame-time check on the low tier.
- Fixes from AUDIT_R5.md go to AI-1 (items 2, 3, 4, 6, 7, 8, 10), AI-4 (5, 11), AI-6 (9).

## Round 5 leftovers (done by AI-5, covering AI-8, 2026-11-11, owner asked)
- **Audio sync, done.** New `src/audio/mood.js` (pure: `moodForShift`, `isOverloadShift`, `wantsSwell`), new `src/audio/reactions.js` (listens to `ui:fired`, `ui:fireDone`, `ui:merged`, `ui:runStarted`, `ui:shopOpened`, `ui:runEnded`; installed lazily from `initAudio()`, so NO screen file was touched and `run.js` needs no extra call). `sfx.js`: `setSoundContext` / `getSoundContext`; `bank` now uses the Fire's `fireStats` intensity when no size is given; new `swell` sound (end of a big, passed Fire); `merge` adds a sparkle at level 3; `win` and `lose` are richer (staggered notes by timer so the 12-node budget is not exceeded). `music.js`: `setMusicMood` / `getMusicMood` (brighter filter later in the run; Overload shifts 4 and 8 are tenser: clashing third drone, faster wobble, bells closer together).
- **Tests:** `tests/integration-audio-reactions.test.js` (9 tests: moods, intensity from real simulate events, merge level, bad data, fake WebAudio). `swell` added to the sound names in `tests/integration-audio.test.js`.
- **QA.md section 16** added (round 5 screens, effects, audio, cheat menu, real-device frame check).
- **Frame time, low tier (headless Chrome, 4x CPU slowdown, 360x740, empty board Fire):** low, medium and high all show 16.7 ms average and p95 16.8 ms, 0 to 0.5% slow frames. Headless Chrome is vsync-capped, so this only proves nothing is badly broken; a real 2 GB Android phone is still unchecked.
- **Still open for a person or an AI-1 follow-up:** AUDIT_R5.md items 2, 3, 4, 6, 7, 8, 10 (AI-1), 5 and 11 (AI-4), 9 (AI-6). Continuing a saved run mid-way keeps the default music mood until the next shop opens (no event is sent on resume; `ui:runStarted` would fix it).
- **Not checked:** how the new sounds feel on a real phone speaker.
