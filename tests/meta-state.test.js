// Tests for defaultMeta and repairMeta: garbage in, valid meta out, never throws.
// Owner: AI-5
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta, repairMeta, STARTING_PARTS } from '../src/meta/metaState.js';

const deps = { allPartIds: () => STARTING_PARTS.concat(['rare1', 'rare2']) };

test('defaultMeta starts with 12 parts and tinkerbot', () => {
  const m = defaultMeta();
  assert.equal(m.unlockedParts.length, 12);
  assert.deepEqual(m.unlockedInventors, ['tinkerbot']);
  assert.equal(m.dust, 0);
});

test('repairMeta survives garbage without throwing', () => {
  const garbage = [undefined, null, 5, 'x', [], {}, { dust: 'lots', upgrades: 7, daily: 'no', settings: [] }];
  for (let i = 0; i < garbage.length; i++) {
    const m = repairMeta(garbage[i], deps);
    assert.equal(m.v, 1);
    assert.equal(m.unlockedParts.length, 12);
    assert.equal(m.dust, 0);
  }
});

test('repairMeta removes unknown part ids and keeps valid ones', () => {
  const m = repairMeta({ unlockedParts: ['rare1', 'ghost', 'coil'], seenParts: ['ghost', 'rare2'] }, deps);
  assert.ok(m.unlockedParts.includes('rare1'));
  assert.ok(!m.unlockedParts.includes('ghost'));
  assert.deepEqual(m.seenParts, ['rare2']);
});

test('repairMeta clamps numbers and upgrade levels', () => {
  const m = repairMeta({ dust: -50, upgrades: { startCoins: 99, nope: 3, benchSize: 2 } }, deps);
  assert.equal(m.dust, 0);
  assert.equal(m.upgrades.startCoins, 5);
  assert.equal(m.upgrades.benchSize, 2);
  assert.equal(m.upgrades.nope, undefined);
});

test('repairMeta keeps valid progress', () => {
  const start = defaultMeta();
  start.dust = 42;
  start.wins.tinkerbot = { '1': true };
  start.settings.quality = 'high';
  const m = repairMeta(JSON.parse(JSON.stringify(start)), deps);
  assert.equal(m.dust, 42);
  assert.equal(m.wins.tinkerbot['1'], true);
  assert.equal(m.settings.quality, 'high');
});
