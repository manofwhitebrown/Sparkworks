// Tests for the meta cheats and the safety net (snapshot, export, import).
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { defaultMeta, repairMeta } from '../src/meta/metaState.js';
import { maxVoltageFor } from '../src/meta/voltage.js';
import { unlockedPartIds } from '../src/meta/patentBook.js';
import { allPartIds } from '../src/engine/parts/index.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { newRun } from '../src/run/runState.js';
import { makeEnv } from '../src/cheats/cheatEnv.js';
import * as mc from '../src/cheats/metaCheats.js';

function assertMetaValid(meta) {
  assert.deepStrictEqual(repairMeta(meta), meta, 'repairMeta must change nothing');
}

test('dust: +50 / +500 / +5000 and never negative', () => {
  const meta = defaultMeta();
  assert.strictEqual(mc.addDust(meta, 50).ok, true);
  mc.addDust(meta, 500);
  mc.addDust(meta, 5000);
  assert.strictEqual(meta.dust, 5550);
  assert.strictEqual(meta.cheatsUsed, true);
  mc.addDust(meta, -999999);
  assert.strictEqual(meta.dust, 0);
  assert.strictEqual(mc.addDust(meta, NaN).ok, false);
  assertMetaValid(meta);
});

test('a refused meta cheat does not set cheatsUsed', () => {
  const meta = defaultMeta();
  mc.addDust(meta, Infinity);
  assert.strictEqual(meta.cheatsUsed, undefined);
});

test('unlock all parts, inventors, voltages, achievements', () => {
  const meta = defaultMeta();
  mc.unlockAllParts(meta);
  mc.unlockAllInventors(meta);
  mc.maxAllVoltages(meta);
  mc.completeAllAchievements(meta);
  assert.strictEqual(unlockedPartIds(meta).length, allPartIds().length);
  assert.deepStrictEqual(meta.unlockedInventors, ['tinkerbot', 'clockmaker', 'drvolt']);
  assert.strictEqual(maxVoltageFor(meta, 'tinkerbot'), 4);
  assert.strictEqual(maxVoltageFor(meta, 'drvolt'), 4);
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    assert.strictEqual(meta.achievements[ACHIEVEMENTS[i].id], true);
  }
  assert.strictEqual(meta.dust, 0, 'achievement rewards are not paid');
  assert.strictEqual(meta.stats.wins, 0, 'no fake win count');
  assertMetaValid(meta);
});

test('seen, tutorial reset and daily reset', () => {
  const meta = defaultMeta();
  meta.tutorialDone = true;
  meta.daily.lastPlayed = '2026-11-10';
  mc.markAllSeen(meta);
  mc.resetTutorial(meta);
  mc.allowDailyAgain(meta);
  assert.strictEqual(meta.seenParts.length, allPartIds().length);
  assert.strictEqual(meta.tutorialDone, false);
  assert.strictEqual(meta.daily.lastPlayed, '');
  assertMetaValid(meta);
});

test('every meta cheat in a row still leaves a valid meta', () => {
  const meta = defaultMeta();
  mc.addDust(meta, 5000);
  mc.unlockAllParts(meta);
  mc.unlockAllInventors(meta);
  mc.maxAllVoltages(meta);
  mc.completeAllAchievements(meta);
  mc.markAllSeen(meta);
  mc.resetTutorial(meta);
  mc.allowDailyAgain(meta);
  assertMetaValid(meta);
});

test('undo restores the snapshot IN PLACE (the app keeps the same object)', () => {
  const meta = defaultMeta();
  meta.dust = 12;
  const same = meta;
  const snap = mc.takeSnapshot(meta);
  mc.addDust(meta, 5000);
  mc.unlockAllParts(meta);
  mc.completeAllAchievements(meta);
  assert.strictEqual(mc.restoreSnapshot(meta, snap).ok, true);
  assert.strictEqual(meta, same);
  const expected = defaultMeta();
  expected.dust = 12;
  assert.deepStrictEqual(meta, expected);
  assert.strictEqual(meta.cheatsUsed, undefined);
  // restoring twice works, and the snapshot is not shared with the live object
  mc.addDust(meta, 1);
  mc.restoreSnapshot(meta, snap);
  assert.strictEqual(meta.dust, 12);
  assert.strictEqual(mc.restoreSnapshot(meta, null).ok, false);
});

test('export then import gives the same meta and run', () => {
  const meta = defaultMeta();
  mc.addDust(meta, 500);
  const run = newRun({ inventorId: 'tinkerbot', voltage: 1, seed: 5, poolIds: allPartIds(), bonuses: {} });
  const text = mc.exportSave(meta, run);
  const other = defaultMeta();
  const out = mc.importSave(text, other);
  assert.strictEqual(out.ok, true);
  assert.deepStrictEqual(other, meta);
  assert.deepStrictEqual(out.run, run);
});

test('import refuses junk and changes nothing', () => {
  const meta = defaultMeta();
  const before = JSON.stringify(meta);
  assert.strictEqual(mc.importSave('not json', meta).ok, false);
  assert.strictEqual(mc.importSave('{"a":1}', meta).ok, false);
  assert.strictEqual(mc.importSave('null', meta).ok, false);
  const badRun = JSON.stringify({ sparkworksSave: 1, meta: defaultMeta(), run: { machine: { cols: 0 }, bench: [] } });
  assert.strictEqual(mc.importSave(badRun, meta).ok, false);
  assert.strictEqual(JSON.stringify(meta), before);
});

test('import of a save with no run works, and a damaged meta is repaired', () => {
  const meta = defaultMeta();
  const text = JSON.stringify({ sparkworksSave: 1, meta: { dust: 'lots', unlockedParts: 'x' }, run: null });
  const out = mc.importSave(text, meta);
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.run, null);
  assertMetaValid(meta);
});

test('env: meta cheat saves the meta, applies settings and sends cheat:changed', () => {
  const meta = defaultMeta();
  const log = { metaSaved: 0, applied: 0, events: [], toasts: [] };
  const env = makeEnv({
    getRun: function () { return null; },
    getMeta: function () { return meta; },
    saveRun: function () {},
    saveMeta: function () { log.metaSaved++; },
    emit: function (name, data) { log.events.push([name, data.what]); },
    toast: function (t) { log.toasts.push(t); },
    applySettings: function () { log.applied++; }
  });
  env.doMeta('dust', function (m) { return mc.addDust(m, 50); });
  assert.strictEqual(meta.dust, 50);
  assert.strictEqual(log.metaSaved, 1);
  assert.strictEqual(log.applied, 1);
  assert.deepStrictEqual(log.events, [['cheat:changed', 'dust']]);
  env.doMeta('dust', function (m) { return mc.addDust(m, NaN); });
  assert.strictEqual(log.metaSaved, 1);
});
