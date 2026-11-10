// Cheated runs earn nothing (contract items 16 to 20).
// Owner: AI-5 (written by AI-1 while AI-5 was out of budget, at the owner's request)
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta, repairMeta } from '../src/meta/metaState.js';
import { recordRunEnd } from '../src/meta/stats.js';
import { recordDaily, hasPlayedDaily } from '../src/meta/daily.js';

function fakeSummary() {
  return { won: true, shiftReached: 8, shiftsCleared: 8, voltage: 1, inventorId: 'tinkerbot',
    daily: '2026-11-10', bestFire: 500, totalBanked: 9000, partsOwned: [], coinsLeft: 0, partLevels: [3, 3] };
}

function copy(value) {
  return JSON.parse(JSON.stringify(value));
}

test('a cheated run earns nothing and leaves the meta untouched', () => {
  const meta = defaultMeta();
  const before = copy(meta);
  const run = { phase: 'won', cheated: true, history: [{}, {}] };
  const result = recordRunEnd(meta, run, { runSummary: fakeSummary });
  assert.deepEqual(result, { dustEarned: 0, newAchievements: [], newUnlocks: [] });
  assert.deepEqual(meta, before);
  assert.equal(hasPlayedDaily(meta, '2026-11-10'), false);
});

test('the same run without cheated does pay (the check is really the flag)', () => {
  const meta = defaultMeta();
  const run = { phase: 'won', history: [{}, {}] };
  const result = recordRunEnd(meta, run, { runSummary: fakeSummary });
  assert.ok(result.dustEarned > 0);
  assert.equal(meta.stats.runs, 1);
});

test('cheated: false still counts as a normal run', () => {
  const meta = defaultMeta();
  const run = { phase: 'lost', cheated: false, history: [] };
  recordRunEnd(meta, run, { runSummary: () => Object.assign(fakeSummary(), { won: false, daily: false }) });
  assert.equal(meta.stats.runs, 1);
});

test('recordDaily ignores a cheated result', () => {
  const meta = defaultMeta();
  recordDaily(meta, '2026-11-10', { won: true, shiftReached: 8, bestFire: 99, cheated: true });
  assert.equal(meta.daily.lastPlayed, '');
  assert.equal(meta.daily.best, null);
  assert.equal(meta.daily.streak, 0);
});

test('repairMeta keeps cheatsUsed only when it is a boolean', () => {
  assert.equal(repairMeta({ cheatsUsed: true }).cheatsUsed, true);
  assert.equal(repairMeta({ cheatsUsed: false }).cheatsUsed, false);
  assert.equal('cheatsUsed' in repairMeta({ cheatsUsed: 'yes' }), false);
  assert.equal('cheatsUsed' in repairMeta({}), false);
});
