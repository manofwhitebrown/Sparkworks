// The ready-made run for the guided shift, plus the two example machines the lesson compares.
// Numbers: spark starts at 1. Coil adds +3, Amplifier multiplies by x2 (level 1).
//   Amplifier BEFORE coil: (1 * 2) + 3 = 5 per spark.  Amplifier AFTER coil: (1 + 3) * 2 = 8 per spark.
// Owner: AI-8

import { newRun as realNewRun } from '../run/runState.js';
import { makeMachine, placePart } from '../engine/board.js';
import { emit as realEmit } from '../core/events.js';

export const TUTORIAL_SEED = 777;
export const TUTORIAL_TARGET = 84;
export const TUTORIAL_POOL = ['coil', 'amplifier', 'bend'];

// Machine with just the coil in the middle of the source row.
export function coilOnlyMachine() {
  const machine = makeMachine({ seed: TUTORIAL_SEED });
  placePart(machine, 2, machine.sourceRow, 'coil', 1, 0);
  return machine;
}

// Amplifier one step closer to the source than the coil: the WEAKER order.
export function amplifierBeforeMachine() {
  const machine = coilOnlyMachine();
  placePart(machine, 1, machine.sourceRow, 'amplifier', 1, 0);
  return machine;
}

// Coil first, amplifier after it: the STRONGER order.
export function amplifierAfterMachine() {
  const machine = makeMachine({ seed: TUTORIAL_SEED });
  placePart(machine, 1, machine.sourceRow, 'coil', 1, 0);
  placePart(machine, 2, machine.sourceRow, 'amplifier', 1, 0);
  return machine;
}

// The detour the steering lesson builds: Bend DOWN at column 2 of the source row, a Coil under
// it, then a Bend RIGHT under the Coil. The spark goes down, gets the Coil, turns right and
// reaches the Vault. Each of the 3 sparks makes 1 + 3 = 4, so the Fire is worth 12.
export function detourMachine() {
  const machine = makeMachine({ seed: TUTORIAL_SEED });
  placePart(machine, 1, machine.sourceRow, 'bend', 1, 1);
  placePart(machine, 1, machine.sourceRow + 1, 'coil', 1, 0);
  placePart(machine, 1, machine.sourceRow + 2, 'bend', 1, 0);
  return machine;
}

// The run object the UI is using right now. The steering lesson changes it in place.
let activeRun = null;

// Swap the bench for Bend, Bend, Coil and clear the board. The run screen redraws itself when
// it hears 'cheat:changed' (it saves the run too). deps (for tests): { emit, run }.
export function giveSteeringParts(deps) {
  const d = deps || {};
  const run = Object.prototype.hasOwnProperty.call(d, 'run') ? d.run : activeRun;
  const emit = d.emit || realEmit;
  if (!run) {
    return false;
  }
  run.bench = [
    { partId: 'bend', level: 1 },
    { partId: 'bend', level: 1 },
    { partId: 'coil', level: 1 }
  ];
  run.machine.cells = [];
  emit('cheat:changed', { what: 'tutorial' });
  return true;
}

// deps lets tests swap newRun. The run gets 10 Fires and a high target, so the shift is only
// cleared once the whole lesson is over (the Fires add up: 12 + 15 + 24 + 12 = 63, target 84).
export function tutorialRun(deps) {
  const newRun = deps && deps.newRun ? deps.newRun : realNewRun;
  const run = newRun({
    inventorId: 'tinkerbot',
    voltage: 1,
    seed: TUTORIAL_SEED,
    poolIds: TUTORIAL_POOL.slice(),
    bonuses: { startCoins: 0, benchSize: 0, shopSlots: 0, freeRerolls: 0, extraFires: 0 },
    daily: false
  });
  // Exactly the parts the lesson needs, nothing else to confuse the player.
  run.bench = [
    { partId: 'coil', level: 1 },
    { partId: 'amplifier', level: 1 }
  ];
  run.machine.cells = [];
  run.firesLeft = 10;
  run.targetMultiplier = TUTORIAL_TARGET / 16;
  run.coins = 6;
  // A fixed first shop so the "buy 3 to level up" lesson always shows a coil.
  run.offers = [
    { partId: 'coil', level: 1, price: 3, sold: false },
    { partId: 'coil', level: 1, price: 3, sold: false },
    { partId: 'amplifier', level: 1, price: 5, sold: false }
  ];
  run.tutorial = true;
  activeRun = run;
  return run;
}

// True when a saved run may be offered as "Continue run" on Home. The guided tutorial run
// is never offered: skipping the tutorial must not leave a fake "shift 1" to continue.
export function isContinuableRun(run) {
  if (!run || run.tutorial === true) {
    return false;
  }
  return run.phase === 'build' || run.phase === 'shop';
}
