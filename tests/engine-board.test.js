// Engine tests: board helpers and validateMachine.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import {
  DIRS, rotToDir, dirToRot, stepFrom, makeMachine, cloneMachine,
  validateMachine, getCellAt, placePart, removePart
} from '../src/engine/board.js';
import { CONFIG } from '../src/data/config.js';

test('directions and rotation match', () => {
  assert.deepStrictEqual(DIRS, ['right', 'down', 'left', 'up']);
  for (let rot = 0; rot < 4; rot++) {
    assert.strictEqual(dirToRot(rotToDir(rot)), rot);
  }
  assert.strictEqual(rotToDir(1), 'down');
  assert.strictEqual(rotToDir(3), 'up');
  assert.strictEqual(rotToDir(4), 'right');
});

test('stepFrom moves one cell', () => {
  assert.deepStrictEqual(stepFrom(2, 2, 'right'), { x: 3, y: 2 });
  assert.deepStrictEqual(stepFrom(2, 2, 'down'), { x: 2, y: 3 });
  assert.deepStrictEqual(stepFrom(2, 2, 'left'), { x: 1, y: 2 });
  assert.deepStrictEqual(stepFrom(2, 2, 'up'), { x: 2, y: 1 });
});

test('makeMachine uses CONFIG defaults and accepts overrides', () => {
  const m = makeMachine();
  assert.strictEqual(m.cols, CONFIG.cols);
  assert.strictEqual(m.rows, CONFIG.rows);
  assert.strictEqual(m.sparkCount, CONFIG.sparkCount);
  assert.deepStrictEqual(m.cells, []);
  assert.deepStrictEqual(m.blocked, []);
  assert.deepStrictEqual(m.banned, []);
  assert.deepStrictEqual(m.flags, {});
  assert.strictEqual(typeof m.seed, 'number');
  const o = makeMachine({ cols: 6, seed: 99 });
  assert.strictEqual(o.cols, 6);
  assert.strictEqual(o.seed, 99);
  assert.notStrictEqual(makeMachine().cells, makeMachine().cells);
});

test('placePart adds, replaces and removePart removes (mutating)', () => {
  const m = makeMachine();
  placePart(m, 1, 1, 'coil', 1, 0);
  placePart(m, 2, 1, 'amp', 2, 3);
  assert.strictEqual(m.cells.length, 2);
  placePart(m, 1, 1, 'dynamo', 3, 1);
  assert.strictEqual(m.cells.length, 2);
  assert.deepStrictEqual(getCellAt(m, 1, 1), { x: 1, y: 1, partId: 'dynamo', level: 3, rot: 1 });
  assert.strictEqual(getCellAt(m, 0, 0), null);
  removePart(m, 1, 1);
  assert.strictEqual(getCellAt(m, 1, 1), null);
  removePart(m, 4, 3);
  assert.strictEqual(m.cells.length, 1);
});

test('cloneMachine is a deep copy', () => {
  const m = makeMachine({ seed: 5 });
  placePart(m, 1, 1, 'coil', 1, 0);
  m.blocked.push({ x: 3, y: 3 });
  m.banned.push('fuse');
  m.flags.note = { deep: [1, 2] };
  const c = cloneMachine(m);
  assert.deepStrictEqual(c, m);
  c.cells[0].level = 3;
  c.blocked[0].x = 0;
  c.banned.push('x');
  c.flags.note.deep.push(3);
  assert.strictEqual(m.cells[0].level, 1);
  assert.strictEqual(m.blocked[0].x, 3);
  assert.strictEqual(m.banned.length, 1);
  assert.deepStrictEqual(m.flags.note.deep, [1, 2]);
});

test('validateMachine accepts a good machine', () => {
  const m = makeMachine();
  placePart(m, 1, 1, 'coil', 1, 0);
  assert.deepStrictEqual(validateMachine(m), []);
});

function problemsFor(change) {
  const m = makeMachine();
  placePart(m, 1, 1, 'coil', 1, 0);
  change(m);
  return validateMachine(m);
}

test('validateMachine catches each problem', () => {
  assert.ok(problemsFor((m) => { m.cols = 0; }).length > 0);
  assert.ok(problemsFor((m) => { m.cols = 2.5; }).length > 0);
  assert.ok(problemsFor((m) => { m.rows = -1; }).length > 0);
  assert.ok(problemsFor((m) => { m.sourceRow = 4; }).length > 0);
  assert.ok(problemsFor((m) => { m.sourceRow = -1; }).length > 0);
  assert.ok(problemsFor((m) => { m.sparkCount = 0; }).length > 0);
  assert.ok(problemsFor((m) => { m.cells[0].x = 5; }).length > 0);
  assert.ok(problemsFor((m) => { m.cells[0].y = -1; }).length > 0);
  assert.ok(problemsFor((m) => { m.cells.push({ x: 1, y: 1, partId: 'amp', level: 1, rot: 0 }); }).length > 0);
  assert.ok(problemsFor((m) => { m.cells[0].rot = 4; }).length > 0);
  assert.ok(problemsFor((m) => { m.cells[0].level = 0; }).length > 0);
  assert.ok(problemsFor((m) => { m.cells[0].level = 4; }).length > 0);
  assert.ok(problemsFor((m) => { m.cells[0].partId = 7; }).length > 0);
});

test('validateMachine problems are plain-English strings', () => {
  const list = problemsFor((m) => { m.cells[0].rot = 9; });
  assert.strictEqual(typeof list[0], 'string');
  assert.ok(list[0].length > 10);
  assert.ok(validateMachine(null).length > 0);
});
