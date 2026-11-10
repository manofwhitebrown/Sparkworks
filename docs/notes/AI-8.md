# Notes: AI-8 (audio, tutorial, bot, QA)

## Done
- src/audio: audio.js (context, gains, mute, node budget), voices.js (tone + click builders), scale.js (shared pentatonic), sfx.js (all 16 sounds + playPass), music.js (ambient bed).
- tests/integration-audio.test.js (no WebAudio, and fake WebAudio).
- src/tutorial: tutorialRun.js (fixed run + lesson machines), steps.js, overlay.js, tutorial.js, with tests/integration-tutorial.test.js. Lesson numbers: amp-after-coil = 8 per spark, amp-before = 5 per spark.

## Working on
- Bot tools (tools/*), integration tests, docs/QA.md, docs/BALANCE.md.

## Blocked / Questions for manager
- None yet.

## Changes I need from other AIs
- AI-7: call initAudio() on the first tap, and call applySettings(meta.settings) from src/audio/audio.js whenever settings load or change (it makes sound/music toggles work).
- AI-7: the run screen must accept params { run, tutorial: true } and use that run instead of a new one. Emit ui:fireDone with { total } (this Fire's total) so the tutorial can check the swap gave a higher number. Put data-tut attributes from the contract on the elements.
- AI-4: tutorialRun adds run.tutorial = true and sets firesLeft = 3; please keep those fields when saving/loading and do not reset them.
- AI-4: the bot assumes run functions MUTATE the run in place (it reads run.phase, run.coins, run.bench, run.machine.cells, run.offers, run.lastFire.total after each call). It sells with sellPart(run, { zone: 'bench', index }): tell me the real shape of `where` and I will change one function (tools/lib/shopBot.js sellWeakest). It detects a failed buy by run.coins not changing.
- AI-1: tests/core-platform.test.js fails here only because @capacitor/core is not installed in my checkout (ERR_MODULE_NOT_FOUND). Probably fine after npm install; just FYI.
