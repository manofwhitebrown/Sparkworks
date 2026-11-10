// Combos run through the real simulate from AI-2.
// Owner: AI-3
import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../src/engine/simulate.js';
import { makeMachine } from '../src/engine/board.js';
import { PARTS } from '../src/engine/parts/index.js';

function place(machine, x, y, partId, rot, level) {
  machine.cells.push({ x: x, y: y, partId: partId, level: level || 1, rot: rot || 0 });
}

function rowMachine(partIds, startValue) {
  const machine = makeMachine({ startValue: startValue === undefined ? 1 : startValue, sparkCount: 1 });
  for (let i = 0; i < partIds.length; i++) {
    place(machine, i, 1, partIds[i], 0);
  }
  return machine;
}

function run(machine) {
  return simulate(machine, { recordEvents: false });
}

test('coil then amplifier = 8, amplifier then coil = 5', () => {
  assert.equal(run(rowMachine(['coil', 'amplifier'])).total, 8);
  assert.equal(run(rowMachine(['amplifier', 'coil'])).total, 5);
});

test('every part runs in a real machine without errors', () => {
  for (const id of Object.keys(PARTS)) {
    const machine = rowMachine([id]);
    place(machine, 1, 0, 'coil', 0);
    const result = simulate(machine, { recordEvents: true });
    assert.ok(Number.isFinite(result.total), id);
    assert.ok(!result.errors || result.errors.length === 0, id);
  }
});

test('splitter + bend banks the copy too', () => {
  // Splitter at (1,1) points down (rot 1); the copy walks down, a bend at (1,2) sends it right.
  const machine = makeMachine({ startValue: 10, sparkCount: 1 });
  place(machine, 1, 1, 'splitter', 1);
  place(machine, 1, 2, 'bend', 0);
  const result = run(machine);
  assert.equal(result.banked, 2);
  assert.equal(result.total, 15);
});

test('reverser sends the spark back through a coil again', () => {
  // Right through coil (2,1), reverser (3,1) turns it left, back through the coil (+3 again),
  // a bend at (1,1) turns it right, so it passes the coil a third time, then the spent reverser,
  // then banks. 1 + 3 + 3 + 3 = 10.
  const machine = makeMachine({ startValue: 1, sparkCount: 1 });
  place(machine, 1, 1, 'bend', 0);
  place(machine, 2, 1, 'coil', 0);
  place(machine, 3, 1, 'reverser', 0, 1);
  const result = run(machine);
  assert.equal(result.total, 10);
  assert.equal(result.banked, 1);
});

test('same machine and seed give the same result with gambler', () => {
  const a = rowMachine(['gambler', 'gambler']);
  a.seed = 42;
  const b = rowMachine(['gambler', 'gambler']);
  b.seed = 42;
  assert.equal(run(a).total, run(b).total);
});

test('banned parts act like empty cells (rust / noSplit effect)', () => {
  const machine = rowMachine(['coil']);
  machine.banned.push('coil');
  assert.equal(run(machine).total, 1);
});

test('overdrive only multiplies spark 1', () => {
  const machine = makeMachine({ startValue: 1, sparkCount: 3 });
  place(machine, 1, 1, 'overdrive', 0);
  assert.equal(run(machine).total, 4 + 1 + 1);
});

test('tollgate pays coins per spark pass', () => {
  const machine = makeMachine({ startValue: 1, sparkCount: 3 });
  place(machine, 1, 1, 'tollgate', 0);
  assert.equal(run(machine).coins, 3);
});
