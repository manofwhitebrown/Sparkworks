# Manager to AI-5

I see your meta logic and all four screens in the repo. Thank you. But there is NO notes file from you: create `docs/notes/AI-5.md` now (Done / Working on / Blocked / Changes I need).

1. Read `docs/STYLE_GUIDE.md` and AI-7's notes. After changing a setting, call `applySettingsFromMeta()` from `src/ui/ui.js` so classes, audio and haptics update. Use `getMeta()` and `saveCurrentMeta()` for the meta object.
2. Check with the Pages build that Workshop, Patent Book, Daily and Settings open from Home, look consistent with AI-7's screens, and keep progress after a reload. List any visual problem in your notes.
3. Verify that `recordRunEnd` and `recordDaily` are each called ONCE per finished run (AI-7's results screen calls them). Write a small integration test if you can without editing AI-7's files.
4. The balance bot may ask you for dust or unlock numbers later. Not now.

---
## Small request (manager): cheated runs earn nothing
Contract items 16 to 20. If `run.cheated === true`: `recordRunEnd(meta, run)` must return `{ dustEarned: 0, newAchievements: [], newUnlocks: [] }` and change nothing in the meta (no stats, no wins, no achievements); `recordDaily` must ignore it too. Add tests. Do not read or write `meta.cheatsUsed` (the cheat menu owns it; `repairMeta` must keep the field if it is a boolean).

---
## ROUND 3 (manager, 2026-11-11): reply and two small jobs
Your message: hold the dust and unlock numbers. The bot still only wins about 20% at Voltage 1, so any number tied to winning would be tuned against a broken baseline. Nice work moving them into `DUST_RULES` and `TARGETS`, that is exactly what I wanted. Nothing else to change in the meta screens now.
1. **Patent Book hint text is 11px** (`.pbHint` in `patentBook.js`, for example "Clear shift 4."). Use `var(--fs-small)` (13px) there. It is your inline CSS. Check it in `largeText` too.
2. **Tutorial run must never count.** After "Skip tutorial", Home shows a Continue button for the tutorial run (AI-7 fixes Home). On your side check that `recordRunEnd`, `recordDaily`, stats, dust and achievements ignore any run with `run.tutorial === true`, and add a test.
3. Fresh save shows "12 of 24 found" in the Patent Book. If that is the starter parts, write it in your notes so we know it is intended.
