// Tests for the dust formula and recordRunEnd.
// Owner: AI-5
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta } from '../src/meta/metaState.js';
import { recordRunEnd, dustFor } from '../src/meta/stats.js';
import { maxVoltageFor } from '../src/meta/voltage.js';

function fakeSummary(overrides) {
  return Object.assign({ won: false, shiftReached: 3, shiftsCleared: 2, voltage: 1, inventorId: 'tinkerbot',
    daily: false, bestFire: 50, totalBanked: 120, partsOwned: [], coinsLeft: 0 }, overrides);
}

function deps(overrides) {
  return { runSummary: () => fakeSummary(overrides) };
}

test('dust formula without dustBoost', () => {
  const m = defaultMeta();
  assert.equal(dustFor(m, fakeSummary({ shiftsCleared: 2 })), 6);
  assert.equal(dustFor(m, fakeSummary({ shiftsCleared: 8, won: true })), 28);
  assert.equal(dustFor(m, fakeSummary({ shiftsCleared: 8, won: true, voltage: 3 })), 34);
});

test('dust formula with dustBoost rounds down', () => {
  const m = defaultMeta();
  m.upgrades.dustBoost = 3;
  assert.equal(dustFor(m, fakeSummary({ shiftsCleared: 2 })), 7);
  m.upgrades.dustBoost = 5;
  assert.equal(dustFor(m, fakeSummary({ shiftsCleared: 8, won: true })), 42);
});

test('recordRunEnd updates stats and pays dust', () => {
  const m = defaultMeta();
  const run = { phase: 'lost', history: [{}, {}, {}, {}] };
  const r = recordRunEnd(m, run, deps({}));
  assert.equal(r.dustEarned, 6);
  assert.equal(m.stats.runs, 1);
  assert.equal(m.stats.wins, 0);
  assert.equal(m.stats.bestTotal, 120);
  assert.equal(m.stats.fires, 4);
  assert.ok(m.dust >= 6);
});

test('recordRunEnd records a run only once', () => {
  const m = defaultMeta();
  const run = { phase: 'lost', history: [] };
  recordRunEnd(m, run, deps({}));
  const dust = m.dust;
  const again = recordRunEnd(m, run, deps({}));
  assert.equal(again.dustEarned, 0);
  assert.equal(m.stats.runs, 1);
  assert.equal(m.dust, dust);
});

test('recordRunEnd ignores a run that is not finished', () => {
  const m = defaultMeta();
  const r = recordRunEnd(m, { phase: 'build' }, deps({}));
  assert.equal(r.dustEarned, 0);
  assert.equal(m.stats.runs, 0);
});

test('a win records voltage progress and returns unlocks', () => {
  const m = defaultMeta();
  const run = { phase: 'won', history: [] };
  const r = recordRunEnd(m, run, deps({ won: true, shiftsCleared: 8, shiftReached: 8 }));
  assert.equal(r.dustEarned, 28);
  assert.equal(m.stats.wins, 1);
  assert.equal(maxVoltageFor(m, 'tinkerbot'), 2);
  assert.ok(r.newAchievements.length > 0);
  assert.ok(r.newUnlocks.some((u) => u.type === 'part' && u.id === 'reverser'));
});

test('a daily run records the result of the day and the streak', () => {
  const m = defaultMeta();
  const run = { phase: 'lost', history: [] };
  recordRunEnd(m, run, deps({ daily: '2026-11-10', shiftReached: 5, bestFire: 900 }));
  assert.equal(m.daily.lastPlayed, '2026-11-10');
  assert.equal(m.daily.streak, 1);
  assert.equal(m.daily.best.shiftReached, 5);
  assert.equal(m.daily.best.bestFire, 900);
});
