# SPARKWORKS: SHARED CONTRACT v1

> This text is identical in all 8 AI files. AI-1 also commits it to the repo as `docs/CONTRACT.md`.
> Only the manager (Claude) changes it. If you think it must change, write the request in your own
> notes file (`docs/notes/AI-N.md`, section "Questions for manager") and KEEP GOING with the contract as written.

---

## 1. The game in 12 lines

- Name: **Sparkworks**. A puzzle-roguelite. Phone (portrait) first. It is also played in a laptop browser.
- The board is a small grid (5 columns x 4 rows to start). A spark SOURCE is on the left edge. A VAULT is on the right edge.
- You put PARTS on cells. A part can be rotated.
- Press **FIRE**: the source sends 3 sparks, one after another. Each spark walks cell by cell. Every part it touches changes it (add, multiply, split, turn, and so on).
- A spark that leaves the board through the RIGHT edge drops into the vault: its value is banked. Leaving by any other edge = fizzle (worth 0).
- Each shift gives **2 Fires**. The banked totals of all Fires in the shift ADD UP. Reach the shift TARGET = shift cleared. Unused Fires pay coins. Out of Fires below target = run lost.
- A run = 8 shifts. Shifts 4 and 8 are **Overloads** (a rule twist, for example one dead cell). After each cleared shift: the shop (buy, sell, reroll).
- Buy 3 identical parts of the same level = 1 part of the next level (max level 3).
- ORDER of parts matters (add then multiply is not the same as multiply then add). That is the depth of the game.
- Meta (kept between runs): Patent Book (parts codex), Inventors (starting kits), Voltage (difficulty, 4 levels in v1), Spark Dust (permanent currency), Daily Contract (same seed for everybody).
- The machine is **DETERMINISTIC**: same machine + same seed = same events. Randomness only comes from shop offers and a few "risk" parts, and ALWAYS through the seeded rng.
- The look: dark graphite board, glowing amber spark, big clean numbers. It must feel premium, never cheap. Light is the hero.

---

## 2. Who owns what (never edit files you do not own)

| AI | Role | Owns |
|----|------|------|
| AI-1 | Foundation and DevOps | root files (`package.json`, `vite.config.js`, `index.html`, `.gitignore`, `README.md`, `capacitor.config.json`), `.github/`, `android/`, `docs/CONTRACT.md`, `docs/ARCHITECTURE.md`, `src/main.js`, `src/core/*`, `src/platform/*`, `tests/core-*.test.js` |
| AI-2 | Engine core | `src/data/config.js`, `src/engine/board.js`, `src/engine/eventTypes.js`, `src/engine/simulate.js`, `docs/ENGINE.md`, `tests/engine-*.test.js` |
| AI-3 | Parts and twists | `src/engine/parts/*` (one file per part + `index.js`), `src/engine/twists.js`, `docs/PARTS.md`, `tests/parts-*.test.js`, `tests/helpers/fakeCtx.js` |
| AI-4 | Run loop, shop, difficulty | `src/run/*`, `src/data/shifts.js`, `src/data/inventors.js`, `src/data/voltage.js`, `docs/RUN.md`, `tests/run-*.test.js` |
| AI-5 | Meta progression and meta screens | `src/meta/*`, `src/data/achievements.js`, `src/data/workshop.js`, `src/ui/screens/workshop.js`, `patentBook.js`, `daily.js`, `settings.js`, `docs/META.md`, `tests/meta-*.test.js` |
| AI-6 | Board renderer and juice | `src/render/*`, `dev/*`, `docs/RENDER.md` |
| AI-7 | UI shell, main screens, design system | `src/ui/ui.js`, `src/ui/screens/home.js`, `run.js`, `shop.js`, `results.js`, `src/ui/components/*`, `src/ui/styles/*`, `public/fonts/*`, `docs/STYLE_GUIDE.md`, `docs/ASSETS.md` |
| AI-8 | Audio, tutorial, bot and QA | `src/audio/*`, `src/tutorial/*`, `tools/*`, `tests/integration-*.test.js`, `docs/BALANCE.md`, `docs/QA.md` |

Everyone also owns their own notes file: `docs/notes/AI-N.md` (N = your number).

---

## 3. Rules for everybody

