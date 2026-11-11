// Tests for Gentle mode, bonus tiles and the loss tip facts (round 4).
// Owner: AI-4
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, fire, startNextShift, runSummary, getTarget } from '../src/run/runState.js';
import { makeBonusCells, bonusCellCount } from '../src/run/bonusCells.js';
import { buyOffer } from '../src/run/shop.js';
import { SHIFT_RULES, GENTLE_RULES, BONUS_CELL_RULES } from '../src/data/shifts.js';
import { getVoltage } from '../src/data/voltage.js';
import { makeDeps, FAKE_POOL } from './run-fakes.js';

function fresh(deps, options) {
  const opts = Object.assign({ inventorId: 'tinkerbot', voltage: 1, seed: 21, poolIds: FAKE_POOL }, options || {});
  return newRun(opts, deps);
}

// Clears shifts until the run is at `shift` (the fake simulate always passes).
function playUpTo(run, deps, shift) {
  while (run.shift < shift) {
    fire(run, deps);
    startNextShift(run, deps);
  }
}

test('gentle mode: one more Fire, targets x0.7, more start coins', () => {
  const deps = makeDeps([1]);
  const normal = fresh(deps);
  const gentle = fresh(deps, { bonuses: { gentle: true } });
  assert.equal(gentle.firesLeft, normal.firesLeft + GENTLE_RULES.extraFires);
  assert.equal(gentle.coins, normal.coins + GENTLE_RULES.startCoins);
  assert.equal(gentle.bonuses.gentle, true);
  assert.equal(getTarget(gentle), Math.round(getTarget(normal) * GENTLE_RULES.targetMultiplier));
  assert.equal(runSummary(gentle, deps).gentle, true);
  assert.equal(runSummary(normal, deps).gentle, false);
});

test('gentle mode keeps its Fire bonus in later shifts and stacks with voltage', () => {
  const deps = makeDeps([100000]);
  const run = fresh(deps, { voltage: 2, bonuses: { gentle: true, extraFires: 1 } });
  assert.equal(run.firesLeft, SHIFT_RULES.firesPerShift + 1 + GENTLE_RULES.extraFires);
  fire(run, deps);
  startNextShift(run, deps);
  assert.equal(run.firesLeft, SHIFT_RULES.firesPerShift + 1 + GENTLE_RULES.extraFires);
  const raw = SHIFT_RULES.targetBase * SHIFT_RULES.targetGrowth * getVoltage(2).targetMultiplier;
  assert.equal(getTarget(run), Math.round(raw * GENTLE_RULES.targetMultiplier));
});

test('bonus tiles: none on shift 1, one on shifts 2 to 4, two from shift 5', () => {
  assert.equal(bonusCellCount(1), 0);
  assert.equal(bonusCellCount(2), 1);
  assert.equal(bonusCellCount(4), 1);
  assert.equal(bonusCellCount(5), 2);
  assert.equal(bonusCellCount(8), 2);
  const deps = makeDeps([100000]);
  const run = fresh(deps);
  assert.deepEqual(run.machine.bonusCells, []);
  playUpTo(run, deps, 2);
  assert.equal(run.machine.bonusCells.length, 1);
  playUpTo(run, deps, 5);
  assert.equal(run.machine.bonusCells.length, 2);
});

test('bonus tiles never sit on the source row, a blocked cell or a part', () => {
  const deps = makeDeps([100000]);
  for (let seed = 1; seed <= 60; seed++) {
    const run = fresh(deps, { seed: seed, voltage: 3 });
    run.machine.cells.push({ x: 1, y: 0, partId: 'coil', level: 1, rot: 0 });
    run.machine.cells.push({ x: 3, y: 2, partId: 'coil', level: 1, rot: 0 });
    for (let shift = 2; shift <= 8; shift++) {
      run.shift = shift;
      run.machine.blocked = [{ x: 2, y: 3 }];
      const tiles = makeBonusCells(run);
      assert.equal(tiles.length, bonusCellCount(shift));
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        assert.notEqual(t.y, run.machine.sourceRow);
        assert.equal(t.x === 2 && t.y === 3, false);
        assert.equal(t.x === 1 && t.y === 0, false);
        assert.equal(t.x === 3 && t.y === 2, false);
      }
    }
  }
});

test('bonus tile amounts: shifts 2-4 add 3..6, multipliers only from shift 5', () => {
  const deps = makeDeps([100000]);
  let sawMult = false;
  for (let seed = 1; seed <= 120; seed++) {
    const run = fresh(deps, { seed: seed });
    for (let shift = 2; shift <= 8; shift++) {
      run.shift = shift;
      const tiles = makeBonusCells(run);
      for (let i = 0; i < tiles.length; i++) {
        const t = tiles[i];
        if (shift < BONUS_CELL_RULES.laterShift) {
          assert.equal(t.kind, 'add');
          assert.ok(t.amount >= BONUS_CELL_RULES.addMin && t.amount <= BONUS_CELL_RULES.addMax);
        } else if (t.kind === 'mult') {
          sawMult = true;
          assert.equal(t.amount, BONUS_CELL_RULES.multAmount);
        } else {
          assert.ok(t.amount >= BONUS_CELL_RULES.laterAddMin && t.amount <= BONUS_CELL_RULES.laterAddMax);
        }
      }
    }
  }
  assert.equal(sawMult, true);
});

