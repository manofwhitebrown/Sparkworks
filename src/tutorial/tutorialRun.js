// The ready-made run for the guided shift, plus the two example machines the lesson compares.
// Numbers: spark starts at 1. Coil adds +3, Amplifier multiplies by x2 (level 1).
//   Amplifier BEFORE coil: (1 * 2) + 3 = 5 per spark.  Amplifier AFTER coil: (1 + 3) * 2 = 8 per spark.
// Owner: AI-8

import { newRun as realNewRun } from '../run/runState.js';
import { makeMachine, placePart } from '../engine/board.js';

export const TUTORIAL_SEED = 777;
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

// deps lets tests swap newRun. The run gets 3 Fires so the player can try three layouts.
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
  run.firesLeft = 3;
  run.coins = 6;
  // A fixed first shop so the "buy 3 to level up" lesson always shows a coil.
  run.offers = [
    { partId: 'coil', level: 1, price: 3, sold: false },
    { partId: 'coil', level: 1, price: 3, sold: false },
    { partId: 'amplifier', level: 1, price: 5, sold: false }
  ];
  run.tutorial = true;
  return run;
}
