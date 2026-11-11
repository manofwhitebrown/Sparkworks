// Facts for the loss screen: how much was needed, how close the best Fire was, and one tip.
// First matching rule wins: steer, merge, coins, order. Owner: AI-4

import { getPart as realGetPart } from '../engine/parts/index.js';
import { LOSS_TIP_RULES } from '../data/shifts.js';

// Every part id the player has owned in this run (old saves: only what is owned now).
function everOwnedIds(run) {
  const ids = (run.everOwned || []).slice();
  for (let i = 0; i < run.machine.cells.length; i++) {
    ids.push(run.machine.cells[i].partId);
  }
  for (let i = 0; i < run.bench.length; i++) {
    ids.push(run.bench[i].partId);
  }
  return ids;
}

function highestLevelSeen(run) {
  let best = run.maxLevelSeen || 1;
  for (let i = 0; i < run.machine.cells.length; i++) {
    best = Math.max(best, run.machine.cells[i].level);
  }
  for (let i = 0; i < run.bench.length; i++) {
    best = Math.max(best, run.bench[i].level);
  }
  return best;
}

function ownedAnyRoutePart(run, getPart) {
  const ids = everOwnedIds(run);
  for (let i = 0; i < ids.length; i++) {
    const part = getPart(ids[i]);
    const tags = part && part.tags ? part.tags : [];
    if (tags.indexOf('route') >= 0 || tags.indexOf('split') >= 0) {
      return true;
    }
  }
  return false;
}

// The id of the tip for a lost run: 'steer', 'merge', 'coins' or 'order'. null when not lost.
export function tipFor(run, deps) {
  if (run.phase !== 'lost') {
    return null;
  }
  const getPart = (deps && deps.getPart) || realGetPart;
  if (!ownedAnyRoutePart(run, getPart)) {
    return 'steer';
  }
  if (highestLevelSeen(run) < 2) {
    return 'merge';
  }
  if (run.coins >= LOSS_TIP_RULES.unspentCoins) {
    return 'coins';
  }
  return 'order';
}

// The best single Fire of the shift where the run ended (old saves: the last Fire).
export function bestFireOfShift(run) {
  if (typeof run.shiftBestFire === 'number') {
    return run.shiftBestFire;
  }
  return run.lastFire ? run.lastFire.total : 0;
}
