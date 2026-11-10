// Plays whole runs on the REAL engine and parts (no fakes), checking only things that must always hold.
// Owner: AI-4
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, fire, startNextShift, placeFromBench } from '../src/run/runState.js';
import { buyOffer, makeOffers } from '../src/run/shop.js';
import { allPartIds } from '../src/engine/parts/index.js';
import { INVENTORS } from '../src/data/inventors.js';

// Put every bench part on the source row, left to right, while there is room.
function fillRow(run) {
  const row = run.machine.sourceRow;
  for (let x = 0; x < run.machine.cols; x++) {
    if (run.bench.length === 0) {
      return;
    }
    const taken = run.machine.cells.some((c) => c.x === x && c.y === row);
    const blocked = run.machine.blocked.some((c) => c.x === x && c.y === row);
    if (!taken && !blocked) {
      placeFromBench(run, 0, x, row, 0);
    }
  }
}

// Buy whatever we can afford, then go on. Returns when the run is over.
function playRun(inventorId, voltage, seed) {
  const run = newRun({ inventorId: inventorId, voltage: voltage, seed: seed, poolIds: allPartIds() });
  let guard = 0;
  while (run.phase !== 'won' && run.phase !== 'lost' && guard < 100) {
    guard++;
    if (run.phase === 'build') {
      fillRow(run);
      const out = fire(run);
      assert.equal(out.ok, true);
      assert.ok(Number.isFinite(out.result.total));
    } else {
      for (let i = 0; i < run.offers.length; i++) {
        buyOffer(run, i);
      }
      assert.equal(startNextShift(run).ok, true);
    }
  }
  return run;
}

test('every inventor can play a whole run without errors', () => {
  for (const inv of INVENTORS) {
    const run = playRun(inv.id, 1, 3);
    assert.ok(run.phase === 'won' || run.phase === 'lost', inv.id);
    assert.ok(run.history.length >= 1 && run.history.length <= 8);
    assert.deepEqual(JSON.parse(JSON.stringify(run)), run);
  }
});

test('the same seed and actions give the same run on the real engine', () => {
  const a = playRun('tinkerbot', 2, 21);
  const b = playRun('tinkerbot', 2, 21);
  assert.deepEqual(a, b);
});

test('real offers only use parts from the pool and never repeat in one shop', () => {
  const pool = allPartIds();
  const run = newRun({ inventorId: 'drvolt', voltage: 1, seed: 8, poolIds: pool });
  for (let shift = 1; shift <= 8; shift++) {
    run.shift = shift;
    for (let i = 0; i < 25; i++) {
      makeOffers(run);
      const ids = run.offers.map((o) => o.partId);
      assert.equal(ids.length, 3);
      assert.equal(new Set(ids).size, 3);
      assert.ok(ids.every((id) => pool.indexOf(id) >= 0));
    }
  }
});
