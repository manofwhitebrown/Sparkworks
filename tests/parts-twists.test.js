// Twist behaviour and (skipped until AI-2 pushes it) real simulate combos.
// Owner: AI-3
import test from 'node:test';
import assert from 'node:assert/strict';
import { TWISTS, getTwist, applyTwists } from '../src/engine/twists.js';
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

