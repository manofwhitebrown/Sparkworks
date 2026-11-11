// Twist behaviour and (skipped until AI-2 pushes it) real simulate combos.
// Owner: AI-3
import test from 'node:test';
import assert from 'node:assert/strict';
import { TWISTS, getTwist, applyTwists } from '../src/engine/twists.js';
import { partsWithTag } from '../src/engine/parts/index.js';
import { makeMachine } from '../src/engine/board.js';
import { simulate } from '../src/engine/simulate.js';
import { makeRng } from '../src/core/rng.js';

function boardWith(cells) {
  const machine = makeMachine({});
  machine.cells = cells || [];
  return machine;
}

test('all six twists exist and unknown ids are ignored', () => {
  for (const id of ['deadCell', 'twoDeadCells', 'noSplit', 'fewerSparks', 'rust', 'coldStart']) {
    assert.equal(getTwist(id).id, id);
    assert.ok(TWISTS[id].name && TWISTS[id].description);
  }
  assert.equal(getTwist('zzz'), null);
  const machine = applyTwists(boardWith(), ['zzz'], makeRng(1));
  assert.equal(machine.blocked.length, 0);
});

test('deadCell blocks one free cell, never the source, a part or a blocked cell', () => {
  for (let seed = 1; seed <= 50; seed++) {
    const machine = boardWith([{ x: 1, y: 1, partId: 'coil', level: 1, rot: 0 }]);
    machine.blocked.push({ x: 2, y: 2 });
    applyTwists(machine, ['deadCell'], makeRng(seed));
    assert.equal(machine.blocked.length, 2);
    const cell = machine.blocked[1];
    assert.ok(!(cell.x === 0 && cell.y === machine.sourceRow));
    assert.ok(!(cell.x === 1 && cell.y === 1));
    assert.ok(!(cell.x === 2 && cell.y === 2));
  }
});

test('twoDeadCells blocks two different cells', () => {
  const machine = applyTwists(boardWith(), ['twoDeadCells'], makeRng(5));
  assert.equal(machine.blocked.length, 2);
  assert.notDeepEqual(machine.blocked[0], machine.blocked[1]);
});

test('noSplit bans every split part', () => {
  const machine = applyTwists(boardWith(), ['noSplit'], makeRng(1));
  for (const id of ['splitter', 'triplet', 'prism']) {
    assert.ok(machine.banned.includes(id));
  }
});

test('fewerSparks never goes below 1', () => {
  const machine = applyTwists(boardWith(), ['fewerSparks'], makeRng(1));
  assert.equal(machine.sparkCount, 2);
  machine.sparkCount = 1;
  applyTwists(machine, ['fewerSparks'], makeRng(1));
  assert.equal(machine.sparkCount, 1);
});

test('rust bans one placed part, and does nothing on an empty board', () => {
  const machine = boardWith([{ x: 1, y: 1, partId: 'coil', level: 1, rot: 0 }]);
  applyTwists(machine, ['rust'], makeRng(1));
  assert.deepEqual(machine.banned, ['coil']);
  const empty = applyTwists(boardWith(), ['rust'], makeRng(1));
  assert.deepEqual(empty.banned, []);
});

test('coldStart sets startValue to 0', () => {
  assert.equal(applyTwists(boardWith(), ['coldStart'], makeRng(1)).startValue, 0);
});

test('twistNames lists the names in order', () => {
  const machine = applyTwists(boardWith(), ['coldStart', 'fewerSparks'], makeRng(1));
  assert.deepEqual(machine.flags.twistNames, ['Cold Start', 'Fewer Sparks']);
});

test('the same seed gives the same twist result', () => {
  const a = applyTwists(boardWith(), ['twoDeadCells'], makeRng(77));
  const b = applyTwists(boardWith(), ['twoDeadCells'], makeRng(77));
  assert.deepEqual(a.blocked, b.blocked);
});


test('round 4 twists exist with plain descriptions', () => {
  for (const id of ['closedRow', 'loneSpark', 'noMult']) {
    assert.equal(getTwist(id).id, id);
    assert.ok(TWISTS[id].name && TWISTS[id].description);
  }
});

test('closedRow blocks one whole row that is not the source row', () => {
  const seen = {};
  for (let seed = 1; seed <= 60; seed++) {
    const machine = boardWith();
    applyTwists(machine, ['closedRow'], makeRng(seed));
    assert.equal(machine.blocked.length, machine.cols);
    const row = machine.blocked[0].y;
    assert.notEqual(row, machine.sourceRow);
    seen[row] = true;
    for (let x = 0; x < machine.cols; x++) {
      assert.ok(machine.blocked.some((b) => b.x === x && b.y === row));
    }
    assert.deepEqual(machine.flags.twistNames, ['Closed Row']);
  }
  assert.equal(Object.keys(seen).length, 3);
});

test('closedRow adds no cell twice when part of the row is already blocked', () => {
  const machine = boardWith();
  machine.rows = 2;
  machine.sourceRow = 0;
  machine.blocked.push({ x: 2, y: 1 });
  applyTwists(machine, ['closedRow'], makeRng(5));
  assert.equal(machine.blocked.length, machine.cols);
});

test('closedRow keeps the source row open so a spark is still born', () => {
  const machine = boardWith([{ x: 1, y: 1, partId: 'coil', level: 1, rot: 0 }]);
  applyTwists(machine, ['closedRow'], makeRng(3));
  const result = simulate(machine);
  assert.equal(result.banked, 3);
});

test('loneSpark gives 1 spark that starts at 5', () => {
  const machine = applyTwists(boardWith(), ['loneSpark'], makeRng(1));
  assert.equal(machine.sparkCount, 1);
  assert.equal(machine.startValue, 5);
  assert.deepEqual(machine.flags.twistNames, ['Lone Spark']);
  assert.equal(simulate(machine).total, 5);
});

test('noMult bans every part tagged mult and nothing else', () => {
  const machine = applyTwists(boardWith(), ['noMult'], makeRng(1));
  const multIds = partsWithTag('mult').map((p) => p.id);
  assert.ok(multIds.includes('amplifier') && multIds.includes('compounder') && multIds.includes('flywheel'));
  assert.deepEqual(machine.banned.slice().sort(), multIds.slice().sort());
  assert.deepEqual(machine.flags.twistNames, ['No Multipliers']);
});

test('noMult makes an Amplifier act like an empty cell', () => {
  const cells = [{ x: 1, y: 1, partId: 'amplifier', level: 1, rot: 0 }];
  const plain = simulate(boardWith(cells.slice()));
  const machine = applyTwists(boardWith(cells.slice()), ['noMult'], makeRng(1));
  assert.equal(plain.total, 6);
  assert.equal(simulate(machine).total, 3);
});

test('round 4 twists are deterministic for the same seed', () => {
  const a = applyTwists(boardWith(), ['closedRow'], makeRng(9));
  const b = applyTwists(boardWith(), ['closedRow'], makeRng(9));
  assert.deepEqual(a.blocked, b.blocked);
});