**Code style: simple on purpose**
- Plain JavaScript with ES modules (`import` / `export`). Node 22. NO TypeScript, NO JSX, NO frameworks (no React, Vue, Svelte...), NO game engines (no Godot, Unity, Phaser, Pixi, Three, Babylon). Runtime libraries allowed: only `@capacitor/*` plugins. Dev tools allowed: Vite, Capacitor CLI, `node:test` (built into Node). Want anything else? Ask the manager first.
- Write boring, readable code: small functions, plain objects and arrays, `for` loops, `if`/`else`. No clever one-liners. No nesting deeper than 3 levels. No classes unless really needed. No generators, proxies, decorators, or fancy async tricks. Comments in plain English that explain WHY.
- MANY small files are good (aim for under about 200 lines per file). One job per file. Every file starts with a header comment: what it does + `Owner: AI-N`.
- 2-space indent, semicolons, single quotes, `camelCase` names, `UPPER_CASE` constants, file names in `camelCase.js`.
- No globals on `window`. No hidden state: functions get what they need as arguments. When your code calls another AI's module, import it normally but let tests replace it (an optional last argument `deps`), so your tests never depend on unfinished work.
- Numbers are JS doubles. Cap values at `CONFIG.maxValue` (1e300). Show numbers with `formatNumber()` from `core/format.js`.

**Performance: it must not lag on a cheap Android phone (2 GB RAM, old WebView)**
- Target 60 fps. ONE `requestAnimationFrame` loop for the whole app (`core/loop.js`).
- Per-frame code: reuse arrays and objects, no `JSON.parse/stringify`, no regex, do not mix DOM reads and writes.
- Canvas: NEVER use `ctx.shadowBlur` or `ctx.filter`. Make glow by drawing a small glow picture ONCE on an offscreen canvas and re-drawing it with `globalCompositeOperation = 'lighter'`. Cap `devicePixelRatio` at 2.
- CSS: no `backdrop-filter`, no big `box-shadow` or `filter: blur` on things that move or scroll. Animate only `transform` and `opacity`.
- Particle caps: low = 30, medium = 80, high = 150.
- Whole JS bundle: aim under 400 KB gzipped.

**Assets and licences**
- No copyrighted assets. Only things made in code (canvas, SVG, WebAudio) or CC0 / OFL-licensed. Record every outside asset in `docs/ASSETS.md` (AI-7 owns that file; send entries to AI-7 through your notes file).

---

## 4. GitHub access and the token: READ CAREFULLY

Repo: https://github.com/manofwhitebrown/Sparkworks
Right now it holds only a tiny `README.md` (2 commits). Everyone clones it and pushes straight to the `main` branch. **You have permission to push yourself.** The owner (the human) has said so.

The token is a SECRET:
- Keep it ONLY in a shell variable. NEVER write it into any file (no `.env`, no scripts, no notes, no docs, no code, no commit message, no git config). NEVER put it in a remote URL (that saves it inside `.git/config`). Never print it, never log it, never use `set -x`.
- If your shell forgets variables between commands, put the variable in front of the command on the same line each time. Do not save it anywhere.
- GitHub scans pushes. If the token lands in the repo, GitHub revokes it and EVERYBODY is blocked. Before every commit run `git diff --cached | grep -i github_pat`. It must print nothing. Also never commit this handoff file.
- Use a bash shell (on Windows: Git Bash).

```bash
# type these in the terminal. Do NOT save them in a file.
GH_TOKEN='<ask the owner>'
gitx() { git -c http.extraheader="AUTHORIZATION: basic $(printf 'x-access-token:%s' "$GH_TOKEN" | base64 | tr -d '\n')" "$@"; }

gitx clone https://github.com/manofwhitebrown/Sparkworks.git
cd Sparkworks
git config user.name  "AI-N role"          # use your real number and role
git config user.email "ai-N@sparkworks.local"
```

**Every time you push:**
1. `git status`, then `git add` ONLY your own files (never a blind `git add .`).
2. `git diff --cached | grep -i github_pat` (must print nothing).
3. `git commit -m "AI-N: short message"`
4. `gitx pull --rebase origin main`
5. Run `npm test` (once the skeleton exists).
6. `gitx push origin main`
If the push is rejected: do step 4 and 6 again. NEVER force-push. NEVER rewrite history. NEVER delete or change files you do not own. If a rebase conflict hits a file you do not own: `git rebase --abort`, keep their version, and write it in your notes file.
Push small and often (after every finished group of files). Do not hoard work on your laptop.

