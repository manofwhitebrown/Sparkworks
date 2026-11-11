// The Hint helper: picks the placement with the biggest Fire total, never changes the run.
// Uses the REAL engine and parts. Owner: AI-8

import test from 'node:test';
import assert from 'node:assert/strict';
import { suggestPlacement } from '../src/tutorial/suggest.js';
import { simulate } from '../src/engine/simulate.js';
import { makeMachine, placePart, cloneMachine } from '../src/engine/board.js';

function runWith(bench, cells) {
  const machine = makeMachine({ seed: 5 });
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    placePart(machine, c.x, c.y, c.partId, c.level || 1, c.rot || 0);
  }
  return { machine: machine, bench: bench, firesLeft: 2 };
}

test('returns null when the bench is empty or the run is missing', () => {
  assert.equal(suggestPlacement(runWith([], []), undefined), null);
  assert.equal(suggestPlacement(null), null);
  assert.equal(suggestPlacement({}), null);
});

test('a single coil goes on the spark line', () => {
  const run = runWith([{ partId: 'coil', level: 1 }], []);
  const hint = suggestPlacement(run);
  assert.ok(hint);
  assert.equal(hint.partIndex, 0);
  assert.equal(hint.y, run.machine.sourceRow);
});

test('an amplifier is put AFTER the coil, not before it', () => {
  const run = runWith([{ partId: 'amplifier', level: 1 }], [{ x: 1, y: 1, partId: 'coil' }]);
  const hint = suggestPlacement(run);
  assert.ok(hint);
  assert.ok(hint.x > 1, 'amplifier should be right of the coil, got x=' + hint.x);
  assert.equal(hint.y, 1);
});

test('the suggestion really raises the total, and the run is not changed', () => {
  const run = runWith([{ partId: 'amplifier', level: 1 }, { partId: 'coil', level: 1 }],
    [{ x: 2, y: 1, partId: 'coil' }]);
  const before = JSON.stringify(run);
  const base = simulate(run.machine, { recordEvents: false }).total;
  const hint = suggestPlacement(run);
  assert.equal(JSON.stringify(run), before);
  const m = cloneMachine(run.machine);
  placePart(m, hint.x, hint.y, run.bench[hint.partIndex].partId, 1, hint.rot);
  assert.ok(simulate(m, { recordEvents: false }).total > base);
});

test('directional parts get a rotation between 0 and 3', () => {
  const run = runWith([{ partId: 'bend', level: 1 }, { partId: 'coil', level: 1 }], []);
  const hint = suggestPlacement(run);
  assert.ok(hint.rot >= 0 && hint.rot <= 3);
});

test('a full board gives null', () => {
  const cells = [];
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 5; x++) {
      cells.push({ x: x, y: y, partId: 'coil' });
    }
  }
  assert.equal(suggestPlacement(runWith([{ partId: 'coil', level: 1 }], cells)), null);
});

test('fast: 5x4 board with 5 bench parts under 20 ms on average', () => {
  const bench = ['coil', 'amplifier', 'bend', 'splitter', 'dynamo'].map(function item(id) {
    return { partId: id, level: 1 };
  });
  const run = runWith(bench, [{ x: 1, y: 1, partId: 'coil' }]);
  suggestPlacement(run); // warm up
  const start = process.hrtime.bigint();
  for (let i = 0; i < 10; i++) {
    suggestPlacement(run);
  }
  const ms = Number(process.hrtime.bigint() - start) / 1e6 / 10;
  assert.ok(ms < 20, 'took ' + ms.toFixed(1) + ' ms');
});
