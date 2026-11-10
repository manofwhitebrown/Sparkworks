# Parts and Twists

Every part the player can place, and every Overload twist. Numbers come from the `NUMBERS` object at the top of each part file in `src/engine/parts/`.
Boost (from a Battery next to a part): a multiplier m becomes `1 + (m - 1) * boost`; a flat bonus b becomes `b * boost`.

| id | name | rarity | tags | cost | directional | L1 | L2 | L3 | combo ideas |
|----|------|--------|------|------|-------------|----|----|----|-------------|
| `coil` | Coil | common | add | 3 | no | Adds +3 to the spark. | Adds +5 to the spark. | Adds +8 to the spark. | Coil before Amplifier (8, not 5); Coil next to Battery |
| `dynamo` | Dynamo | common | add | 4 | no | Adds +1 for each part on the board. | Adds +2 for each part on the board. | Adds +3 for each part on the board. | Fill the board with cheap parts, then Dynamo grows; Dynamo before Compounder |
| `ember` | Ember | common | add, state | 4 | no | Adds +3 for each spark that came before this one. | Adds +5 for each spark that came before this one. | Adds +8 for each spark that came before this one. | Ember before Amplifier: sparks 2 and 3 get huge; Ember plus Echo reward later sparks |
| `amplifier` | Amplifier | common | mult | 5 | no | Multiplies the spark by x2. | Multiplies the spark by x2.5. | Multiplies the spark by x3. | Put adders (Coil, Anvil) in front; Amplifier next to Battery |
| `compounder` | Compounder | rare | mult | 7 | no | Multiplies by 1 + value/10, never more than x6. | Multiplies by 1 + value/7, never more than x8. | Multiplies by 1 + value/5, never more than x10. | Anything big in front of it, it loves large values; Compounder after Echo |
| `overdrive` | Overdrive | legendary | mult | 10 | no | Multiplies by x4, but only sparks from source spark 1. | Multiplies by x5, but only sparks from source spark 1. | Multiplies by x6, but only sparks from source spark 1. | Build everything for spark 1: Coil then Overdrive; Overdrive behind a Reverser loop |
| `bend` | Bend | common | route | 2 | yes | Turns the spark to face the way the part points. | Turns the spark to face the way the part points. | Turns the spark to face the way the part points. | Bend after Splitter steers the copy home; Bend then Coil walls a path of adders |
| `switch` | Switch | common | route | 3 | yes | Even value goes straight. Odd value turns to face the way the part points. | Even value goes straight. Odd value turns to face the way the part points. | Even value goes straight. Odd value turns to face the way the part points. | Switch after a Coil flips odd/even and sends sparks to a second road; Switch before Rectifier |
| `reverser` | Reverser | rare | route | 6 | no | Turns the spark around. Works 1 time per Fire. | Turns the spark around. Works 2 times per Fire. | Turns the spark around. Works 3 times per Fire. | Reverser doubles a Coil: walk it twice; Reverser plus Anvil for fast stacking |
| `splitter` | Splitter | common | split | 4 | yes | Spark goes straight and a copy with 50% of the value goes the way the part points. | Spark goes straight and a copy with 65% of the value goes the way the part points. | Spark goes straight and a copy with 80% of the value goes the way the part points. | Splitter then Bend banks the copy too; Splitter before Amplifier on both roads |
| `triplet` | Triplet | rare | split | 7 | yes | Spark goes straight and two copies with 40% of the value go to both sides. | Spark goes straight and two copies with 50% of the value go to both sides. | Spark goes straight and two copies with 60% of the value go to both sides. | Triplet in the middle, Amplifier on each road; Triplet plus Echo (more banked sparks) |
| `capacitor` | Capacitor | common | state | 4 | no | One spark stores 40% of its value. The next spark gets it added. | One spark stores 60% of its value. The next spark gets it added. | One spark stores 80% of its value. The next spark gets it added. | Capacitor then Amplifier: second spark carries stored value x2; Capacitor next to Battery |
| `counter` | Counter | common | state | 4 | no | Every 3rd spark gets x3. | Every 3rd spark gets x4. | Every 2nd spark gets x4. | Counter after Amplifier makes every 3rd spark enormous; Counter next to Battery makes the big hit bigger |
| `anvil` | Anvil | common | add, state | 4 | no | Adds +2 times the number of sparks that passed so far (this one included). | Adds +3 times the number of sparks that passed so far (this one included). | Adds +4 times the number of sparks that passed so far (this one included). | Anvil on the main road, Splitter sends more passes through it; Anvil then Amplifier |
| `flywheel` | Flywheel | rare | mult, state | 6 | no | Multiplies by 1 + 0.2 for each pass so far (this one included). | Multiplies by 1 + 0.3 for each pass so far (this one included). | Multiplies by 1 + 0.4 for each pass so far (this one included). | Flywheel on a loop with Reverser; Flywheel behind Splitter copies |
| `battery` | Battery | common | boost | 5 | no | Parts next to it work x1.5 stronger. | Parts next to it work x1.75 stronger. | Parts next to it work x2 stronger. | Battery between Coil and Amplifier boosts both; Battery next to Fuse (x10 becomes x14.5) |
| `gambler` | Gambler | common | risk | 3 | no | Random multiplier: x0.5 (25%), x1 (25%), x2 (30%), x4 (20%). | Random multiplier: x0.5 (15%), x1 (25%), x2 (35%), x4 (25%). | Random multiplier: x1 (25%), x2 (40%), x4 (35%). | Gambler next to Battery lifts the good rolls; Gambler after Coil is safer, before it is wilder |
| `fuse` | Fuse | rare | risk | 6 | no | The first spark that touches it gets x10. Then the fuse is spent. | The first spark that touches it gets x12. Then the fuse is spent. | The first spark that touches it gets x15. Then the fuse is spent. | Fuse after Coils, a one-shot spike; Fuse on the road only spark 1 takes (Turnstile) |
| `rectifier` | Rectifier | common | add, mult | 4 | no | Odd value: +4. Even value: x1.5. | Odd value: +6. Even value: x1.75. | Odd value: +9. Even value: x2. | Rectifier after Switch/Coil to control odd or even; Coil (+3) before Rectifier flips odd and even |
| `tollgate` | Tollgate | common | economy | 3 | no | Pays +1 coins each time a spark passes. | Pays +2 coins each time a spark passes. | Pays +3 coins each time a spark passes. | Tollgate on a road that Splitter and Reverser cross many times; Tollgate plus Mint |
| `prism` | Prism (extra) | legendary | split | 10 | yes | Spark goes straight and two copies with 70% of the value go to both sides. | Spark goes straight and two copies with 85% of the value go to both sides. | Spark goes straight and two copies with 100% of the value go to both sides. | Amplifier BEFORE Prism, then Bend each copy to the vault; Prism after Capacitor |
| `turnstile` | Turnstile (extra) | rare | route | 5 | yes | Each spark takes the next road: first the way it points, then straight, then the opposite way. | Each spark takes the next road: first the way it points, then straight, then the opposite way. | Each spark takes the next road: first the way it points, then straight, then the opposite way. | Three roads: Anvil on one, Fuse on another; Turnstile with Reverser |
| `echo` | Echo (extra) | rare | add, state | 5 | no | Adds 10% of the value already banked in this Fire. | Adds 15% of the value already banked in this Fire. | Adds 25% of the value already banked in this Fire. | Echo with Ember: later sparks get more; Echo before Compounder |
| `mint` | Mint (extra) | common | economy, add | 3 | no | Takes 20% of the value. Pays 1 coin per 10 taken, up to 3 coins. | Takes 20% of the value. Pays 1 coin per 10 taken, up to 5 coins. | Takes 20% of the value. Pays 1 coin per 10 taken, up to 8 coins. | Amplifier before Mint pays more coins; Mint plus Tollgate (double coin income) |

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
