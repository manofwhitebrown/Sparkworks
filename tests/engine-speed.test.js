// Engine speed check: a bot calls simulate() 10,000 times without events.
// The limit is generous so slow CI machines still pass.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { simulate } from '../src/engine/simulate.js';
import { makeMachine, placePart } from '../src/engine/board.js';
import { makeAdder, makeMultiplier, makeSplitter, makeGetPart } from './engine-helpers.test.js';

const getPart = makeGetPart({
  coil: makeAdder(3),
  amp: makeMultiplier(2),
  split: makeSplitter('down', 0)
});

test('10,000 simulations on a 5x4 board take a couple of seconds at most', () => {
  const machine = makeMachine({ seed: 3 });
  placePart(machine, 1, 1, 'coil', 1, 0);
  placePart(machine, 2, 1, 'split', 1, 0);
  placePart(machine, 3, 1, 'amp', 1, 0);
  placePart(machine, 2, 3, 'coil', 1, 0);
  const start = Date.now();
  let sum = 0;
  for (let i = 0; i < 10000; i++) {
    machine.seed = i;
    sum += simulate(machine, { getPart, recordEvents: false }).total;
  }
  const ms = Date.now() - start;
  assert.ok(sum > 0);
  assert.ok(ms < 5000, 'took ' + ms + ' ms');
});