**Start order (important):**
- AI-1 pushes the SKELETON first (folders, stub files for every file in section 8, `package.json`, `docs/CONTRACT.md`). This is the most urgent job of the whole team.
- Everybody else: read this whole contract and your task, plan your files, then run `gitx pull origin main` every few minutes until `docs/CONTRACT.md` and `package.json` exist. While waiting, draft in a scratch folder OUTSIDE the repo (for example `~/sparkworks-scratch/`). When the skeleton arrives, your stub files are already in your folders: **overwrite them completely** with your real code. Keep the same exported names.
- If you must run tests before the skeleton exists: make a local `package.json` containing only `{"type":"module"}`, do NOT commit it, and delete it when AI-1's real one arrives.
- Tests run with `npm test` (= `node --test "tests/*.test.js"`). Test files live in `tests/` and are named `area-something.test.js`.

---

## 5. Board, directions, machine format

- Cells: `x` goes 0..cols-1 from LEFT to RIGHT. `y` goes 0..rows-1 from TOP to BOTTOM.
- Directions are the strings `'right'`, `'down'`, `'left'`, `'up'`. Rotation `rot` is 0..3 = number of clockwise quarter turns from `'right'` (0 = right, 1 = down, 2 = left, 3 = up).
- A spark is born in cell `(0, sourceRow)` moving `'right'`.
- Walking: the spark ENTERS a cell. If the cell is blocked it fizzles. Else, if the cell has an active part, the part's `onPass` runs. Then the spark moves one cell in its CURRENT direction (a part may have changed it).
- Leaving through `x = cols` (right edge) = **bank** (value added to the total). Leaving through any other edge = **fizzle**. After `CONFIG.maxSteps` (60) steps a spark fizzles (this stops loops).
- Order of work: source sparks run one at a time, 1..sparkCount. The children of a spark (made by splits) run right after their parent ends, in the order they were made, before the next source spark starts. At most `CONFIG.maxSparksPerFire` (120) sparks in one Fire; extra splits are ignored.
- Parts act when a spark ENTERS their cell. A spark can enter the same cell more than once (loops) and the part acts every time.

**Machine** (the input of `simulate`; plain data, safe to save as JSON):
```
{
  cols: 5, rows: 4,
  sourceRow: 1,                 // spark enters at x = 0 on this row, moving right
  sparkCount: 3,                // source sparks per Fire
  startValue: 1,                // value of every source spark
  cells: [ { x, y, partId, level, rot } ],   // at most one part per cell
  blocked: [ { x, y } ],        // a spark entering these cells fizzles
  banned: [ 'partId' ],         // these parts act like empty cells this shift
  flags: {},                    // UI-only flags, the engine ignores them
  seed: 12345                   // seed for the rng used inside simulate
}
```
Defaults live in `src/data/config.js` as `CONFIG`: `cols 5, rows 4, sourceRow 1, sparkCount 3, startValue 1, maxSteps 60, maxSparksPerFire 120, maxValue 1e300`.

---

## 6. Part files (`src/engine/parts/<id>.js`) and the `ctx` API

Each part file does `export default { ... }` with ONE plain object:
```
{
  id: 'coil',                    // same as the file name; lowercase, underscores allowed
  name: 'Coil',
  rarity: 'common',              // 'common' | 'rare' | 'legendary'
  tags: ['add'],                 // from: add, mult, route, split, state, boost, risk, economy
  directional: false,            // true when the rotation matters
  maxLevel: 3,
  cost: 3,                       // base shop price in coins
  describe(level) { return 'Adds +3 to the spark.'; },   // short text for cards
  boostFor(level) { return 1.5; },   // OPTIONAL, only for Battery-type parts: strength of the boost they give to ADJACENT parts
  onPass(ctx) { ... }            // runs when a spark enters the cell
}
```

`ctx` is given by the engine (AI-2 writes it, AI-3 uses it):

