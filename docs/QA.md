# QA checklist (AI-8)

Tick these on a phone (portrait) AND on a laptop browser. Write what broke at the bottom, with the
device and what you tapped. Update this file as the game grows.

## 1. First launch and tutorial
- [ ] Fresh install (or clear site data): the tutorial starts by itself.
- [ ] Every tutorial step shows a short message and a glowing ring on the right thing.
- [ ] Step "Place the Coil": you can tap the bench part, then tap the glowing cell.
- [ ] Press FIRE: you hear the pluck notes climb, you see a small total.
- [ ] Amplifier BEFORE the Coil gives a smaller number than Amplifier AFTER it.
- [ ] After swapping and firing, the tutorial moves on only if the number went UP.
- [ ] The shop step points at the offers. The last step ends on the home screen.
- [ ] "Skip tutorial" works on every step and does not show again after restart.
- [ ] Settings has "Replay tutorial" and it restarts the guide.

## 2. Sound (first tap, mute, music)
- [ ] Sound plays after the FIRST tap (phone and laptop).
- [ ] Place, rotate, buy, sell, reroll, merge, fire, bank, fizzle, win, lose, unlock, error all sound different and gentle.
- [ ] A long chain (20 parts) sounds like a rising melody, not noise.
- [ ] Settings: sound off = silence; music off = no ambient bed; both on = music stays quiet under the melody.
- [ ] Music fades in and out (about 1 second), no clicks.

## 3. A full run
- [ ] Start a run with each inventor. Play shifts 1 to 3: place, rotate, move, return to bench.
- [ ] Targets and Fires left are always visible. Unused Fires pay coins.
- [ ] Shop: buy, sell, reroll (price goes up), buy 3 of the same part and see it level up.
- [ ] Shift 4 shows the Overload twist clearly (and plays the overload sound).

## 4. Loss and win
- [ ] Lose a run: lose sound, results screen, Spark Dust is shown, new unlocks announced.
- [ ] Win a run (use voltage 1): win sound, results screen, next voltage unlocked.

## 5. Save and resume
- [ ] Close the app in the middle of a shift, reopen: same board, bench, coins, Fires and shop offers.
- [ ] Close in the shop: same offers (no free reroll by restarting).
- [ ] Kill the app during a Fire animation: reopening does not break anything.

## 6. Meta screens
- [ ] Daily Contract: same machine each time today; second attempt is refused or clearly marked; share code can be copied.
- [ ] Workshop: buy an upgrade with dust; the price rises; the bonus shows in the next run.
- [ ] Patent Book: locked parts show how to unlock; new parts show "new" until seen.
- [ ] Voltage: winning level N unlocks level N+1 for that inventor only.

## 7. Settings
- [ ] Sound, music, haptics, reminders: each toggle works and is remembered after restart.
- [ ] Reduce motion: no shake, fewer particles, shorter animations.
- [ ] Large text: nothing is cut off on a 360 px wide phone.
- [ ] Colorblind: parts can still be told apart (shapes and labels, not only color).
- [ ] Quality auto/low/medium/high changes the particle amount.

## 8. Device behaviour
- [ ] Android back button: closes a modal first, then goes back a screen, never exits in the middle of a Fire by accident.
- [ ] Rotate the phone: layout recovers, board is not stretched or lost.
- [ ] Low-end phone: board animation stays smooth (about 60 fps, never below 30). Try quality low.
- [ ] Airplane mode: the app starts and plays a full run offline.
- [ ] Safe areas: nothing hidden behind a notch or the gesture bar.
- [ ] Tap targets are easy to hit with a thumb (at least 44 px).

## 9. Try to break it (20 ideas)
1. Tap FIRE five times very fast.
2. Tap FIRE, then tap a part while the sparks are still moving.
3. Place a part on a blocked (dead) cell.
4. Drag a part off the board and let go outside.
5. Drag a part onto a cell that already has a part.
6. Rotate a part again and again very quickly.
7. Buy with 0 coins. Buy with exactly the price.
8. Buy the same offer twice by double-tapping.
9. Reroll until you cannot afford it, then keep tapping.
10. Sell the last part you own, then try to fire.
11. Fill the bench, then buy another part.
12. Fire with an empty board.
13. Fire with a part blocking nothing and every part pointing away from the vault.
14. Make a loop (parts that turn the spark around) and fire.
15. Open the shop, close the app, reopen, open the shop again.
16. Skip the tutorial at step 1, then replay it from settings.
17. Change settings in the middle of a Fire (sound, reduce motion).
18. Press the browser back button / Android back button at every screen.
19. Resize the browser window while a Fire is playing.
20. Change the phone clock to tomorrow and open the Daily Contract; then change it back.

## Found problems
(none yet)

## 13. Phone layout checklist (round 3)

Do this once per size, once with normal text and once with Large text (Settings) on.
Sizes (width x height): 320x568, 360x640, 375x667, 360x740, 390x844, 412x915, 430x932.
On a laptop use the browser's device mode and type the size in. Reload after changing the size.

Rules that must hold on EVERY screen:
- [ ] No sideways scroll (swipe left and right: the page does not move).
- [ ] Every button and tap target is at least 44 x 44 px.
- [ ] No text is smaller than 12 px.
- [ ] Nothing hides under FIRE or "Next shift", and there is at least 12 px of space between the last thing you can scroll to and those buttons.
- [ ] The sticky button does not touch the screen edge (it keeps a margin and the safe-area inset).

