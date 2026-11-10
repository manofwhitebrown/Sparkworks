// Workshop logic: price of the next level, buying, and the bonuses a new run gets.
// All functions change the meta object they are given; the caller saves it.
// Owner: AI-5
import { WORKSHOP_UPGRADES } from '../data/workshop.js';

function findUpgrade(id) {
  for (let i = 0; i < WORKSHOP_UPGRADES.length; i++) {
    if (WORKSHOP_UPGRADES[i].id === id) return WORKSHOP_UPGRADES[i];
  }
  return null;
}

export function upgradeLevel(meta, id) {
  const level = meta.upgrades ? meta.upgrades[id] : 0;
  return typeof level === 'number' ? level : 0;
}

// Price of the NEXT level, or null when maxed (or unknown id).
export function upgradeCost(meta, id) {
  const upgrade = findUpgrade(id);
  if (!upgrade) return null;
  const level = upgradeLevel(meta, id);
  if (level >= upgrade.maxLevel) return null;
  return upgrade.costs[level];
}

export function buyUpgrade(meta, id) {
  const upgrade = findUpgrade(id);
  if (!upgrade) return { ok: false, reason: 'unknown' };
  const cost = upgradeCost(meta, id);
  if (cost === null) return { ok: false, reason: 'maxed' };
  if (meta.dust < cost) return { ok: false, reason: 'poor' };
  meta.dust -= cost;
  meta.upgrades[id] = upgradeLevel(meta, id) + 1;
  return { ok: true, reason: '' };
}

// What newRun expects. dustBoost is NOT here (stats.js uses it).
export function bonusesFor(meta) {
  return {
    startCoins: upgradeLevel(meta, 'startCoins'),
    benchSize: upgradeLevel(meta, 'benchSize'),
    shopSlots: upgradeLevel(meta, 'shopSlots'),
    freeRerolls: upgradeLevel(meta, 'freeRerolls'),
    extraFires: upgradeLevel(meta, 'extraFires')
  };
}