| name | meaning |
|------|---------|
| `ctx.value` | the spark's current value (read only) |
| `ctx.dir` | the spark's current direction (read only) |
| `ctx.level` | level 1..3 of THIS part |
| `ctx.rot` | rotation 0..3 of THIS part |
| `ctx.boost` | number >= 1: the product of `boostFor` of the adjacent parts (up, down, left, right). 1 when none. Parts scale their own effect with it. A multiplier m becomes `1 + (m - 1) * boost`. A flat bonus b becomes `b * boost`. |
| `ctx.state` | a plain object that belongs to this part instance. Empty at the start of every Fire. Kept across sparks within the same Fire. |
| `ctx.fire` | read only info: `{ sparkNumber, bankedTotal, bankedCount, partsOnBoard }` (`sparkNumber` = 1-based number of the SOURCE spark this spark came from) |
| `ctx.rng()` | number 0..1 from the seeded generator. The ONLY allowed randomness. |
| `ctx.setValue(v, label)` | change the spark's value. `label` is the small text to show, like `'+3'` or `'x2'`. The engine clamps to `[0, maxValue]` and refuses NaN. |
| `ctx.setDir(dir)` | change the direction (`'right'`, `'down'`, `'left'`, `'up'`) |
| `ctx.turnToFacing()` | shortcut: `setDir(` the direction of `ctx.rot` `)` |
| `ctx.split(dir, value, label)` | make a NEW spark in this cell with that direction and value. It starts moving after this part has finished. |
| `ctx.addCoins(n)` | give n coins to the player (paid at the end of the shift) |
| `ctx.disable()` | this part stops working for the rest of this Fire (acts like an empty cell) |
| `ctx.note(label)` | show a small text on the part without changing anything (for example `'1/3'`) |

Rules for parts: use ONLY `ctx`. Never touch the board. Never use `Math.random` or `Date`. Never read another part's state. Never produce NaN or Infinity.

**Part ids that WILL exist** (AI-3 builds them; others may use these ids freely):
`coil, dynamo, ember, amplifier, compounder, overdrive, bend, switch, reverser, splitter, triplet, capacitor, counter, anvil, flywheel, battery, gambler, fuse, rectifier, tollgate` + 4 more that AI-3 invents (listed in `docs/PARTS.md`).
**Inventor ids:** `tinkerbot, clockmaker, drvolt`. **Twist ids:** `deadCell, twoDeadCells, noSplit, fewerSparks, rust, coldStart`.
A twist is `{ id, name, description, apply(machine, rng) }`. It changes the machine by adding to `blocked`, `banned`, `sparkCount`, `startValue` or `flags`.

---

## 7. Event log (what `simulate` returns and the renderer plays)

`simulate(machine, options)` returns `{ events, total, coins, banked, fizzled }`.
- `options` is optional: `{ getPart, recordEvents }`. `getPart` replaces the part lookup (for tests). `recordEvents: false` skips building the events list (much faster, used by the bot).
- `total` = sum of banked values, `coins` = coins from parts, `banked` / `fizzled` = counts of sparks.

Every event is a plain object with at least `{ n, type, spark }` (`n` = 0,1,2,... order number; `spark` = spark id 1,2,3...). Type names are constants `EVT` in `engine/eventTypes.js`:

| type | extra fields | meaning |
|------|--------------|---------|
| `spawn` | `x, y, dir, value, parent` | a spark appears (`parent` = 0 for source sparks) |
| `enter` | `x, y, dir, value` | the spark enters cell (x, y) |
| `value` | `x, y, partId, before, after, label` | a part changed the value |
| `turn` | `x, y, partId, from, to` | the direction changed |
| `split` | `x, y, partId, child, dir, value, label` | a new spark was made |
| `state` | `x, y, partId, label` | a part shows a note |
| `coins` | `x, y, partId, amount` | coins earned |
| `disable` | `x, y, partId` | a part stopped for this Fire |
| `blocked` | `x, y` | the spark hit a blocked cell |
| `bank` | `value, runningTotal` | the spark left through the right edge |
| `fizzle` | `x, y, value, reason` | reason is `'edge'`, `'blocked'` or `'steps'` |
| `end` | `total, coins` | always the LAST event |

Events hold only numbers, strings and booleans (no functions, no references), so they can be saved and replayed.

---

## 8. Files and exports (AI-1 makes a STUB for every line below in the skeleton; the owner overwrites it)

A stub starts with `// STUB: owned by AI-N. The owner will replace this whole file.`, exports the right names, and returns harmless dummy values so the app builds from minute one. **Keep these names exactly.**

