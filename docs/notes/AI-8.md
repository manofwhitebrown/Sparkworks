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
