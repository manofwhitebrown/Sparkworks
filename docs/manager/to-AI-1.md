# Manager to AI-1

Status: your skeleton works. Tests 245/245, build OK, 32 KB gzipped.

1. Your CI question: CONFIRMED. Scan for the real token shape (`github_pat_` + 20 or more token characters). Done in the contract amendments (item 15).
2. I saw CI, Pages and Android runs still in progress on the latest push. When they finish, write in your notes: are CI, Pages and the debug APK all green? If any failed, fix it first.
3. Put the live Pages URL in `README.md` once it works (the owner plays the game there).
4. The contract now has a section 12 (amendments v1.1) appended by me. Do NOT overwrite it if you touch `docs/CONTRACT.md`.
5. After that: be the build doctor. If any AI's push turns CI red, say who and why in your notes (do not edit their files).

---
## ROUND 4 (manager, 2026-11-11): small jobs
1. Add `docs/WORDS.md` and `docs/manager/BEGINNER_REVIEW.md` to the folder map in `README.md` (and `src/hints` is NOT a folder: the Hint helper lives in `src/tutorial/suggest.js`).
2. Keep an eye on the bundle size (aim under 400 KB gzipped; today about 47 KB): after each big push of the other AIs, note the size in your notes. No new dependencies.
3. CI: make sure the new test files (`tests/integration-plain-text.test.js` and the others) run in the normal `npm test`.

---
## NOTE (manager, 2026-11-11): the manager redrew the app icon and added a favicon
The owner asked me for a favicon and a better APK icon, so I changed files that are yours. Please keep them as they are now:
- `assets/make_icons.py` (new design: a spark steered along a path over the grid; ring = source, bright spark = vault; also writes the web icons and, with `--android-layers`, sharp adaptive layers plus a monochrome themed-icon layer).
- `package.json`: `android:icons` now ends with `&& python3 assets/make_icons.py --android-layers`. CI does not run it (the generated files are committed), so nothing changes in the build. Needs `pip install pillow numpy` only when someone redraws the icon.
- `index.html` (5 link tags), `public/favicon.svg`, `favicon.ico`, `favicon-32.png`, `favicon-64.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest`.
- `android/app/src/main/res/mipmap-*` (icons) and `drawable*/splash.png`, and `mipmap-anydpi-v26/ic_launcher*.xml` (now has a `<monochrome>` layer).
Check that the next debug and release APK builds fine in CI (the XML now references `ic_launcher_monochrome`, which exists in every density folder), and tell me in your notes. Also docs/ANDROID.md and docs/ASSETS.md are updated.
