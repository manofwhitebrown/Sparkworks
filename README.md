# Sparkworks

A puzzle-roguelite for phone (portrait) and laptop browser. Build a small machine out of parts,
press **FIRE**, and watch three sparks walk through it. Every part changes the spark. Sparks that leave
through the right edge are banked. Reach the shift target to clear the shift. A run is 8 shifts.

## Commands

```bash
npm install     # once
npm run dev     # play in the browser (hot reload)
npm test        # run all tests
npm run build   # build the game into dist/
```

Needs Node 22 or newer.

## Play and download

- **Play online:** GitHub Pages, `https://manofwhitebrown.github.io/Sparkworks/` (updated on every push to `main`).
  One-time setup by the owner: repo **Settings > Pages > Build and deployment > Source = "GitHub Actions"**.
- **Android APK:** repo **Actions** tab > the latest "Android APK" run > **Artifacts** > `sparkworks-debug-apk`.
  Details and signing: [docs/ANDROID.md](docs/ANDROID.md).

## Folder map

| Folder / file | What is inside | Owner |
|---|---|---|
| `package.json`, `vite.config.js`, `index.html`, `capacitor.config.json`, `.github/`, `android/` | build, CI, Android | AI-1 |
| `src/main.js`, `src/core/`, `src/platform/` | boot, events, rng, save, loop, notifications, haptics | AI-1 |
| `src/data/config.js`, `src/engine/board.js`, `eventTypes.js`, `simulate.js` | the spark engine | AI-2 |
| `src/engine/parts/`, `src/engine/twists.js` | all parts and rule twists | AI-3 |
| `src/run/`, `src/data/shifts.js`, `inventors.js`, `voltage.js` | run loop, shop, difficulty | AI-4 |
| `src/meta/`, workshop / patent book / daily / settings screens | progress kept between runs | AI-5 |
| `src/render/`, `dev/` | board drawing and effects | AI-6 |
| `src/ui/` (shell, home, run, shop, results, components, styles) | main screens and design system | AI-7 |
| `src/audio/`, `src/tutorial/` (also the Hint helper `suggest.js`), `tools/`, `tests/integration-*` | sound, tutorial, hints, bot, QA | AI-8 |
| `docs/WORDS.md` | the one list of words the whole game uses (what to say, what never to say) | AI-8 |
| `src/cheats/`, `tests/cheats-*` | hidden cheat menu (cheated runs earn nothing) | AI-2 |
| `docs/CONTRACT.md` | the shared contract every AI follows | AI-1 (manager edits) |
| `docs/notes/AI-N.md` | each AI's progress notes | each AI |
| `docs/manager/` | messages and status from the manager, including `BEGINNER_REVIEW.md` (read-only for the AIs) | manager |

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the layers fit together.
