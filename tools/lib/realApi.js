// Wires the bot to the REAL game modules. Tests pass fakes instead.
// Owner: AI-8

import { simulate } from '../../src/engine/simulate.js';
import { cloneMachine, placePart } from '../../src/engine/board.js';
import { getPart, allPartIds } from '../../src/engine/parts/index.js';
import {
  newRun, placeFromBench, returnToBench, fire, startNextShift
} from '../../src/run/runState.js';
import { buyOffer, sellPart, rerollOffers, rerollPrice } from '../../src/run/shop.js';
import { applyMerges } from '../../src/run/merge.js';
import { makeRng } from '../../src/core/rng.js';

export function realApi() {
  return {
    simulate, cloneMachine, placePart, getPart, allPartIds, newRun, placeFromBench,
    returnToBench, fire, startNextShift, buyOffer, sellPart, rerollOffers, rerollPrice,
    applyMerges, makeRng
  };
}

// Very small command line reader: --name value, or --flag on its own.
export function readArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].indexOf('--') !== 0) {
      continue;
    }
    const name = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.indexOf('--') === 0) {
      args[name] = true;
    } else {
      args[name] = next;
      i = i + 1;
    }
  }
  return args;
}