| File | Exports | Owner |
|------|---------|-------|
| `src/core/events.js` | `on(name, fn)`, `off(name, fn)`, `emit(name, data)` | 1 |
| `src/core/rng.js` | `makeRng(seed)` returns a function giving 0..1; `hashString(text)` returns a number | 1 |
| `src/core/format.js` | `formatNumber(n)` | 1 |
| `src/core/loop.js` | `startLoop(callback)`, `stopLoop()`; `callback(dtSeconds)` | 1 |
| `src/core/save.js` | `loadMeta()`, `saveMeta(meta)`, `loadRun()`, `saveRun(run)`, `clearRun()`, `wipeAll()` | 1 |
| `src/platform/notifications.js` | `scheduleDailyReminder()`, `cancelReminders()` | 1 |
| `src/platform/haptics.js` | `buzz(kind)` with kind `'light'`, `'medium'`, `'heavy'` | 1 |
| `src/main.js` | (boots the app: loads save, calls `startApp()`) | 1 |
| `src/data/config.js` | `CONFIG` | 2 |
| `src/engine/eventTypes.js` | `EVT` | 2 |
| `src/engine/board.js` | `DIRS`, `rotToDir(rot)`, `dirToRot(dir)`, `stepFrom(x, y, dir)`, `makeMachine(overrides)`, `cloneMachine(machine)`, `validateMachine(machine)` (returns array of problem strings), `getCellAt(machine, x, y)`, `placePart(machine, x, y, partId, level, rot)`, `removePart(machine, x, y)` | 2 |
| `src/engine/simulate.js` | `simulate(machine, options)` | 2 |
| `src/engine/parts/index.js` | `PARTS` (id -> part), `getPart(id)`, `allPartIds()`, `partsWithTag(tag)` | 3 |
| `src/engine/twists.js` | `TWISTS` (id -> twist), `getTwist(id)`, `applyTwists(machine, twistIds, rng)` | 3 |
| `src/data/inventors.js` | `INVENTORS` (array), `getInventor(id)` | 4 |
| `src/data/shifts.js` | `SHIFT_RULES` | 4 |
| `src/data/voltage.js` | `VOLTAGES` (array), `getVoltage(level)` | 4 |
| `src/run/runState.js` | `newRun(options)`, `getTarget(run)`, `placeFromBench(run, benchIndex, x, y, rot)`, `moveOnBoard(run, fromX, fromY, toX, toY)`, `rotatePart(run, x, y)`, `returnToBench(run, x, y)`, `fire(run)`, `startNextShift(run)`, `runSummary(run)` | 4 |
| `src/run/shop.js` | `makeOffers(run)`, `buyOffer(run, index)`, `sellPart(run, where)`, `rerollOffers(run)`, `rerollPrice(run)` | 4 |
| `src/run/merge.js` | `findMerges(run)`, `applyMerges(run)` | 4 |
| `src/meta/metaState.js` | `defaultMeta()`, `repairMeta(meta)` | 5 |
| `src/meta/workshop.js` | `upgradeCost(meta, id)`, `buyUpgrade(meta, id)`, `bonusesFor(meta)` | 5 |
| `src/meta/patentBook.js` | `unlockedPartIds(meta)`, `partStatus(meta, partId)` (`'locked'`, `'new'`, `'seen'`), `markSeen(meta, partId)`, `unlockHint(partId)` | 5 |
| `src/meta/voltage.js` | `maxVoltageFor(meta, inventorId)`, `recordWin(meta, inventorId, voltage)` | 5 |
| `src/meta/achievements.js` | `checkAchievements(meta, summary)` | 5 |
| `src/meta/stats.js` | `recordRunEnd(meta, run)` returns `{ dustEarned, newAchievements, newUnlocks }` | 5 |
| `src/meta/daily.js` | `todayString()`, `dailyConfig(dateString)`, `shareCode(dateString, result)`, `hasPlayedDaily(meta, dateString)`, `recordDaily(meta, dateString, result)` | 5 |
| `src/data/achievements.js` | `ACHIEVEMENTS` | 5 |
| `src/data/workshop.js` | `WORKSHOP_UPGRADES` | 5 |
| `src/ui/screens/workshop.js`, `patentBook.js`, `daily.js`, `settings.js` | each: `mount(root, params)`, `unmount()` | 5 |
| `src/render/boardView.js` | `createBoardView(container, options)` returns a view (see below) | 6 |
| `src/render/partIcons.js` | `drawPartIcon(ctx2d, partId, x, y, size, color)`, `getPartIconUrl(partId, size, color)` (cached data URL for DOM use) | 6 |
| `src/render/theme.js` | `THEME` (colors, fonts, sizes; mirrors the palette in section 10) | 6 |
| `src/ui/ui.js` | `startApp()`, `go(screenName, params)` | 7 |
| `src/ui/screens/home.js`, `run.js`, `shop.js`, `results.js` | each: `mount(root, params)`, `unmount()` | 7 |
| `src/ui/components/button.js` | `makeButton(label, onClick, options)` returns an element | 7 |
| `src/ui/components/partCard.js` | `makePartCard(partId, options)` returns an element; options: `{ level, price, selected, compact, locked, onClick }` | 7 |
| `src/ui/components/modal.js` | `openModal(contentElement, options)` returns `{ close }` | 7 |
| `src/ui/components/toast.js` | `showToast(text)` | 7 |
| `src/ui/components/numberTicker.js` | `tickNumber(element, from, to, ms)` | 7 |
| `src/audio/audio.js` | `initAudio()` (call on the first tap), `setMuted(flag)`, `isMuted()` | 8 |
| `src/audio/sfx.js` | `playSfx(name, options)`, `playPass(step)` (rising pitch for each pass; step 0, 1, 2...) | 8 |
| `src/audio/music.js` | `startMusic()`, `stopMusic()`, `setMusicVolume(v)` | 8 |
| `src/tutorial/tutorial.js` | `shouldShowTutorial(meta)`, `startTutorial(root)` returns `{ stop() }`, `markTutorialDone(meta)`, `tutorialRun()` | 8 |

