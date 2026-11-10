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
