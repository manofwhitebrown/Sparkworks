# Parts and Twists

Every part the player can place, and every Overload twist. Numbers come from the `NUMBERS` object at the top of each part file in `src/engine/parts/`.
Texts show a part pointing DOWN. The "(2 -> 5)" part is the example for a spark with the number 2. Directional parts name their direction in the real text.
Boost (from a Battery next to a part): a multiplier m becomes `1 + (m - 1) * boost`; a flat bonus b becomes `b * boost`.

| id | name | rarity | tags | cost | directional | L1 | L2 | L3 | combo ideas |
|----|------|--------|------|------|-------------|----|----|----|-------------|
| `coil` | Coil | common | add | 3 | no | Adds 3. (2 -> 5) | Adds 5. (2 -> 7) | Adds 8. (2 -> 10) | Coil before Amplifier (8, not 5); Coil next to Battery |
| `dynamo` | Dynamo | common | add | 4 | no | Adds 1 for every part on the board. (2 -> 7) | Adds 2 for every part on the board. (2 -> 12) | Adds 3 for every part on the board. (2 -> 17) | Fill the board with cheap parts, then Dynamo grows; Dynamo before Compounder |
| `ember` | Ember | common | add, state | 4 | no | Later sparks get more: +3 for each earlier spark. (2 -> 5) | Later sparks get more: +5 for each earlier spark. (2 -> 7) | Later sparks get more: +8 for each earlier spark. (2 -> 10) | Ember before Amplifier: sparks 2 and 3 get huge; Ember plus Echo reward later sparks |
| `amplifier` | Amplifier | common | mult | 5 | no | Doubles the number (x2). (2 -> 4) | Multiplies the number by 2.5. (2 -> 5) | Triples the number (x3). (2 -> 6) | Put adders (Coil, Anvil) in front; Amplifier next to Battery |
| `compounder` | Compounder | rare | mult | 7 | no | Bigger numbers grow more. Up to x6. (2 -> 2.4) | Bigger numbers grow more. Up to x8. (2 -> 2.57) | Bigger numbers grow more. Up to x10. (2 -> 2.8) | Anything big in front of it, it loves large values; Compounder after Echo |
| `overdrive` | Overdrive | legendary | mult | 10 | no | Huge x4 for the first spark and its copies. Later sparks get nothing. (2 -> 8) | Huge x5 for the first spark and its copies. Later sparks get nothing. (2 -> 10) | Huge x6 for the first spark and its copies. Later sparks get nothing. (2 -> 12) | Build everything for spark 1: Coil then Overdrive; Overdrive behind a Reverser loop |
| `bend` | Bend | common | route | 2 | yes | Turns the spark DOWN. | Turns the spark DOWN. | Turns the spark DOWN. | Bend after Splitter steers the copy home; Bend then Coil walls a path of adders |
| `switch` | Switch | common | route | 3 | yes | Even number: straight on. Odd number: turns DOWN. | Even number: straight on. Odd number: turns DOWN. | Even number: straight on. Odd number: turns DOWN. | Switch after a Coil flips odd/even and sends sparks to a second road; Switch before Rectifier |
| `reverser` | Reverser | rare | route | 6 | no | Sends the spark back. Works once per Fire. | Sends the spark back. Works 2 times per Fire. | Sends the spark back. Works 3 times per Fire. | Reverser doubles a Coil: walk it twice; Reverser plus Anvil for fast stacking |
| `splitter` | Splitter | common | split | 4 | yes | The spark goes straight. A copy (half the number) goes DOWN. | The spark goes straight. A copy (65% of the number) goes DOWN. | The spark goes straight. A copy (80% of the number) goes DOWN. | Splitter then Bend banks the copy too; Splitter before Amplifier on both roads |
| `triplet` | Triplet | rare | split | 7 | yes | The spark goes straight. Copies (40% of the number) go DOWN and UP. | The spark goes straight. Copies (50% of the number) go DOWN and UP. | The spark goes straight. Copies (60% of the number) go DOWN and UP. | Triplet in the middle, Amplifier on each road; Triplet plus Echo (more banked sparks) |
| `capacitor` | Capacitor | common | state | 4 | no | Keeps 40% of one spark. The next spark gets it. | Keeps 60% of one spark. The next spark gets it. | Keeps 80% of one spark. The next spark gets it. | Capacitor then Amplifier: second spark carries stored value x2; Capacitor next to Battery |
| `counter` | Counter | common | state | 4 | no | Every 3rd spark gets x3. (2 -> 6) | Every 3rd spark gets x4. (2 -> 8) | Every 2nd spark gets x4. (2 -> 8) | Counter after Amplifier makes every 3rd spark enormous; Counter next to Battery makes the big hit bigger |
| `anvil` | Anvil | common | add, state | 4 | no | Gets stronger each spark: +2, then +4, then +6, and so on. (2 -> 4) | Gets stronger each spark: +3, then +6, then +9, and so on. (2 -> 5) | Gets stronger each spark: +4, then +8, then +12, and so on. (2 -> 6) | Anvil on the main road, Splitter sends more passes through it; Anvil then Amplifier |
| `flywheel` | Flywheel | rare | mult, state | 6 | no | Grows each spark: x1.2, x1.4, x1.6, and so on. (2 -> 2.4) | Grows each spark: x1.3, x1.6, x1.9, and so on. (2 -> 2.6) | Grows each spark: x1.4, x1.8, x2.2, and so on. (2 -> 2.8) | Flywheel on a loop with Reverser; Flywheel behind Splitter copies |
| `battery` | Battery | common | boost | 5 | no | Parts next to it work 50% stronger. | Parts next to it work 75% stronger. | Parts next to it work 100% stronger. | Battery between Coil and Amplifier boosts both; Battery next to Fuse (x10 becomes x14.5) |
| `gambler` | Gambler | common | risk | 3 | no | Random multiplier: x0.5, x1, x2 or x4. | Random multiplier: x0.5, x1, x2 or x4. | Random multiplier: x1, x2 or x4. Never less than x1. | Gambler next to Battery lifts the good rolls; Gambler after Coil is safer, before it is wilder |
| `fuse` | Fuse | rare | risk | 6 | no | The first spark gets x10. Then it burns out. (2 -> 20) | The first spark gets x12. Then it burns out. (2 -> 24) | The first spark gets x15. Then it burns out. (2 -> 30) | Fuse after Coils, a one-shot spike; Fuse on the road only spark 1 takes (Turnstile) |
| `rectifier` | Rectifier | common | add, mult | 4 | no | Odd number: +4. Even number: x1.5. (2 -> 3) | Odd number: +6. Even number: x1.75. (2 -> 3.5) | Odd number: +9. Even number: x2. (2 -> 4) | Rectifier after Switch/Coil to control odd or even; Coil (+3) before Rectifier flips odd and even |
| `tollgate` | Tollgate | common | economy | 3 | no | Pays 1 coin each time a spark comes by. | Pays 2 coins each time a spark comes by. | Pays 3 coins each time a spark comes by. | Tollgate on a road that Splitter and Reverser cross many times; Tollgate plus Mint |
| `prism` | Prism (extra) | legendary | split | 10 | yes | The spark goes straight. Copies (70% of the number) go DOWN and UP. | The spark goes straight. Copies (85% of the number) go DOWN and UP. | The spark goes straight. Copies (100% of the number) go DOWN and UP. | Amplifier BEFORE Prism, then Bend each copy to the vault; Prism after Capacitor |
| `turnstile` | Turnstile (extra) | rare | route | 5 | yes | Each spark takes the next road: DOWN, then straight, then UP. | Each spark takes the next road: DOWN, then straight, then UP. | Each spark takes the next road: DOWN, then straight, then UP. | Three roads: Anvil on one, Fuse on another; Turnstile with Reverser |
| `echo` | Echo (extra) | rare | add, state | 5 | no | Adds 10% of what is already in the vault. (2 -> 4) | Adds 15% of what is already in the vault. (2 -> 5) | Adds 25% of what is already in the vault. (2 -> 7) | Echo with Ember: later sparks get more; Echo before Compounder |
| `mint` | Mint (extra) | common | economy, add | 3 | no | Takes 20% of the number. Pays 1 coin per 10 taken, up to 3. | Takes 20% of the number. Pays 1 coin per 10 taken, up to 5. | Takes 20% of the number. Pays 1 coin per 10 taken, up to 8. | Amplifier before Mint pays more coins; Mint plus Tollgate (double coin income) |

## The 4 extra parts

- **Prism** (legendary): like a stronger Triplet. Build-around: put multipliers before it and give all three roads a path to the vault.
- **Turnstile** (rare, route): a new path puzzle. Spark 1 takes side A, spark 2 goes straight, spark 3 takes side B, then it repeats.
- **Echo** (rare, uses `ctx.fire.bankedTotal`): adds a share of what the Fire has already banked. It is weak on spark 1 and strong later.
- **Mint** (common, coins): turns 20% of the value into coins. Good for the shop economy, bad for the highest score.

## Twists

| id | name | what it does |
|----|------|--------------|
| `deadCell` | Dead Cell | One random cell is dead. Sparks that enter it fizzle. |
| `twoDeadCells` | Two Dead Cells | Two random cells are dead. Sparks that enter them fizzle. |
| `noSplit` | No Splitting | All splitting parts are switched off this shift. |
| `fewerSparks` | Fewer Sparks | The source sends one spark less. |
| `rust` | Rust | One kind of part you placed rusts and stops working this shift. |
| `coldStart` | Cold Start | Sparks start at 0. Add before you multiply. |

Every twist adds its name to `machine.flags.twistNames` so the UI can show it. `noSplit` bans every part with the `split` tag (Splitter, Triplet, Prism).
