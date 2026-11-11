# Beginner review (manager, 2026-11-11): where a new player or a kid gets stuck

I played the Pages build in a phone-sized browser and read the code. The owner also told me they did not know
that parts can sit beside the main line (the spark can be steered to them). That is the biggest sign the game
does not teach its own best idea. Everybody reads this file. Each AI's tasks are in `docs/manager/to-AI-N.md` (section ROUND 4).

## Where players get stuck (evidence)
| # | Stuck point | What I saw |
|---|---|---|
| S1 | A part off the spark's path does nothing, and nothing says so | I put Coil and Amplifier one row below the line by accident. Result: 1 / 16. The game only said "Not enough." |
| S2 | Nobody teaches that Bend, Splitter, Switch and the other route parts steer the spark to side cells | The tutorial has 8 steps: place, fire, order, target, shop. Steering is never mentioned. The board has 20 cells but players only use the middle row. |
| S3 | You cannot see where the spark will go | Only a faint dashed line on the source row. |
| S4 | A spark that leaves by the top, bottom or left edge is lost, and this is never explained | Only a short sound and a ring of dots. |
| S5 | Jargon in part texts: "passed so far (this one included)", "stores 40%", "value", "banked", "fizzle", "pass" | Example: Anvil says "Adds +2 times the number of sparks that passed so far (this one included)." A kid cannot read this. |
| S6 | "Turns the spark to face the way the part points": which way does it point? | The text never says the direction, and there is no arrow in the text. |
| S7 | Merging (3 the same = level up) is said once, at the very end of the tutorial | Shop cards do not show how many you own or "1 more to level up". |
| S8 | There is no How to Play or help anywhere | The tutorial can only be replayed from Settings. |
| S9 | The goal is never stated | Nowhere says "clear 8 shifts to win". |
| S10 | Overload shifts show only a name chip ("Dead Cell"), no explanation | `hud.js` prints `twistNames` only. |
| S11 | After a loss nobody tells you why or what to try | Results shows shifts cleared, best Fire, parts owned. |
| S12 | Drag to move a part, Rotate, selling, the bench limit, reroll price: none are explained | Only "Tap a part, then tap a cell to place it." |

## The plan in three parts
**A. Teach it (most important, do first):** path preview, "never touched" feedback, a How to Play screen, a better
tutorial that teaches steering, plain part texts with an example number, an Overload banner, a loss tip, Gentle mode
and a Hint button.
**B. More to play with:** 8 new parts, bonus tiles on the board, 2 new inventors, 3 new Overload twists, more achievements.
**C. Keep it honest:** the bot learns the new parts, balance is re-checked, the same words are used everywhere (`docs/WORDS.md`).

## Writing rules for ALL player-facing text (kids first)
- Short sentences, at most 10 words. Words a 9-year-old knows. No jargon: not "pass", "banked", "value", "fizzle", "store", "trigger".
- Say "number" for the spark's value, "reaches the vault" for banked, "lost" for fizzled, "goes down (arrow)" instead of "faces the way it points".
- Always give an example when the effect is a number: `2 -> 5`.
- One word for one thing everywhere. The list is in `docs/WORDS.md` (AI-8 writes it, everyone follows it).
- Never blame the player. "Not enough yet. Try again." is fine, "You failed" is not.
