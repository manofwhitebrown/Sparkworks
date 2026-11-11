// Tests for the two new inventors (Ms. Bounce, The Banker) and the new twist in the voltage table.
// Owner: AI-4
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, fire, startNextShift } from '../src/run/runState.js';
import { INVENTORS, getInventor } from '../src/data/inventors.js';
import { getVoltage } from '../src/data/voltage.js';
import { getPart } from '../src/engine/parts/index.js';
import { getTwist } from '../src/engine/twists.js';
import { makeDeps, FAKE_POOL } from './run-fakes.js';

function fresh(deps, inventorId) {
  return newRun({ inventorId: inventorId, voltage: 1, seed: 5, poolIds: FAKE_POOL }, deps);
}

test('every kit part and every twist in the data tables really exists', () => {
  for (let i = 0; i < INVENTORS.length; i++) {
    for (let p = 0; p < INVENTORS[i].startParts.length; p++) {
      assert.ok(getPart(INVENTORS[i].startParts[p]), INVENTORS[i].id + ' kit part');
    }
  }
  for (let level = 1; level <= 4; level++) {
    const byShift = getVoltage(level).twistsByShift;
    for (const shift in byShift) {
      for (let t = 0; t < byShift[shift].length; t++) {
        assert.ok(getTwist(byShift[shift][t]), 'twist ' + byShift[shift][t]);
      }
    }
  }
});

test('Ms. Bounce: kit on the bench and one extra shop slot', () => {
  const inventor = getInventor('msbounce');
  const run = fresh(makeDeps([1]), 'msbounce');
  assert.deepEqual(run.bench.map((b) => b.partId), inventor.startParts);
  assert.equal(run.coins, inventor.startCoins);
  assert.equal(inventor.passive.shopSlots, 1);
});

test('The Banker: +2 coins at the start of every shift, shift 1 included', () => {
  const deps = makeDeps([100000]);
  const run = fresh(deps, 'banker');
  const startCoins = getInventor('banker').startCoins;
  assert.equal(run.coins, startCoins + 2);
  fire(run, deps);
  const afterShop = run.coins;
  startNextShift(run, deps);
  assert.equal(run.coins, afterShop + 2);
});

test('other inventors get no coins at shift start', () => {
  const deps = makeDeps([100000]);
  const run = fresh(deps, 'tinkerbot');
  assert.equal(run.coins, getInventor('tinkerbot').startCoins);
});

test('voltage 4 shift 6 uses the noMult twist', () => {
  assert.deepEqual(getVoltage(4).twistsByShift[6], ['noMult']);
});
