// Integration: a real finished run (newRun + runSummary) is counted exactly once.
// Owner: AI-5
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta } from '../src/meta/metaState.js';
import { recordRunEnd } from '../src/meta/stats.js';
import { newRun } from '../src/run/runState.js';
import { unlockedPartIds } from '../src/meta/patentBook.js';
import { bonusesFor } from '../src/meta/workshop.js';

function finishedRun(meta, phase, daily) {
  const run = newRun({ inventorId: 'tinkerbot', voltage: 1, seed: 7, poolIds: unlockedPartIds(meta),
    bonuses: bonusesFor(meta), daily: daily });
  run.phase = phase;
  run.shift = phase === 'won' ? 8 : 3;
  run.history = [{ shift: 1, total: 20, target: 10 }, { shift: 2, total: 30, target: 15 }, { shift: 3, total: 1, target: 25 }];
  if (phase === 'won') {
    run.history = [];
    for (let i = 1; i <= 8; i++) run.history.push({ shift: i, total: 20, target: 10 });
  }
  run.bestFire = 30;
  return run;
}

test('a real lost run is counted once, even if the results screen runs twice', () => {
  const m = defaultMeta();
  const run = finishedRun(m, 'lost', false);
  const first = recordRunEnd(m, run);
  const dust = m.dust;
  const second = recordRunEnd(m, run);
  assert.ok(first.dustEarned > 0);
  assert.equal(second.dustEarned, 0);
  assert.equal(m.dust, dust);
  assert.equal(m.stats.runs, 1);
});

test('a real daily run records the daily result and streak once', () => {
  const m = defaultMeta();
  const run = finishedRun(m, 'lost', '2026-11-10');
  recordRunEnd(m, run);
  recordRunEnd(m, run);
  assert.equal(m.daily.lastPlayed, '2026-11-10');
  assert.equal(m.daily.streak, 1);
  assert.ok(m.achievements.dailyDone);
  assert.ok(m.unlockedParts.includes('mint'));
});

test('a real won run unlocks voltage 2 and rewards from the run', () => {
  const m = defaultMeta();
  const run = finishedRun(m, 'won', false);
  const r = recordRunEnd(m, run);
  assert.ok(r.dustEarned >= 28);
  assert.ok(m.wins.tinkerbot['1']);
  assert.ok(r.newUnlocks.length > 0);
});

test('part levels are read from the run when the summary has none', () => {
  const m = defaultMeta();
  const run = finishedRun(m, 'lost', false);
  run.bench = [{ partId: 'coil', level: 3 }, { partId: 'bend', level: 2 }, { partId: 'coil', level: 2 }, { partId: 'switch', level: 2 }];
  run.machine.cells = [];
  recordRunEnd(m, run);
  assert.ok(m.achievements.levelThree);
  assert.ok(m.achievements.trio);
});
