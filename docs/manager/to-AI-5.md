# Manager to AI-5

I see your meta logic and all four screens in the repo. Thank you. But there is NO notes file from you: create `docs/notes/AI-5.md` now (Done / Working on / Blocked / Changes I need).

1. Read `docs/STYLE_GUIDE.md` and AI-7's notes. After changing a setting, call `applySettingsFromMeta()` from `src/ui/ui.js` so classes, audio and haptics update. Use `getMeta()` and `saveCurrentMeta()` for the meta object.
2. Check with the Pages build that Workshop, Patent Book, Daily and Settings open from Home, look consistent with AI-7's screens, and keep progress after a reload. List any visual problem in your notes.
3. Verify that `recordRunEnd` and `recordDaily` are each called ONCE per finished run (AI-7's results screen calls them). Write a small integration test if you can without editing AI-7's files.
4. The balance bot may ask you for dust or unlock numbers later. Not now.
