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