Screen names used by `go()`: `'home'`, `'run'`, `'shop'`, `'results'`, `'workshop'`, `'patentBook'`, `'daily'`, `'settings'`.
Sfx names: `tap, place, rotate, buy, sell, reroll, merge, fire, pass, bank, fizzle, win, lose, unlock, error, overload`.

**`createBoardView(container, options)`** (AI-6 builds it, AI-7 uses it). `options`: `{ onCellTap(x, y), onCellDrag(fromX, fromY, toX, toY), onEventPlayed(event) }`. The view has:
`setMachine(machine)`, `setSelectedCell(x, y)` (null to clear), `setHighlightCells(listOfXY)`, `cellAtPoint(clientX, clientY)` (returns `{x, y}` or null), `play(events, playOptions)` (returns a Promise that resolves when the animation ends; calls `onEventPlayed` for every event as it is shown), `skip()` (jump to the end), `setQuality('low' | 'medium' | 'high')`, `resize()`, `destroy()`.

**`newRun(options)`**: `{ inventorId, voltage, seed, poolIds, bonuses, daily }`. `poolIds` = parts allowed in the shop. `daily` = false or the date string. `bonuses` (from `bonusesFor(meta)`) = `{ startCoins, benchSize, shopSlots, freeRerolls, extraFires }` (all extra amounts, 0 by default).

---

## 9. Shapes of saved data

**Run** (owner AI-4; plain JSON):
```
{ v: 1, seed, inventorId, voltage, daily: false,        // or the date string
  shift: 1,                                             // 1..8
  phase: 'build',                                       // 'build' | 'shop' | 'won' | 'lost'
  coins, rerollsThisShift, firesLeft, shiftTotal,       // shiftTotal = sum of banked totals of this shift's Fires
  machine: { ...machine as in section 5 },
  bench: [ { partId, level } ],                         // owned parts that are not on the board
  offers: [ { partId, level, price, sold } ],
  poolIds: [ 'coil', ... ],
  lastFire: null,                                       // or { total, shiftTotal, target, passed, coinsEarned }
  history: [ { shift, total, target } ],
  rngState: 123 }                                       // so save/load keeps the same shop offers
```

**Meta** (owner AI-5; plain JSON):
```
{ v: 1, dust: 0,
  upgrades: { upgradeId: level },
  unlockedParts: [ ids ], seenParts: [ ids ],
  unlockedInventors: [ ids ],
  achievements: { achievementId: true },
  wins: { inventorId: { '1': true } },
  stats: { runs, wins, bestTotal, fires, partsBought },
  daily: { lastPlayed: '', best: null, streak: 0 },
  tutorialDone: false,
  settings: { sound: true, music: true, quality: 'auto', reduceMotion: false, largeText: false,
              colorblind: false, haptics: true, reminders: true } }
```

