// Engine tests: empty board, order of parts, edges, blocked and banned cells.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { simulate } from '../src/engine/simulate.js';
import { makeMachine } from '../src/engine/board.js';
import { makeAdder, makeMultiplier, turner, makeGetPart, machineWith } from './engine-helpers.test.js';

const getPart = makeGetPart({
  coil: makeAdder(3),
  amp: makeMultiplier(2),
  turn: turner
});

function findEvents(result, type) {
  return result.events.filter(function (e) {
    return e.type === type;
  });
}

test('empty board: 3 sparks walk straight to the vault', () => {
  const result = simulate(makeMachine({ seed: 1, startValue: 2 }), { getPart });
  assert.strictEqual(result.total, 6);
  assert.strictEqual(result.banked, 3);
  assert.strictEqual(result.fizzled, 0);
  assert.strictEqual(result.coins, 0);
  const last = result.events[result.events.length - 1];
  assert.strictEqual(last.type, 'end');
  assert.strictEqual(last.total, 6);
  for (let i = 0; i < result.events.length; i++) {
    assert.strictEqual(result.events[i].n, i);
    assert.strictEqual(typeof result.events[i].spark, 'number');
  }
});

test('an empty board walks 5 cells per spark', () => {
  const result = simulate(makeMachine({ seed: 1, sparkCount: 1 }), { getPart });
  const enters = findEvents(result, 'enter');
  assert.strictEqual(enters.length, 5);
  assert.strictEqual(enters[0].x, 0);
  assert.strictEqual(enters[0].y, 1);
  assert.strictEqual(enters[4].x, 4);
  const bank = findEvents(result, 'bank')[0];
  assert.strictEqual(bank.runningTotal, 1);
});

test('order matters: coil then amp = 8, amp then coil = 5 (per spark)', () => {
  const coilFirst = machineWith([[1, 1, 'coil'], [2, 1, 'amp']]);
  const ampFirst = machineWith([[1, 1, 'amp'], [2, 1, 'coil']]);
  coilFirst.sparkCount = 1;
  ampFirst.sparkCount = 1;
  assert.strictEqual(simulate(coilFirst, { getPart }).total, 8);
  assert.strictEqual(simulate(ampFirst, { getPart }).total, 5);
});

test('value events show before, after and label', () => {
  const machine = machineWith([[1, 1, 'coil']]);
  machine.sparkCount = 1;
  const result = simulate(machine, { getPart });
  const ev = findEvents(result, 'value')[0];
  assert.strictEqual(ev.before, 1);
  assert.strictEqual(ev.after, 4);
  assert.strictEqual(ev.label, '+3');
  assert.strictEqual(ev.partId, 'coil');
  assert.strictEqual(ev.x, 1);
  assert.strictEqual(ev.y, 1);
});

test('leaving by the top edge fizzles', () => {
  const machine = machineWith([[1, 1, 'turn', 3]]);
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.total, 0);
  assert.strictEqual(result.fizzled, 3);
  const f = findEvents(result, 'fizzle')[0];
  assert.strictEqual(f.reason, 'edge');
  assert.ok(findEvents(result, 'turn').length === 3);
});

test('leaving by the bottom edge fizzles', () => {
  const machine = machineWith([[1, 1, 'turn', 1]]);
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.total, 0);
  assert.strictEqual(result.fizzled, 3);
  assert.strictEqual(findEvents(result, 'fizzle')[0].reason, 'edge');
});

test('leaving by the left edge fizzles', () => {
  const machine = machineWith([[0, 1, 'turn', 2]]);
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.total, 0);
  assert.strictEqual(result.fizzled, 3);
  assert.strictEqual(findEvents(result, 'fizzle')[0].reason, 'edge');
});

test('leaving by the right edge banks', () => {
  const result = simulate(machineWith([[4, 1, 'coil']]), { getPart });
  assert.strictEqual(result.banked, 3);
  assert.strictEqual(result.total, 12);
});

test('a blocked cell makes the spark fizzle with reason blocked', () => {
  const machine = machineWith([]);
  machine.blocked.push({ x: 2, y: 1 });
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.total, 0);
  assert.strictEqual(result.fizzled, 3);
  const blocked = findEvents(result, 'blocked');
  assert.strictEqual(blocked.length, 3);
  assert.strictEqual(blocked[0].x, 2);
  const fizzle = findEvents(result, 'fizzle')[0];
  assert.strictEqual(fizzle.reason, 'blocked');
});

test('a part on a blocked cell never acts', () => {
  const machine = machineWith([[2, 1, 'coil']]);
  machine.blocked.push({ x: 2, y: 1 });
  const result = simulate(machine, { getPart });
  assert.strictEqual(findEvents(result, 'value').length, 0);
});

test('a banned part acts like an empty cell', () => {
  const machine = machineWith([[2, 1, 'coil']]);
  machine.banned.push('coil');
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.total, 3);
  assert.strictEqual(findEvents(result, 'value').length, 0);
});

test('unknown part ids act like empty cells', () => {
  const machine = machineWith([[2, 1, 'doesNotExist']]);
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.total, 3);
});

test('the machine is not changed by simulate', () => {
  const machine = machineWith([[1, 1, 'coil']]);
  const before = JSON.stringify(machine);
  simulate(machine, { getPart });
  assert.strictEqual(JSON.stringify(machine), before);
});
