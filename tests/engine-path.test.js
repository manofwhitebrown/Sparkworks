// Tests for src/engine/pathInfo.js against REAL simulate logs (fake parts, real engine).
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { simulate } from '../src/engine/simulate.js';
import { pathCells, touchedParts } from '../src/engine/pathInfo.js';
import {
  makeAdder, turner, disabler, makeGetPart, machineWith
} from './engine-helpers.test.js';

const getPart = makeGetPart({
  coil: makeAdder(2),
  turn: turner,
  disabler: disabler,
  noop: { id: 'noop', onPass() {} },
  split: { id: 'split', onPass(ctx) { ctx.split('down', ctx.value, 's'); } }
});

function cellsText(list) {
  return list.map(function (c) {
    return c.x + ',' + c.y;
  });
}

test('pathCells on an empty board: the source row, left to right, each cell once', () => {
  const result = simulate(machineWith([], { seed: 1 }), { getPart });
  assert.deepStrictEqual(cellsText(pathCells(result.events)), ['0,1', '1,1', '2,1', '3,1', '4,1']);
  assert.deepStrictEqual(touchedParts(result.events), []);
});

test('pathCells: 3 sparks give the same cells as 1 spark (each cell once)', () => {
  const one = simulate(machineWith([[2, 1, 'turn', 1]], { seed: 1, sparkCount: 1 }), { getPart });
  const three = simulate(machineWith([[2, 1, 'turn', 1]], { seed: 1, sparkCount: 3 }), { getPart });
  assert.deepStrictEqual(pathCells(three.events), pathCells(one.events));
});

test('pathCells follows turns and includes cells off the source row', () => {
  const result = simulate(machineWith([[2, 1, 'turn', 1]], { seed: 1, sparkCount: 1 }), { getPart });
  assert.deepStrictEqual(cellsText(pathCells(result.events)), ['0,1', '1,1', '2,1', '2,2', '2,3']);
});

test('pathCells includes the cells of children made by a split', () => {
  const result = simulate(machineWith([[1, 1, 'split']], { seed: 1, sparkCount: 1 }), { getPart });
  // parent walks the row; the child goes down from (1,1): (1,2), (1,3), then out of the board
  assert.deepStrictEqual(
    cellsText(pathCells(result.events)),
    ['0,1', '1,1', '2,1', '3,1', '4,1', '1,2', '1,3']
  );
});

test('pathCells in a loop: each cell once, in first-visit order', () => {
  const LOOP = [[1, 1, 'turn', 1], [1, 2, 'turn', 0], [2, 2, 'turn', 3], [2, 1, 'turn', 2]];
  const result = simulate(machineWith(LOOP, { seed: 1, sparkCount: 2 }), { getPart });
  assert.deepStrictEqual(cellsText(pathCells(result.events)), ['0,1', '1,1', '1,2', '2,2', '2,1']);
});

test('pathCells keeps a blocked cell the spark walked into, and stops there', () => {
  const result = simulate(machineWith([], { seed: 1, sparkCount: 1, blocked: [{ x: 2, y: 1 }] }), { getPart });
  assert.deepStrictEqual(cellsText(pathCells(result.events)), ['0,1', '1,1', '2,1']);
});

test('pathCells includes the portal exit cell right after the portal entry', () => {
  const machine = machineWith([[1, 1, 'portal'], [3, 3, 'portal']], { seed: 1, sparkCount: 1 });
  const result = simulate(machine, { getPart });
  assert.deepStrictEqual(cellsText(pathCells(result.events)), ['0,1', '1,1', '3,3', '4,3']);
});

test('touchedParts: only cells where a part acted, in first-touch order', () => {
  const machine = machineWith([[3, 1, 'coil'], [1, 1, 'noop'], [2, 3, 'coil']], { seed: 1 });
  const result = simulate(machine, { getPart });
  // (2,3) is never reached. A part that changes nothing (noop) still counts as touched.
  assert.deepStrictEqual(cellsText(touchedParts(result.events)), ['1,1', '3,1']);
});

test('touchedParts: banned parts and parts on blocked cells are not touched', () => {
  const banned = simulate(machineWith([[1, 1, 'coil']], { seed: 1, banned: ['coil'] }), { getPart });
  assert.deepStrictEqual(touchedParts(banned.events), []);
  const blocked = simulate(machineWith([[2, 1, 'coil']], { seed: 1, blocked: [{ x: 2, y: 1 }] }), { getPart });
  assert.deepStrictEqual(touchedParts(blocked.events), []);
});

test('touchedParts: a part that disabled itself was still touched', () => {
  const result = simulate(machineWith([[1, 1, 'disabler']], { seed: 1 }), { getPart });
  assert.deepStrictEqual(cellsText(touchedParts(result.events)), ['1,1']);
});

test('touchedParts: a part reached only by a child counts', () => {
  const machine = machineWith([[1, 1, 'split'], [1, 2, 'noop']], { seed: 1, sparkCount: 1 });
  const result = simulate(machine, { getPart });
  assert.deepStrictEqual(cellsText(touchedParts(result.events)), ['1,1', '1,2']);
});

test('touchedParts: portal ends count when a spark used the pair', () => {
  const used = simulate(machineWith([[1, 1, 'portal'], [3, 3, 'portal']], { seed: 1, sparkCount: 1 }), { getPart });
  assert.deepStrictEqual(cellsText(touchedParts(used.events)), ['1,1', '3,3']);
  const unused = simulate(machineWith([[1, 0, 'portal'], [3, 3, 'portal']], { seed: 1, sparkCount: 1 }), { getPart });
  assert.deepStrictEqual(touchedParts(unused.events), []);
});

test('touchedParts: works with the real parts', () => {
  const machine = machineWith([[1, 1, 'coil'], [3, 0, 'coil']], { seed: 1 });
  // real part ids; the real getPart is the default
  const result = simulate(machine);
  assert.deepStrictEqual(cellsText(touchedParts(result.events)), ['1,1']);
});

test('the helpers accept an empty or missing log and never change it', () => {
  assert.deepStrictEqual(pathCells([]), []);
  assert.deepStrictEqual(touchedParts(undefined), []);
  const result = simulate(machineWith([[1, 1, 'coil']], { seed: 1 }), { getPart });
  const before = JSON.stringify(result.events);
  pathCells(result.events);
  touchedParts(result.events);
  assert.strictEqual(JSON.stringify(result.events), before);
});
