// Saving and loading in localStorage. Owner: AI-1
//
// Stored as JSON text: { v, data }. Keys: 'sparkworks/meta', 'sparkworks/run' and
// 'sparkworks/flags' (tiny yes/no memory for UI tips, kept apart from the meta save).
// A save we cannot read is NEVER deleted: it is copied to '<key>.corrupt' first.
import { defaultMeta, repairMeta } from '../meta/metaState.js';

const META_KEY = 'sparkworks/meta';
const RUN_KEY = 'sparkworks/run';
const FLAGS_KEY = 'sparkworks/flags';
const SAVE_VERSION = 1;

// localStorage can throw (private mode, storage full), so every access is guarded.
function getStorage() {
  try {
    return globalThis.localStorage || null;
  } catch (err) {
    return null;
  }
}

function writeKey(key, data) {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, JSON.stringify({ v: SAVE_VERSION, data: data }));
    return true;
  } catch (err) {
    return false;
  }
}

// Keep the unreadable text so the owner can still recover it by hand.
function moveToCorrupt(storage, key, text) {
  try {
    storage.setItem(key + '.corrupt', text);
    storage.removeItem(key);
  } catch (err) {
    // Nothing more we can do.
  }
}

// Returns the saved data, or null when there is nothing (or nothing readable).
function readKey(key) {
  const storage = getStorage();
  if (!storage) return null;
  let text = null;
  try {
    text = storage.getItem(key);
  } catch (err) {
    return null;
  }
  if (text === null || text === undefined) return null;
  let parsed = null;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    parsed = null;
  }
  const good = parsed && typeof parsed === 'object' && typeof parsed.v === 'number' && parsed.data;
  if (!good) {
    moveToCorrupt(storage, key, text);
    return null;
  }
  return parsed.data;
}

export function loadMeta() {
  const data = readKey(META_KEY);
  if (!data) return defaultMeta();
  return repairMeta(data);
}

export function saveMeta(meta) {
  return writeKey(META_KEY, meta);
}

export function loadRun() {
  return readKey(RUN_KEY);
}

export function saveRun(run) {
  return writeKey(RUN_KEY, run);
}

export function clearRun() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(RUN_KEY);
  } catch (err) {
    // Ignore.
  }
}

export function wipeAll() {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(META_KEY);
    storage.removeItem(RUN_KEY);
    storage.removeItem(FLAGS_KEY);
  } catch (err) {
    // Ignore.
  }
}

// ---------- tip flags ----------
// A tiny object like { shopTip: true } that remembers which hints the player has seen.
// It is separate from the meta save on purpose: the meta repair code only keeps fields it knows.
function readFlags() {
  const data = readKey(FLAGS_KEY);
  return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
}

export function getFlag(name) {
  return readFlags()[name];
}

export function setFlag(name, value) {
  const flags = readFlags();
  flags[name] = value;
  return writeKey(FLAGS_KEY, flags);
}
