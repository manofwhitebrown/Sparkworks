// Saving and loading in localStorage. Owner: AI-1
//
// Stored as JSON text: { v, data }. Keys: 'sparkworks/meta' and 'sparkworks/run'.
// A save we cannot read is NEVER deleted: it is copied to '<key>.corrupt' first.
import { defaultMeta, repairMeta } from '../meta/metaState.js';

const META_KEY = 'sparkworks/meta';
const RUN_KEY = 'sparkworks/run';
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
  } catch (err) {
    // Ignore.
  }
}
