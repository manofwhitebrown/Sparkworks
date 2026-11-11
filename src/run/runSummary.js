// The plain summary of a run for the results screen, the meta stats and the loss tip.
// Owner: AI-4

import { targetOfRun } from './runRules.js';
import { tipFor, bestFireOfShift } from './lossTips.js';

// neededTotal / bestFireLastShift / tipId describe the shift where the run ended.
export function runSummary(run, deps) {
  let cleared = 0;
  let banked = 0;
  for (let i = 0; i < run.history.length; i++) {
    banked = banked + run.history[i].total;
    if (run.history[i].total >= run.history[i].target) {
      cleared = cleared + 1;
    }
  }
  if (run.phase === 'build') {
    banked = banked + run.shiftTotal;
  }
  const owned = [];
  for (let i = 0; i < run.machine.cells.length; i++) {
    owned.push(run.machine.cells[i].partId);
  }
  for (let i = 0; i < run.bench.length; i++) {
    owned.push(run.bench[i].partId);
  }
  return {
    won: run.phase === 'won',
    shiftReached: run.shift,
    shiftsCleared: cleared,
    voltage: run.voltage,
    inventorId: run.inventorId,
    daily: run.daily,
    bestFire: run.bestFire,
    firesUsed: run.firesUsed || 0,
    partsBought: run.partsBought || 0,
    totalBanked: banked,
    partsOwned: owned,
    coinsLeft: run.coins,
    gentle: !!(run.bonuses && run.bonuses.gentle),
    neededTotal: targetOfRun(run),
    bestFireLastShift: bestFireOfShift(run),
    tipId: tipFor(run, deps)
  };
}
