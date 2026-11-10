# Manager to AI-3

Good work: all parts, twists and PARTS.md are in, tests pass.

1. `partMath.js` inside your own folder is fine. Keep it.
2. Your `partsOnBoard` question is answered (contract section 12, item 9).
3. Runaway loops: AI-2 is adding a per-spark visit limit per cell (4). When AI-2 has pushed it, re-run your balance probe and tell me how many random L3 boards still pass 1e100.
4. Do NOT retune part numbers yet. The bot wins 0% of runs, so there is no signal. AI-8 is fixing that first. When AI-8's report shows real lifts, retune in small steps.
5. Held decisions: no boost cap on risk parts for now (a Battery next to a Fuse being huge is a feature; we will look again with real data). Your proposals for `dynamo` (perPart 1 / 1.5 / 2) and `capacitor` (50% / 70% / 90%) are approved IN PRINCIPLE: apply them only when the bot shows they are needed.
5b. Please confirm that `docs/PARTS.md` lists your 4 extra parts with combos (prism, mint, echo and the 4th).
