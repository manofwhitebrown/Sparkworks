# ROUND 5: make Sparkworks beautiful (proxy manager brief, 2026-11-11)

The MVP is done (463 tests green). This round is about look and feel. Light is the hero: dark graphite, warm amber spark, big clean numbers. Premium, never cheap.

## Ownership change for this round
AI-7 is out of capacity. Until the owner says otherwise, its files are covered like this (this overrides the table in docs/CONTRACT.md section 2 for this round only):

| Files that were AI-7's | Covered by |
|---|---|
| `src/ui/styles/*`, `public/fonts/*`, `docs/STYLE_GUIDE.md`, `docs/ASSETS.md`, `src/ui/ui.js`, `src/ui/screens/home.js`, `src/ui/screens/run.js`, `src/ui/components/*` | AI-1 |
| `src/ui/screens/shop.js`, `src/ui/screens/results.js` | AI-4 |

Every AI still edits ONLY the files listed for them here, plus their own notes file.

## Decisions already made (do not re-ask)
1. **Mood:** keep dark graphite + amber. Add depth with warm light, soft static gradients and a faint noise texture drawn ONCE. No new color families. Palette in contract section 10 stays.
2. **Font:** AI-1 may add ONE extra OFL display font (for big numbers and the wordmark only), subset and under 30 KB. If it cannot be fetched, keep Inter. Record it in `docs/ASSETS.md`.
3. **Skins:** later. AI-5 only writes a short design note now (see below).
4. **Devices:** three quality tiers. `low` must run exactly as smooth as today. New effects go behind `medium` and `high`. `reduceMotion` and `colorblind` keep working everywhere.

## Hard rules (same as always)
No `shadowBlur`, no `ctx.filter`, no `backdrop-filter`, no big blurred shadows on moving things, animate only `transform` and `opacity`, particle caps low 30 / medium 80 / high 150, one rAF loop, no new runtime libraries, no copyrighted assets. Bundle stays under 120 KB gzipped for this round. `npm test` and `npm run build` must pass before every push. Small pushes, only your own files, never commit the handoff file.

## Tasks per AI

**AI-6 (board renderer) , the biggest job: the Fire sequence and the parts**
1. Spark: tapered trail, hot white core, faint afterglow on the wire it just crossed.
2. Parts light up when entered; value pops use the part's tag color; pop size still follows `log10`.
3. Wires: traces look like conductors; energy visibly flows when a spark passes.
4. Vault payoff: vault fills with light, total swells, very large banks get a short slow-down and stronger shake (off under `reduceMotion`).
5. Merge / level-up flourish (hook for the `ui:merged` event; AI-1 wires it).
6. Part tiles get a "material" (subtle bevel / enamel) drawn once into the sprite cache. Icons become one visual family (consistent stroke, tag-based shape language) using AI-3's art brief. Legendary parts get a slow shimmer (medium and high only).
7. Use AI-2's `fireStats` helper to scale effects. Tests for any pure math. Update `docs/RENDER.md`.

**AI-1 (covering AI-7): UI chrome, home, run screen, transitions**
1. Tokens and surfaces: clearer type hierarchy, big numbers as the hero, panels with subtle static gradients and one pre-rendered noise texture, better buttons (pressed state, primary glow with opacity only).
2. Optional display font (decision 2).
3. Home: an idle animated board (a spark looping through a tiny demo machine, drawn with AI-6's `createBoardView`, paused when the screen is hidden) and a proper wordmark.
4. Screen transitions: one consistent, short, transform/opacity motion. Respect `reduceMotion`.
5. Run screen: polish HUD, FIRE button and bench using the new tokens; wire `ui:merged` to AI-6's flourish.
6. Update `docs/STYLE_GUIDE.md`. Re-check the 7 phone sizes in `docs/QA.md` section 13 (board must not overlap the HUD).

**AI-4: shop and results screens (covering AI-7)**
1. Shop: buy, sell and reroll animations (card flies to bench, coin count ticks, sold card dims). Offer cards use the new part tile look from AI-6.
2. Results: a real celebration for shift cleared, run won, run lost (count-up of the total, stars or a medal for beating the target by a margin, a calm sad state for a loss with the existing loss tip).
3. Keep all numbers through `formatNumber`, all texts through `docs/WORDS.md`. Add tests for any new logic. Notes in `docs/notes/AI-4.md`.

**AI-2: data for the juice**
1. New file `src/engine/fireStats.js`: `fireStats(events)` returns `{ chainLength, biggestMultiplier, biggestBank, bankedCount, lostCount, splitCount, intensity }` where `intensity` is 0..1 (pure, no NaN, under 1 ms for a 120-spark Fire). It reads the event list only.
2. Tests (`tests/engine-fireStats.test.js`) on real simulate output. Document in `docs/ENGINE.md`.
3. Then help AI-6: review its timeline/juice code for per-frame allocations and measure frame cost in the dev page; report numbers in your notes.

**AI-3: part identity**
1. New file `docs/ART_BRIEF_PARTS.md`: for each of the 31 parts, one line of visual identity for AI-6 (silhouette, motion cue, what the spark "looks like" leaving it) and one line of sound character for AI-8. Keep it consistent with tag colors in contract section 10.
2. Fix the two known text issues from the plain-text test (`deadCell`, `twoDeadCells` say "fizzle"; delete the KNOWN lines in `tests/integration-plain-text.test.js` ONLY after asking AI-8 in your notes, since that test is AI-8's).
3. Balance asks from AI-8 (docs/BALANCE.md UPDATE 5): fuse too weak, compounder and sideamp strong, workbench / tollgate / turnstile dead on most boards.

**AI-5: meta screens and skins note**
1. Restyle Workshop, Patent Book, Daily, Settings with the new tokens and surfaces from AI-1 (pull often; do not invent colors).
2. Patent Book: rarity treatment matches AI-6's tile look; locked silhouettes look intentional.
3. Write `docs/SKINS.md`: a short design for unlockable board skins bought with Spark Dust (what a skin changes: spark color, trace style, vault glow; data shape in meta; how it is stored). Design only, no code yet.

**AI-8 (also proxy manager)**
1. Phase 0 audit: screenshots of every screen at 360x740 and 390x844 and a Fire capture; ranked list of what feels cheap (`docs/BALANCE.md` stays for balance; audit goes in `docs/manager/AUDIT_R5.md`).
2. Audio: sync the rising-pitch melody to the new visuals, richer win / lose / level-up sounds, a different ambient mood per shift (Overloads tenser), intensity from `fireStats`. Still all in code, under the node budget.
3. Review every push from the others, keep tests green, update `docs/QA.md` with new screens and effects, check frame time on the low tier.

## Order
All AIs start now, in parallel. AI-1 pushes new tokens FIRST (small push) so AI-4 and AI-5 can build on them. AI-2 pushes `fireStats` early so AI-6 and AI-8 can use it. AI-3 pushes the art brief early.

## Done for this round
Every task above pushed, tests and build green, notes updated, no token in the repo, and the AI-8 audit shows each ranked problem as fixed or consciously deferred.
