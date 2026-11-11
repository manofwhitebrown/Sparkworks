// The tiny machine that loops on the Home screen. Pure data and the real engine, no DOM,
// so node:test can check that it really plays and really reaches the vault.
// Owner: AI-1 (covering AI-7)

import { makeMachine, placePart } from '../engine/board.js';
import { simulate } from '../engine/simulate.js';

// Coil, Amplifier, Coil in a row on the source row: three sparks, all reach the vault.
export function makeDemoMachine() {
  const machine = makeMachine({ seed: 7 });
  placePart(machine, 1, machine.sourceRow, 'coil', 1, 0);
  placePart(machine, 2, machine.sourceRow, 'amplifier', 1, 0);
  placePart(machine, 3, machine.sourceRow, 'coil', 2, 0);
  return machine;
}

// The events of one Fire of the demo machine (the Home screen plays them again and again).
export function demoEvents() {
  const result = simulate(makeDemoMachine());
  return result.events;
}

// Does the Home screen run the loop? Not with reduce motion, not on the low tier.
export function shouldLoop(settings) {
  const s = settings || {};
  if (s.reduceMotion) return false;
  return s.quality !== 'low';
}

// How long to rest between two plays, in milliseconds.
export const DEMO_PAUSE_MS = 1400;
