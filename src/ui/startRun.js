// Starts a fresh normal run and opens the run screen. Used by Home and Results.
// Owner: AI-7

import { go } from './ui.js';
import { saveRun } from '../core/save.js';
import { emit } from '../core/events.js';
import { newRun } from '../run/runState.js';
import { bonusesFor } from '../meta/workshop.js';
import { unlockedPartIds } from '../meta/patentBook.js';

// A new seed for every run. This is not game logic, so Math.random is fine here.
function freshSeed() {
  return (Date.now() + Math.floor(Math.random() * 1e9)) % 2147483647;
}

// Gentle mode (contract item 24) rides inside `bonuses`; AI-4's newRun reads it.
function bonusesWithGentle(meta, gentle) {
  const bonuses = Object.assign({}, bonusesFor(meta));
  if (gentle) bonuses.gentle = true;
  return bonuses;
}

export function startNormalRun(meta, inventorId, voltage, gentle) {
  const run = newRun({
    inventorId: inventorId,
    voltage: voltage,
    seed: freshSeed(),
    poolIds: unlockedPartIds(meta),
    bonuses: bonusesWithGentle(meta, gentle),
    daily: false
  });
  saveRun(run);
  emit('ui:runStarted', { inventorId: inventorId, voltage: voltage, gentle: !!gentle });
  go('run');
}
