// The saved meta object: a fresh one, and a repair function that accepts anything.
// Owner: AI-5
import { allPartIds } from '../engine/parts/index.js';
import { WORKSHOP_UPGRADES } from '../data/workshop.js';

export const STARTING_PARTS = [
  'coil', 'amplifier', 'bend', 'switch', 'splitter', 'battery',
  'anvil', 'counter', 'gambler', 'capacitor', 'dynamo', 'tollgate'
];
export const INVENTOR_IDS = ['tinkerbot', 'clockmaker', 'drvolt'];
const QUALITIES = ['auto', 'low', 'medium', 'high'];
const BOOLEAN_SETTINGS = ['sound', 'music', 'reduceMotion', 'largeText', 'colorblind', 'haptics', 'reminders'];

export function defaultMeta() {
  return {
    v: 1,
    dust: 0,
    upgrades: {},
    unlockedParts: STARTING_PARTS.slice(),
    // Starting parts count as seen, so only freshly unlocked parts show a NEW badge.
    seenParts: STARTING_PARTS.slice(),
    unlockedInventors: ['tinkerbot'],
    achievements: {},
    wins: {},
    stats: { runs: 0, wins: 0, bestTotal: 0, fires: 0, partsBought: 0 },
    daily: { lastPlayed: '', best: null, streak: 0 },
    tutorialDone: false,
    settings: {
      sound: true, music: true, quality: 'auto', reduceMotion: false, largeText: false,
      colorblind: false, haptics: true, reminders: true
    }
  };
}

function isObject(x) {
  return typeof x === 'object' && x !== null && !Array.isArray(x);
}

function cleanNumber(x, fallback, min, max) {
  if (typeof x !== 'number' || !isFinite(x)) return fallback;
  if (x < min) return min;
  if (x > max) return max;
  return x;
}

// Keep only ids that are strings, appear once, and pass the filter.
function cleanIdList(list, isKnown) {
  const out = [];
  if (!Array.isArray(list)) return out;
  for (let i = 0; i < list.length; i++) {
    const id = list[i];
    if (typeof id === 'string' && isKnown(id) && out.indexOf(id) === -1) out.push(id);
  }
  return out;
}

function knownPartFilter(deps) {
  let known = [];
  try {
    known = deps && deps.allPartIds ? deps.allPartIds() : allPartIds();
  } catch (e) {
    known = [];
  }
  // An empty list means the part library is not ready: do not wipe the player's parts.
  if (!Array.isArray(known) || known.length === 0) return function () { return true; };
  return function (id) { return known.indexOf(id) !== -1; };
}

function repairUpgrades(raw) {
  const out = {};
  if (!isObject(raw)) return out;
  for (let i = 0; i < WORKSHOP_UPGRADES.length; i++) {
    const u = WORKSHOP_UPGRADES[i];
    const level = Math.floor(cleanNumber(raw[u.id], 0, 0, u.maxLevel));
    if (level > 0) out[u.id] = level;
  }
  return out;
}

function repairWins(raw) {
  const out = {};
  if (!isObject(raw)) return out;
  for (let i = 0; i < INVENTOR_IDS.length; i++) {
    const wins = raw[INVENTOR_IDS[i]];
    if (!isObject(wins)) continue;
    out[INVENTOR_IDS[i]] = {};
    for (const key in wins) {
      const v = Number(key);
      if (wins[key] === true && Number.isInteger(v) && v >= 1 && v <= 99) out[INVENTOR_IDS[i]][String(v)] = true;
    }
  }
  return out;
}

function repairDaily(raw) {
  const out = { lastPlayed: '', best: null, streak: 0 };
  if (!isObject(raw)) return out;
  if (typeof raw.lastPlayed === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastPlayed)) out.lastPlayed = raw.lastPlayed;
  out.streak = Math.floor(cleanNumber(raw.streak, 0, 0, 100000));
  if (isObject(raw.best)) {
    out.best = {
      won: raw.best.won === true,
      shiftReached: Math.floor(cleanNumber(raw.best.shiftReached, 1, 1, 8)),
      bestFire: cleanNumber(raw.best.bestFire, 0, 0, 1e300)
    };
  }
  return out;
}

function repairSettings(raw) {
  const out = defaultMeta().settings;
  if (!isObject(raw)) return out;
  for (let i = 0; i < BOOLEAN_SETTINGS.length; i++) {
    const key = BOOLEAN_SETTINGS[i];
    if (typeof raw[key] === 'boolean') out[key] = raw[key];
  }
  if (QUALITIES.indexOf(raw.quality) !== -1) out.quality = raw.quality;
  return out;
}

function repairStats(raw) {
  const s = isObject(raw) ? raw : {};
  return {
    runs: Math.floor(cleanNumber(s.runs, 0, 0, 1e9)),
    wins: Math.floor(cleanNumber(s.wins, 0, 0, 1e9)),
    bestTotal: cleanNumber(s.bestTotal, 0, 0, 1e300),
    fires: Math.floor(cleanNumber(s.fires, 0, 0, 1e9)),
    partsBought: Math.floor(cleanNumber(s.partsBought, 0, 0, 1e9))
  };
}

// Takes anything (undefined, old, damaged) and returns a valid meta. Never throws.
export function repairMeta(meta, deps) {
  const base = defaultMeta();
  try {
    const m = isObject(meta) ? meta : {};
    const isKnownPart = knownPartFilter(deps);
    base.dust = Math.floor(cleanNumber(m.dust, 0, 0, 1e12));
    base.upgrades = repairUpgrades(m.upgrades);
    const unlocked = cleanIdList(m.unlockedParts, isKnownPart);
    for (let i = 0; i < STARTING_PARTS.length; i++) {
      if (unlocked.indexOf(STARTING_PARTS[i]) === -1) unlocked.push(STARTING_PARTS[i]);
    }
    base.unlockedParts = unlocked;
    base.seenParts = Array.isArray(m.seenParts) ? cleanIdList(m.seenParts, isKnownPart) : STARTING_PARTS.slice();
    const inventors = cleanIdList(m.unlockedInventors, function (id) { return INVENTOR_IDS.indexOf(id) !== -1; });
    if (inventors.indexOf('tinkerbot') === -1) inventors.unshift('tinkerbot');
    base.unlockedInventors = inventors;
    if (isObject(m.achievements)) {
      for (const key in m.achievements) {
        if (m.achievements[key] === true) base.achievements[key] = true;
      }
    }
    base.wins = repairWins(m.wins);
    base.stats = repairStats(m.stats);
    base.daily = repairDaily(m.daily);
    base.tutorialDone = m.tutorialDone === true;
    base.settings = repairSettings(m.settings);
  } catch (e) {
    return defaultMeta();
  }
  return base;
}
