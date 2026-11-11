// Cheats that change the saved meta (dust, unlocks, tutorial, daily) and the safety net:
// a snapshot to undo with, and export / import of the save as text.
// Each cheat returns { ok, msg } and marks meta.cheatsUsed = true. No DOM here.
// Owner: AI-2

import { allPartIds } from '../engine/parts/index.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { VOLTAGES } from '../data/voltage.js';
import { INVENTOR_IDS, repairMeta } from '../meta/metaState.js';
import { validateMachine } from '../engine/board.js';

const MAX_DUST = 1e12;

function done(meta, msg) {
  meta.cheatsUsed = true;
  return { ok: true, msg: msg || 'Done' };
}

export function addDust(meta, amount) {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return { ok: false, msg: 'Not a number' };
  }
  meta.dust = Math.min(MAX_DUST, Math.max(0, Math.floor(meta.dust + amount)));
  return done(meta);
}

export function unlockAllParts(meta) {
  meta.unlockedParts = allPartIds().slice();
  return done(meta, 'All parts unlocked');
}

export function unlockAllInventors(meta) {
  meta.unlockedInventors = INVENTOR_IDS.slice();
  return done(meta, 'All inventors unlocked');
}

// Winning at voltage V opens V + 1, so winning 1 .. (count - 1) opens every voltage.
export function maxAllVoltages(meta) {
  for (let i = 0; i < INVENTOR_IDS.length; i++) {
    const id = INVENTOR_IDS[i];
    meta.wins[id] = {};
    for (let v = 1; v < VOLTAGES.length; v++) {
      meta.wins[id][String(v)] = true;
    }
  }
  return done(meta, 'Every voltage is open');
}

// Marks them done only. Their rewards are NOT paid (unlock-all covers parts and inventors).
export function completeAllAchievements(meta) {
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    meta.achievements[ACHIEVEMENTS[i].id] = true;
  }
  return done(meta, 'All achievements marked done');
}

export function markAllSeen(meta) {
  meta.seenParts = allPartIds().slice();
  return done(meta, 'All parts seen');
}

export function resetTutorial(meta) {
  meta.tutorialDone = false;
  return done(meta, 'Tutorial will show again');
}

export function allowDailyAgain(meta) {
  meta.daily.lastPlayed = '';
  return done(meta, 'Daily contract is open again');
}

// ---------- safety net ----------

function copyData(data) {
  return JSON.parse(JSON.stringify(data));
}

export function takeSnapshot(meta) {
  return copyData(meta);
}

// The app holds ONE meta object, so we change it in place instead of replacing it.
function replaceInPlace(target, source) {
  const keys = Object.keys(target);
  for (let i = 0; i < keys.length; i++) {
    delete target[keys[i]];
  }
  const fresh = copyData(source);
  const names = Object.keys(fresh);
  for (let j = 0; j < names.length; j++) {
    target[names[j]] = fresh[names[j]];
  }
}

export function restoreSnapshot(meta, snapshot) {
  if (!snapshot) {
    return { ok: false, msg: 'No snapshot yet' };
  }
  replaceInPlace(meta, snapshot);
  return { ok: true, msg: 'Meta restored' };
}

export function exportSave(meta, run) {
  return JSON.stringify({ sparkworksSave: 1, meta: meta, run: run || null });
}

// Returns { ok, msg, run } where run is the run to save (or null). Changes meta only when
// the whole text is good.
export function importSave(text, meta) {
  let parsed = null;
  try {
    parsed = JSON.parse(String(text));
  } catch (err) {
    return { ok: false, msg: 'That is not valid save text' };
  }
  if (!parsed || parsed.sparkworksSave !== 1 || typeof parsed.meta !== 'object' || parsed.meta === null) {
    return { ok: false, msg: 'That is not a Sparkworks save' };
  }
  const run = parsed.run;
  if (run !== null && !isGoodRun(run)) {
    return { ok: false, msg: 'The run in the save is damaged' };
  }
  replaceInPlace(meta, repairMeta(parsed.meta));
  return { ok: true, msg: 'Save restored', run: run };
}

function isGoodRun(run) {
  if (typeof run !== 'object' || run === null || !run.machine || !Array.isArray(run.bench)) {
    return false;
  }
  return validateMachine(run.machine).length === 0;
}