test('bonus tiles: same seed and same actions give the same tiles, also after save and load', () => {
  const deps = makeDeps([100000]);
  const a = fresh(deps, { seed: 77 });
  const b = fresh(deps, { seed: 77 });
  playUpTo(a, deps, 6);
  playUpTo(b, deps, 3);
  const loaded = JSON.parse(JSON.stringify(b));
  playUpTo(loaded, deps, 6);
  assert.deepEqual(a.machine.bonusCells, loaded.machine.bonusCells);
  assert.deepEqual(a.machine.bonusCells.length, 2);
});

test('bonus tiles are sent to the simulate copy of the machine', () => {
  const deps = makeDeps([1]);
  const run = fresh(deps);
  run.machine.bonusCells = [{ x: 1, y: 0, kind: 'add', amount: 3 }];
  fire(run, deps);
  assert.deepEqual(deps.simulate.state.machines[0].bonusCells, [{ x: 1, y: 0, kind: 'add', amount: 3 }]);
});

function lostRun(deps) {
  const run = fresh(deps);
  fire(run, deps);
  fire(run, deps);
  assert.equal(run.phase, 'lost');
  return run;
}

test('loss facts: neededTotal and bestFireLastShift, no tip while not lost or when won', () => {
  const deps = makeDeps([3, 7]);
  const run = fresh(deps);
  assert.equal(runSummary(run, deps).tipId, null);
  fire(run, deps);
  fire(run, deps);
  const s = runSummary(run, deps);
  assert.equal(s.neededTotal, getTarget(run));
  assert.equal(s.bestFireLastShift, 7);
  assert.equal(typeof s.tipId, 'string');
  const won = fresh(makeDeps([100000]));
  playUpTo(won, makeDeps([100000]), 8);
  fire(won, makeDeps([100000]));
  assert.equal(won.phase, 'won');
  assert.equal(runSummary(won, makeDeps([100000])).tipId, null);
});

test('loss tip rules: steer, then merge, then coins, then order', () => {
  const deps = makeDeps([1]);
  const run = lostRun(deps);
  // never owned a route or split part
  run.everOwned = ['coil'];
  run.bench = [{ partId: 'coil', level: 1 }];
  run.machine.cells = [];
  run.maxLevelSeen = 1;
  run.coins = 20;
  assert.equal(runSummary(run, deps).tipId, 'steer');
  // owned a route part, but nothing reached level 2
  run.everOwned = ['coil', 'bend'];
  assert.equal(runSummary(run, deps).tipId, 'merge');
  // reached level 2 and kept 6 or more coins
  run.maxLevelSeen = 2;
  run.coins = 6;
  assert.equal(runSummary(run, deps).tipId, 'coins');
  // otherwise: order
  run.coins = 5;
  assert.equal(runSummary(run, deps).tipId, 'order');
});

test('a route part that was sold still counts as owned; a merge in the past counts too', () => {
  const deps = makeDeps([1]);
  const run = lostRun(deps);
  assert.ok(run.everOwned.indexOf('bend') >= 0); // Tinkerbot kit has a bend
  run.bench = [{ partId: 'coil', level: 1 }];
  run.machine.cells = [];
  assert.notEqual(runSummary(run, deps).tipId, 'steer');
});

test('everOwned and maxLevelSeen follow buys and merges', () => {
  const deps = makeDeps([1]);
  const run = fresh(deps);
  run.phase = 'shop';
  run.coins = 50;
  run.offers = [{ partId: 'ember', level: 1, price: 2, sold: false }];
  assert.equal(buyOffer(run, 0, deps).ok, true);
  assert.ok(run.everOwned.indexOf('ember') >= 0);
  // kit has 2 coils; buying a third merges them into a level 2
  run.offers = [{ partId: 'coil', level: 1, price: 3, sold: false }];
  const out = buyOffer(run, 0, deps);
  assert.equal(out.merged.length, 1);
  assert.equal(run.maxLevelSeen, 2);
});

test('old saves without the new fields still produce a summary', () => {
  const deps = makeDeps([1]);
  const run = lostRun(deps);
  delete run.everOwned;
  delete run.maxLevelSeen;
  delete run.shiftBestFire;
  delete run.bonuses.gentle;
  const s = runSummary(run, deps);
  assert.equal(s.gentle, false);
  assert.equal(s.bestFireLastShift, 1);
  assert.equal(typeof s.tipId, 'string');
});
