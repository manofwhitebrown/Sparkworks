# Sparkworks words (one list for the whole game)

Owner: AI-8. Everybody follows it: part texts, screens, buttons, tutorial, toasts, notes for players.
The rule: ONE word for ONE thing, everywhere. Write for a 9-year-old.

## Writing rules
- At most 12 words in a sentence. Shorter is better (about 8).
- Say what happens, then give an example when a number changes: `2 -> 5`.
- Name directions in words ("down", "right"), not "faces the way it points".
- Never blame the player. "Not enough yet. Try again." is good. "You failed." is not.
- Capitals only for names in the list below (Fire, Vault, Source...), not for ordinary words.

## The words

| Word | Say it like this (a kid's explanation) |
|------|----------------------------------------|
| **Spark** | A little ball of light. It has a number on it. |
| **Fire** | Press FIRE and the Source sends 3 sparks. "2 Fires left" means 2 tries. |
| **Source** | Where sparks start. It is on the left. |
| **Vault** | Where sparks must end. It is on the right. A spark that reaches the vault adds its number to your score. |
| **Lost** | A spark that leaves by the top, the bottom or the left. It scores nothing. (Never "fizzle".) |
| **Part** | A thing you put on the board. It changes the spark's number or its way. |
| **Bench** | Where your parts wait until you put them on the board. |
| **Board** | The grid where you build your machine. |
| **Shift** | One round. You clear 8 shifts to win. |
| **Overload** | A hard shift with a special rule. Shifts 4 and 8. |
| **Target** | The score you need in a shift. |
| **Coins** | Money for the shop. You earn them by clearing shifts. |
| **Shop** | Where you buy parts after each shift. |
| **Reroll** | Pay a coin to see new parts in the shop. |
| **Sell** | Give a part back and get coins. |
| **Level up** | Buy 3 of the same part and they join into one stronger part. |
| **Voltage** | How hard the game is. Higher is harder. |
| **Gentle mode** | An easier run with more Fires and lower targets. |
| **Spark Dust** | Dust you earn after every run. Use it in the Workshop. |
| **Workshop** | Where you spend Spark Dust on permanent upgrades. |
| **Patent Book** | A book of every part you have found. |
| **Daily** | A puzzle that is the same for everybody today. |

## Words we never say to players

| Never say | Say instead |
|-----------|-------------|
| pass, passes, passed | "touches", "goes through", "reaches" |
| banked, bank | "reaches the vault", "adds to your score" |
| fizzle, fizzled | "lost" |
| value | "number" |
| store, stores | "keeps", "saves up" |
| trigger, triggers | "starts", "happens" |
| proc | (just say what happens) |

`tests/integration-plain-text.test.js` checks every part text, every Overload text and every tutorial text against
this list (words and sentence length). Texts in screens and buttons are checked by hand: see docs/QA.md.
