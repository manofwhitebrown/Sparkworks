// Runs every achievement that is not done yet, marks new ones, applies their rewards.
// Owner: AI-5
import { ACHIEVEMENTS } from '../data/achievements.js';

// Fill missing summary fields so a check never reads undefined.
export function normalizeSummary(summary) {
  const s = summary && typeof summary === 'object' ? summary : {};
  return {
    won: s.won === true,
    shiftReached: typeof s.shiftReached === 'number' ? s.shiftReached : 1,
    shiftsCleared: typeof s.shiftsCleared === 'number' ? s.shiftsCleared : 0,
    voltage: typeof s.voltage === 'number' ? s.voltage : 1,
    inventorId: typeof s.inventorId === 'string' ? s.inventorId : '',
    gentle: s.gentle === true,
    daily: s.gentle === true ? false : (s.daily ? s.daily : false),
    bestFire: typeof s.bestFire === 'number' ? s.bestFire : 0,
    totalBanked: typeof s.totalBanked === 'number' ? s.totalBanked : 0,
    partsOwned: Array.isArray(s.partsOwned) ? s.partsOwned : [],
    coinsLeft: typeof s.coinsLeft === 'number' ? s.coinsLeft : 0,
    partLevels: Array.isArray(s.partLevels) ? s.partLevels : []
  };
}

function applyReward(meta, reward) {
  if (!reward) return;
  if (reward.type === 'part' && meta.unlockedParts.indexOf(reward.id) === -1) {
    meta.unlockedParts.push(reward.id);
  } else if (reward.type === 'inventor' && meta.unlockedInventors.indexOf(reward.id) === -1) {
    meta.unlockedInventors.push(reward.id);
  } else if (reward.type === 'dust') {
    meta.dust += reward.amount;
  }
}

function passes(achievement, meta, summary) {
  try {
    return achievement.check(meta, summary) === true;
  } catch (e) {
    return false;
  }
}

// Returns [{ id, name, description, reward }] for achievements unlocked just now.
export function checkAchievements(meta, summary, deps) {
  const list = deps && deps.achievements ? deps.achievements : ACHIEVEMENTS;
  const s = normalizeSummary(summary);
  const fresh = [];
  for (let i = 0; i < list.length; i++) {
    const a = list[i];
    if (meta.achievements[a.id] === true) continue;
    if (!passes(a, meta, s)) continue;
    meta.achievements[a.id] = true;
    applyReward(meta, a.reward);
    fresh.push({ id: a.id, name: a.name, description: a.description, reward: a.reward });
  }
  return fresh;
}
