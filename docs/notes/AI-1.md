# Notes: AI-1 (Foundation and DevOps)

## Done
- **Skeleton (Stage 0)** pushed first: package.json, vite config, index.html, .gitignore, a stub for every file in contract
  section 8, docs/CONTRACT.md (token replaced by a placeholder), README.md. Where AI-2/3/4/6 had already pushed real files,
  their versions were kept.
- **Core (Part B)**: events, rng (mulberry32 + FNV-1a hashString), format, loop, save, with tests (`tests/core-*.test.js`).
- **Platform**: notifications (daily 10:00 reminder, quiet hours, nothing in a browser), haptics.
- **main.js** (50 lines): loads meta, starts the one loop, red error bar, save hooks, calls `startApp()`.
- **docs/ARCHITECTURE.md**, **docs/ANDROID.md**.
- **CI/CD (Part C)**:
  - `ci.yml`: secret scan, `npm ci`, `npm test`, `npm run build`. GREEN.
  - `pages.yml`: deploy to GitHub Pages on every push to main. Deploy workflow succeeded. Site: https://manofwhitebrown.github.io/Sparkworks/
  - `android.yml`: debug APK on every push to main, artifact `sparkworks-debug-apk` (about 4.3 MB). BUILT AND UPLOADED.
    Signed release APK on a tag like `v0.1.0` (needs the 4 ANDROID_* secrets, see docs/ANDROID.md).
  - Capacitor Android project committed (`com.sparkworks.game`, portrait only, debug build installs next to release),
    amber-spark icon and splash made by `assets/make_icons.py`.
- **Exit test**: `npm ci`, `npm test` (273 pass), `npm run build`, `npm run dev` all fine on the latest main. CI green.

## Working on
- Integration helper: watching CI after each push. Nothing broken right now.

## Blocked / Questions for manager
1. **Secret scan shape.** The contract says CI should fail if `git grep -i` finds the token prefix. docs/CONTRACT.md itself
   contains that prefix (it is contract text), so a bare search always fails. CI scans for the real token SHAPE instead
   (prefix + 20 or more token characters). Please confirm this is fine. Note: for the same reason, the per-push check
   `git diff --cached | grep -i <prefix>` will only print something if someone touches CONTRACT.md.
2. **`core:flush` event.** The brief says main.js saves on page hide. But main.js does not own the live meta/run (the screens do), and
   saving its own older copy could erase newer progress. So main.js emits `core:flush` on `visibilitychange` (hidden) and
   `pagehide`. AI-7 (and whoever holds live run/meta state) should call `saveMeta` / `saveRun` when they hear it:
   `on('core:flush', () => { saveMeta(meta); saveRun(run); })`.
3. **Loop callbacks.** `startLoop(cb)` accepts several different callbacks (still ONE requestAnimationFrame); the same callback
   twice is ignored; `stopLoop()` stops everything. main.js also emits `core:frame` (with `dt`) so anyone can use
   `on('core:frame', fn)` instead.
4. **Pages via API.** I tried to turn on Pages from the API: the token is not allowed to (fine, it was already on).

## Changes I need from other AIs
- None right now.

## Things I fixed outside my files (tell the owners)
- **CI was red** because `src/ui/ui.js` (AI-7) imports `.css` files and a test (AI-8's tutorial test) reached it through
  `tutorial.js`; Node cannot import `.css`. I did NOT touch their files. Instead `npm test` now runs with a tiny loader
  (`tests/core-css-hooks.mjs`) that treats `.css` imports as empty modules, so any test may import UI code. AI-8 also made
  the tutorial import lazy, which is fine too.

## One-time setup for the owner
- Pages: Settings > Pages > Source = "GitHub Actions" (already done, deploys work).
- Release signing (only when you want a signed APK): add the 4 `ANDROID_*` secrets, see docs/ANDROID.md, then `git tag v0.1.0 && git push origin v0.1.0`.
- Rotate the GitHub token when the build phase is over (it was shared in a hand-off file).
