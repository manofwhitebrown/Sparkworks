// Tests for newRun, targets and the board actions.
// Owner: AI-4
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, getTarget, placeFromBench, moveOnBoard, rotatePart, returnToBench, startNextShift } from '../src/run/runState.js';
import { makeDeps, FAKE_POOL } from './run-fakes.js';

function fresh(options) {
  const opts = Object.assign({ inventorId: 'tinkerbot', voltage: 1, seed: 7, poolIds: FAKE_POOL }, options || {});
  return newRun(opts, makeDeps());
}

test('newRun builds the kit, coins and shift 1', () => {
  const run = fresh();
  assert.equal(run.shift, 1);
  assert.equal(run.phase, 'build');
  assert.equal(run.coins, 6);
  assert.equal(run.firesLeft, 2);
  assert.deepEqual(run.bench.map((b) => b.partId), ['coil', 'coil', 'bend', 'amplifier']);
  assert.equal(run.machine.sparkCount, 3);
});

test('newRun applies bonuses and the inventor passive', () => {
  const bonuses = { startCoins: 3, extraFires: 1, benchSize: 2 };
  const run = fresh({ inventorId: 'drvolt', bonuses: bonuses });
  assert.equal(run.coins, 8);
  assert.equal(run.firesLeft, 3);
  assert.equal(run.machine.sparkCount, 2);
  assert.equal(run.machine.startValue, 2);
});

test('targets per shift and voltage', () => {
  const run = fresh();
  assert.equal(getTarget(run), 24);
  run.shift = 2;
  assert.equal(getTarget(run), 50);
  run.shift = 8;
  assert.equal(getTarget(run), Math.round(24 * Math.pow(2.1, 7)));
  run.voltage = 2;
  assert.equal(getTarget(run), Math.round(24 * Math.pow(2.1, 7) * 1.35));
  run.voltage = 4;
  run.shift = 1;
  assert.equal(getTarget(run), Math.round(24 * 2.4));
});

test('place, move (swap), rotate and return to bench', () => {
  const run = fresh();
  assert.deepEqual(placeFromBench(run, 0, 0, 1, 0), { ok: true });
  assert.deepEqual(placeFromBench(run, 0, 1, 1, 1), { ok: true });
  assert.equal(run.bench.length, 2);
  assert.deepEqual(moveOnBoard(run, 0, 1, 1, 1), { ok: true });
  const cells = run.machine.cells;
  // the swap brought the rot-0 part to (1, 1) and the rot-1 part to (0, 1)
  assert.equal(cells.find((c) => c.x === 1 && c.y === 1).rot, 0);
  assert.equal(cells.find((c) => c.x === 0 && c.y === 1).rot, 1);
  assert.deepEqual(rotatePart(run, 1, 1), { ok: true });
  assert.equal(cells.find((c) => c.x === 1 && c.y === 1).rot, 1);
  assert.deepEqual(returnToBench(run, 1, 1), { ok: true });
  assert.equal(run.bench.length, 3);
  assert.equal(run.machine.cells.length, 1);
});

test('moving onto an occupied cell swaps the two parts', () => {
  const run = fresh();
  placeFromBench(run, 0, 0, 1, 0);
  placeFromBench(run, 2, 1, 1, 0);
  moveOnBoard(run, 0, 1, 1, 1);
  const a = run.machine.cells.find((c) => c.x === 0 && c.y === 1);
  const b = run.machine.cells.find((c) => c.x === 1 && c.y === 1);
  assert.equal(a.partId, 'amplifier');
  assert.equal(b.partId, 'coil');
});

test('refuses outside, blocked, occupied cells and missing parts', () => {
  const run = fresh();
  assert.equal(placeFromBench(run, 0, 9, 0, 0).reason, 'outside_board');
  run.machine.blocked.push({ x: 2, y: 2 });
  assert.equal(placeFromBench(run, 0, 2, 2, 0).reason, 'blocked_cell');
  assert.equal(placeFromBench(run, 99, 0, 0, 0).reason, 'no_such_bench_part');
  placeFromBench(run, 0, 0, 0, 0);
  assert.equal(placeFromBench(run, 0, 0, 0, 0).reason, 'cell_occupied');
  assert.equal(moveOnBoard(run, 0, 0, 2, 2).reason, 'blocked_cell');
  assert.equal(moveOnBoard(run, 3, 3, 1, 1).reason, 'no_part_there');
  assert.equal(rotatePart(run, 4, 3).reason, 'no_part_there');
});

test('returnToBench refuses when the bench is full', () => {
  const run = fresh();
  placeFromBench(run, 0, 0, 0, 0);
  run.bench.push({ partId: 'bend', level: 1 });
  run.bench.push({ partId: 'ember', level: 1 });
  run.bench.push({ partId: 'ember', level: 2 });
  assert.equal(run.bench.length, 6);
  assert.equal(returnToBench(run, 0, 0).reason, 'bench_full');
});

test('board actions refuse outside the build phase', () => {
  const run = fresh();
  run.phase = 'shop';
  assert.equal(placeFromBench(run, 0, 0, 0, 0).reason, 'wrong_phase');
  assert.equal(moveOnBoard(run, 0, 0, 1, 1).reason, 'wrong_phase');
  assert.equal(rotatePart(run, 0, 0).reason, 'wrong_phase');
  assert.equal(returnToBench(run, 0, 0).reason, 'wrong_phase');
  assert.equal(startNextShift(fresh()).reason, 'wrong_phase');
});

test('a twist that blocks an occupied cell sends the part to the bench', () => {
  const run = fresh();
  placeFromBench(run, 0, 2, 1, 0);
  run.phase = 'shop';
  run.shift = 3;
  const result = startNextShift(run, makeDeps());
  assert.equal(run.shift, 4);
  assert.deepEqual(run.machine.blocked, [{ x: 2, y: 1 }]);
  assert.equal(run.machine.cells.length, 0);
  assert.equal(result.movedToBench.length, 1);
  assert.equal(run.bench.length, 4);
});

test('a full bench sells the displaced part instead', () => {
  const run = fresh();
  placeFromBench(run, 0, 2, 1, 0);
  while (run.bench.length < 5) {
    run.bench.push({ partId: 'bend', level: 1 });
  }
  run.phase = 'shop';
  run.shift = 3;
  const coinsBefore = run.coins;
  const result = startNextShift(run, makeDeps());
  assert.equal(result.sold.length, 1);
  assert.equal(run.coins, coinsBefore + 1);
  assert.equal(run.bench.length, 5);
});
