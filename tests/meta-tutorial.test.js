// The tutorial run is practice: it never pays dust, counts stats, wins, achievements or the daily.
// Owner: AI-5
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta } from '../src/meta/metaState.js';
import { recordRunEnd } from '../src/meta/stats.js';
import { recordDaily, hasPlayedDaily } from '../src/meta/daily.js';
import { allPartIds } from '../src/engine/parts/index.js';
import { unlockedPartIds } from '../src/meta/patentBook.js';

function fakeSummary() {
  return { won: true, shiftReached: 8, shiftsCleared: 8, voltage: 1, inventorId: 'tinkerbot',
    daily: '2026-11-10', bestFire: 5000, totalBanked: 9000, partsOwned: [], coinsLeft: 30, partLevels: [3, 3, 3] };
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

test('a tutorial run earns nothing and leaves the meta untouched', () => {
  const meta = defaultMeta();
  const before = copy(meta);
  const run = { phase: 'won', tutorial: true, history: [{}, {}] };
  const result = recordRunEnd(meta, run, { runSummary: fakeSummary });
  assert.deepEqual(result, { dustEarned: 0, newAchievements: [], newUnlocks: [] });
  assert.deepEqual(meta, before);
  assert.equal(hasPlayedDaily(meta, '2026-11-10'), false);
});

test('a tutorial run is not marked recorded, and a normal run still pays', () => {
  const meta = defaultMeta();
  const tut = { phase: 'lost', tutorial: true, history: [{}] };
  recordRunEnd(meta, tut, { runSummary: fakeSummary });
  assert.notEqual(tut.recorded, true);
  const real = { phase: 'lost', history: [{}] };
  const result = recordRunEnd(meta, real, { runSummary: fakeSummary });
  assert.ok(result.dustEarned > 0);
  assert.equal(meta.stats.runs, 1);
});

test('recordDaily ignores a tutorial result', () => {
  const meta = defaultMeta();
  recordDaily(meta, '2026-11-10', { won: true, shiftReached: 8, bestFire: 100, tutorial: true });
  assert.equal(hasPlayedDaily(meta, '2026-11-10'), false);
  assert.equal(meta.daily.streak, 0);
});

test('a fresh save has 12 starting parts out of the whole library (Patent Book "12 of N found")', () => {
  const meta = defaultMeta();
  assert.equal(unlockedPartIds(meta).length, 12);
  assert.ok(allPartIds().length > 12);
});