Screens, and what to look for:
- [ ] Home: PLAY, Continue (only for a real run, NEVER after skipping the tutorial), inventor picker, Voltage stepper, bottom links all visible or reachable by scroll.
- [ ] Run, nothing selected: the board never overlaps the HUD (target, Fires), the bench, or FIRE. Board top is below the HUD bottom.
- [ ] Run, a part selected: the info panel does not overlap the board; Rotate, Remove and the bench are all reachable.
- [ ] Fire in progress: numbers and the banner do not cover the HUD; Skip is reachable.
- [ ] Shop: every offer, Reroll, the bench and the mini board can be reached by scrolling; "Next shift" does not cover the bench. Tapping a cell on the mini board does what the text says.
- [ ] Results (win and loss): totals, Spark Dust and the buttons are all visible or reachable.
- [ ] Workshop, Patent Book, Daily, Settings: cards line up, nothing is cut off, back works.
- [ ] Big phones (412x915, 430x932): the board grows to use the space (it should not stay a small box in the middle).

How to fill it in: write the size and "pass" or the problem in one line each, for example
`360x640 largeText, Shop: Next shift covers the bench (BUG)`.
The automated numbers (board top minus HUD bottom per size) are in docs/notes/AI-8.md.

## 14. Tutorial skip and continue

- [ ] First launch: the tutorial starts. Press "Skip tutorial". Home must NOT show "Continue run".
- [ ] Close and reopen the app: the tutorial does not start again, Home still has no Continue.
- [ ] Settings > Replay tutorial: the tutorial starts again from step 1. Finish it: Home has no Continue.
- [ ] Start a normal run, place a part, close the app: Home shows "Continue run" and it resumes the same board.

## 15. Round 4 screens (add to the phone checklist in section 13)

Check each one at all 7 sizes, normal and Large text. The same rules apply: no sideways scroll, nothing under 44 px,
no text under 12 px, nothing hidden under FIRE or "Next shift".
- [ ] How to Play: opens from Home and from Settings. Every page can be reached. Back works. The words match docs/WORDS.md.
- [ ] Hint button: visible on the run screen without scrolling. Press it: a part is placed or highlighted, the chime plays, the number of hints left goes down. With an empty bench it says so politely.
- [ ] Overload banner (shifts 4 and 8): it explains the rule in plain words. It does not cover the board or the HUD. Tap to close works.
- [ ] Gentle mode switch on Home: it can be switched on and off, it is at least 44 px tall, it says what it does in one short line. A Gentle run shows a Gentle mark on the run screen and on the results.
- [ ] Results tip after a loss: it says why (for example "A part was never touched") and what to try. It is not blaming ("You failed" must not appear). The Next/New run button stays visible.
- [ ] Path preview: the line shows where the spark will go. It does not show numbers. The toggle "Show path" works.
- [ ] Bonus tiles: they glow on the board and do not hide the part on them. A spark that touches one makes the pop sound.
- [ ] Tutorial v2 (11 steps): Place Coil, Fire, Amplifier before, swap (bigger number), the steering step, build the detour (Bend down, Coil below, Bend right), Fire. Then try it WRONG once (only the first Bend and the Coil): the text must say the spark was lost off the bottom and let you add a Bend. The shop opens only after the detour lesson. "Skip tutorial" works on every step.
- [ ] Sounds: a soft sigh when a spark is lost (not a harsh buzz), a pop for a bonus tile, a chime for Hint. All quiet enough to hear over the music.


## 16. Round 5: look, effects, audio and the cheat menu

Same rules as section 13 (7 sizes, normal and Large text, no sideways scroll, nothing under 44 px, no text under 12 px).
Check each effect on the three quality tiers (Settings > Graphics: low, medium, high). `low` must feel as smooth as before round 5.
- [ ] Meta screens (Workshop, Patent Book, Daily, Settings): one shared look (hero number panel, card surfaces, small caps labels). Locked parts have a dashed frame and the unlock hint. Settings toggles are grouped. Nothing is cut off at 320x568 with Large text.
- [ ] Fire sequence: tapered spark with a trail, parts light up when entered, vault fills with light, total swells. On `low` there are fewer effects but the Fire is just as smooth. With Reduce motion on: no shake, shorter animation.
- [ ] Legendary parts shimmer slowly on medium and high only. Merge: a flourish plays when three parts become one (`ui:merged`).
- [ ] Shop: bought card flies to the bench, coin count ticks, sold card dims. Results: count-up, a medal for beating the target by a margin, a calm state for a loss with the loss tip.
- [ ] Home: the idle board loops a small spark and pauses when the screen is hidden (check with another tab). Screen changes: one short fade plus a small rise, no jump.
- [ ] Sound follows the Fire: a small Fire has soft bank chords, a very big Fire has fuller bank chords and a rising swell at the end (only when the shift is cleared). A lost shift has no swell.
- [ ] Merge sound: level 2 is a short rising lift, level 3 adds a bright sparkle on top.
- [ ] Win is a rising run then a held chord; Lose is a slow soft step down with a warm low note. Neither is harsh on a phone speaker.
- [ ] Music mood: shifts get slightly brighter as the run goes on. On Overload shifts (4 and 8) the music is tenser (faster slow-wobble, a clashing low note, bells closer together). It relaxes again after the Overload. Starting a new run resets the mood. (Known: continuing a saved run mid-way keeps the default mood until the next shop opens.)
- [ ] Cheat menu (needs the password): Close, Esc and Android Back close it and never open "Leave this run?". DEBUG > Sounds plays every sound including `swell`.
- [ ] Frame time, low tier, real cheap phone (2 GB RAM): no dropped frames during a Fire with 100+ sparks. Headless numbers are in docs/notes/AI-8.md; a real device check is still open.
- [ ] **Credits:** Settings, bottom: "Created by Mohammed Abdul Nayeem." is there and readable at Large text. `docs/CREDITS.md` says the same.
