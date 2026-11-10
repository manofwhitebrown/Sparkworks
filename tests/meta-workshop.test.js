// Tests for the workshop: buy, refuse, max level, bonuses.
// Owner: AI-5
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta } from '../src/meta/metaState.js';
import { upgradeCost, buyUpgrade, bonusesFor } from '../src/meta/workshop.js';
import { WORKSHOP_UPGRADES } from '../src/data/workshop.js';

test('there are 6 upgrades with rising prices', () => {
  assert.equal(WORKSHOP_UPGRADES.length, 6);
  for (const u of WORKSHOP_UPGRADES) {
    assert.equal(u.costs.length, u.maxLevel);
    for (let i = 1; i < u.costs.length; i++) assert.ok(u.costs[i] > u.costs[i - 1]);
  }
});

test('bonusesFor is all zero by default', () => {
  assert.deepEqual(bonusesFor(defaultMeta()), { startCoins: 0, benchSize: 0, shopSlots: 0, freeRerolls: 0, extraFires: 0 });
});

test('buying costs dust and raises the level', () => {
  const m = defaultMeta();
  m.dust = 20;
  const r = buyUpgrade(m, 'startCoins');
  assert.equal(r.ok, true);
  assert.equal(m.dust, 12);
  assert.equal(bonusesFor(m).startCoins, 1);
});

test('buying is refused when poor, unknown or maxed', () => {
  const m = defaultMeta();
  assert.equal(buyUpgrade(m, 'startCoins').reason, 'poor');
  assert.equal(buyUpgrade(m, 'nothing').reason, 'unknown');
  m.dust = 1000;
  buyUpgrade(m, 'shopSlots');
  assert.equal(upgradeCost(m, 'shopSlots'), null);
  assert.equal(buyUpgrade(m, 'shopSlots').reason, 'maxed');
  assert.equal(m.dust, 960);
});