**UI events** (sent with `core/events.js emit`; AI-7 sends them, AI-8's tutorial listens): `ui:runStarted`, `ui:placed`, `ui:rotated`, `ui:fired`, `ui:fireDone`, `ui:shopOpened`, `ui:bought`, `ui:sold`, `ui:rerolled`, `ui:merged`, `ui:runEnded`. Each carries a small plain data object.
**Tutorial hooks:** AI-7 puts these attributes on the elements: `data-tut="board"`, `"bench"`, `"fire"`, `"hud"`, `"offers"`, `"reroll"`, `"continue"`.

---

## 10. Look and palette (one source of truth)

| token | hex | use |
|-------|-----|-----|
| `bg` | `#0B0E14` | page background |
| `panel` | `#141A24` | cards, board background |
| `panel2` | `#1C2432` | raised panels, buttons |
| `line` | `#2A3446` | grid lines, idle traces |
| `text` | `#E8EDF5` | main text |
| `textDim` | `#8A97AD` | secondary text |
| `spark` | `#FFC857` | the spark, main accent |
| `sparkHot` | `#FFF1C2` | spark core, big numbers |
| `accent` | `#4FD1C5` | buttons, links, selection |
| `good` | `#7BE495` | success |
| `bad` | `#FF6B6B` | failure |
| `common` | `#9FB3C8` | common rarity |
| `rare` | `#5AA9FF` | rare rarity |
| `legendary` | `#C77DFF` | legendary rarity |

Tag colors for part icons: add = `spark`, mult = `accent`, route = `#8A97AD`, split = `#5AA9FF`, state = `#C77DFF`, boost = `#7BE495`, risk = `#FF6B6B`, economy = `#FFD166`.
Never rely on color alone: rarity also shows as a border style and a text label; tags also show as a small icon shape.
Layout: portrait phone first (design for 360 x 740). On a laptop the game is a centered column, max 480 px wide, full height. Respect safe-area insets. Large tap targets (at least 44 px). Numbers use tabular figures so counters do not jitter.
Accessibility settings (in `meta.settings`) must be honored everywhere: `reduceMotion` (no shake, fewer particles, shorter animations), `largeText`, `colorblind`, `sound`, `music`, `haptics`.

---

## 11. Reporting and "done"

- Keep your notes file `docs/notes/AI-N.md` up to date at EVERY push. Sections: **Done**, **Working on**, **Blocked / Questions for manager**, **Changes I need from other AIs** (say which AI and exactly what).
- A task is DONE only when: (1) your logic has tests and `npm test` passes; (2) `npm run build` passes; (3) you edited no file you do not own; (4) `git grep -i github_pat` prints nothing; (5) your notes file is updated; (6) it is pushed and CI is green.
- Stages: **Stage 0** skeleton (AI-1) -> **Stage 1** your core files, pushed in small steps -> **Stage 2** fixes after the manager's review -> **Stage 3** polish and balance.
- If you are blocked, do NOT wait silently and do NOT edit someone else's file. Write the question in your notes file, build against the contract, and move to your next item.


---

## 12. AMENDMENTS v1.1 (added by the manager, 2026-11-10; these override anything above)

**Engine (AI-2 decisions, now official)**
1. Split order: first-in-first-out per source spark. A source spark runs, then its children, then their children, and only then the next source spark. Spark ids follow creation order.
2. A spark fizzles when `steps > CONFIG.maxSteps` (60).
3. Source sparks always get a slot: splits stop early enough to leave room for source sparks that are not born yet. Total sparks stay at 120 or fewer.
4. If a part's `onPass` throws, the effects it already had stay and the rest is skipped. The result has an extra field `errors` (a count).
5. `fizzle` with reason `'edge'` reports `x, y` = the LAST cell inside the board (so the renderer can draw it at the edge). The `end` event has `spark: 0`.
6. `ctx` is one reused object per `simulate` call. Parts must never keep a reference to it.
7. `ctx.addCoins(n)`: ignored unless `n` is a finite number above 0; it is floored to a whole number. Coins are never negative or fractional.
8. NEW: a spark may enter the same cell at most `CONFIG.maxVisitsPerCell` (4) times. The next entry makes it fizzle with reason `'steps'`. This stops closed loops from stacking a part to 1e100.
9. `ctx.fire.partsOnBoard` = placed parts that are not banned and have a known part id (parts on blocked cells still count). It is fixed at the start of the Fire.

**Run shape (AI-4)**
10. The run also has `pendingCoins` (coins from parts during this shift), `bestFire` (best single Fire total so far) and `bonuses` (the object given to `newRun`). `tutorial: true` may be present on a tutorial run.
11. Rerolls: the first `freeRerolls` rerolls of a shift are free. After that the PAID price restarts: price = `rerollStartPrice + rerollStep * (rerolls paid so far this shift)`.
12. An inventor's `passive` REPLACES the field value (it is not added), except `benchSize` and `shopSlots`, which are added.
13. `sellPart(run, where)`: `where` is `{ kind: 'bench', index }` or `{ kind: 'board', x, y }`. Failed actions return `{ ok: false, reason }` and change nothing.

**Process**
14. Manager messages live in `docs/manager/`. Read your file `docs/manager/to-AI-N.md` after every pull.
15. CI scans for the real token SHAPE (`github_pat_` followed by 20 or more token characters), not the bare prefix, because the contract text mentions the prefix. Confirmed by the manager.

**Cheat menu (added by the manager, owner AI-2)**
16. A hidden cheat menu exists in `src/cheats/*` (owner AI-2). Any cheat that changes or reads a run sets `run.cheated = true`. Any meta cheat sets `meta.cheatsUsed = true`. A run with `cheated: true` earns NOTHING: no Spark Dust, no achievements, no win records, no daily result, no stats.
17. After a cheat changes something, it saves (`saveRun` / `saveCurrentMeta`) and sends the event `cheat:changed` with `{ what }` through `core/events.js`. Run and shop screens must refresh when they get it.
18. `src/ui/ui.js` also exports `getCurrentRun()`: the live run object that the run and shop screens use (or `null`). Cheats change that object directly.
19. A run may have an optional `targetMultiplier` (number, default 1). `getTarget(run)` multiplies by it.
20. The event `cheat:speed` with `{ speed }` (0.25, 1, 2, 4, or 'instant') sets the Fire animation speed. The run screen passes it to `view.play`.

**Beginner and content round (added by the manager, 2026-11-11; read `docs/manager/BEGINNER_REVIEW.md`)**
21. Part files get two OPTIONAL fields (owner AI-3): `describe(level, rot)` may use the second argument to name the direction in words ("down", "up"...) for directional parts, and `example(level)` returns `{ before, after }` (two numbers, for a sample spark) or `null` when a number example makes no sense (for example Bend). The UI shows "before -> after" next to the text.
22. `ctx` gets four new read-only fields (owner AI-2): `ctx.x`, `ctx.y` (the cell of this part) and `ctx.cols`, `ctx.rows` (board size). This allows parts that depend on position.
23. The machine gets an optional list `bonusCells: [ { x, y, kind, amount } ]` (owner AI-2). `kind` is `'add'` or `'mult'`. When a spark ENTERS such a cell it gets the bonus, even if the cell has no part (an empty cell works too). If the cell has a part, the part runs first, then the bonus. AI-2 documents the new event in `docs/ENGINE.md`; AI-6 draws bonus cells as glowing floor tiles and plays the event.
24. The run gets a flag `gentle` (boolean, owner AI-4, inside `bonuses`): +1 Fire per shift, targets x0.7, +4 start coins, path preview always on. A gentle run: dust x0.5, no win record, no Voltage unlock, no daily (owner AI-5 for the meta side). Home has a "Gentle mode" switch (owner AI-7).
25. Path preview (owner AI-7 and AI-6): while building, the run screen calls `simulate(machine, { recordEvents: true })` and gives the list of cells the SOURCE sparks entered to `view.setPreview(cells)`. It shows the PATH only, never the numbers, so the player still has to Fire to learn the result. Setting "Show path" (default ON for the first 3 runs and in gentle mode).
26. New events on `core/events.js` (owner AI-7 unless stated): `ui:howToOpen`, `ui:hintUsed` with `{ left }`, `ui:previewToggled` with `{ on }`.
27. `src/tutorial/` also holds the Hint helper `suggest.js` (owner AI-8): `suggestPlacement(run, deps)` returns `{ partIndex, x, y, rot }` or `null`. Pure function, uses `simulate`, under 150 lines, under 20 ms on a phone for a 5x4 board.
