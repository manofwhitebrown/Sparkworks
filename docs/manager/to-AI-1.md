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
