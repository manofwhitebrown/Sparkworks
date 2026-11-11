// The Fires and Parts bought stats use the exact counters AI-4 keeps on the run.
// Owner: AI-5
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta } from '../src/meta/metaState.js';
import { recordRunEnd } from '../src/meta/stats.js';
import { newRun } from '../src/run/runState.js';
import { unlockedPartIds } from '../src/meta/patentBook.js';

function lostRun(meta) {
  const run = newRun({ inventorId: 'tinkerbot', voltage: 1, seed: 11, poolIds: unlockedPartIds(meta),
    bonuses: {}, daily: false });
  run.phase = 'lost';
  run.shift = 2;
  run.history = [{ shift: 1, total: 20, target: 10 }];
  return run;
}

test('stats use run.firesUsed and run.partsBought when the run has them', () => {
  const m = defaultMeta();
  const run = lostRun(m);
  run.firesUsed = 3;
  run.partsBought = 5;
  recordRunEnd(m, run);
  assert.equal(m.stats.fires, 3);
  assert.equal(m.stats.partsBought, 5);
});

test('a second run adds to the totals, and a re-recorded run adds nothing', () => {
  const m = defaultMeta();
  const a = lostRun(m);
  a.firesUsed = 2;
  a.partsBought = 4;
  recordRunEnd(m, a);
  recordRunEnd(m, a);
  const b = lostRun(m);
  b.firesUsed = 5;
  b.partsBought = 1;
  recordRunEnd(m, b);
  assert.equal(m.stats.fires, 7);
  assert.equal(m.stats.partsBought, 5);
  assert.equal(m.stats.runs, 2);
});
