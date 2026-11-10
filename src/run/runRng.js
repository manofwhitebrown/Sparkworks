// Random numbers for a run. The rng is made from seed + rngState every time and
// rngState goes up by 1, so a saved and loaded run gives the same numbers.
// Owner: AI-4

import { makeRng, hashString } from '../core/rng.js';

function seedNumber(seed) {
  if (typeof seed === 'number') {
    return seed;
  }
  return hashString(String(seed));
}

// A fresh rng function (0..1). Uses up one step of the run's counter.
export function nextRng(run) {
  const rng = makeRng(seedNumber(run.seed) + run.rngState);
  run.rngState = run.rngState + 1;
  return rng;
}

// A whole number from 1 to 999999999 for a machine seed.
export function nextMachineSeed(run) {
  const rng = nextRng(run);
  return 1 + Math.floor(rng() * 999999998);
}
