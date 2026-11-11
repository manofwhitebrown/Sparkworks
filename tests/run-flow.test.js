// Tests for fire, payouts, winning, losing, save/load and a whole 8-shift run.
// Owner: AI-4
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun, fire, startNextShift, runSummary, getTarget } from '../src/run/runState.js';
import { buyOffer, rerollOffers } from '../src/run/shop.js';
import { makeDeps, FAKE_POOL } from './run-fakes.js';
import { SHIFT_RULES } from '../src/data/shifts.js';

const T1 = Math.round(SHIFT_RULES.targetBase);

function fresh(deps, options) {
  const opts = Object.assign({ inventorId: 'tinkerbot', voltage: 1, seed: 5, poolIds: FAKE_POOL }, options || {});
  return newRun(opts, deps);
}

test('fire refuses outside the build phase', () => {
  const deps = makeDeps([10]);
  const run = fresh(deps);
  run.phase = 'shop';
  assert.equal(fire(run, deps).reason, 'wrong_phase');
  run.phase = 'build';
  run.firesLeft = 0;
  assert.equal(fire(run, deps).reason, 'no_fires_left');
});

test('a Fire that reaches the target clears the shift and opens the shop', () => {
  const deps = makeDeps([30]);
  const run = fresh(deps);
  const out = fire(run, deps);
  assert.equal(out.ok, true);
  assert.equal(out.passed, true);
  assert.equal(out.shiftCleared, true);
  assert.equal(out.runOver, false);
  assert.equal(run.phase, 'shop');
  assert.equal(run.offers.length, 3);
  assert.deepEqual(run.history, [{ shift: 1, total: 30, target: T1 }]);
  assert.equal(out.result.total, 30);
});

test('payout = base 4 + 1 per unused Fire + overkill + coins from parts', () => {
  const deps = makeDeps([T1 + 1], 3);
  const run = fresh(deps);
  const before = run.coins;
  fire(run, deps);
  // 4 base + 1 unused Fire + 0 overkill (just over target) + 3 from parts
  assert.equal(run.coins - before, 8);
  assert.equal(run.lastFire.coinsEarned, 8);
});

test('overkill pays +1 per 50% over target, capped at 4', () => {
  const big = makeDeps([T1 * 2]); // 100% over = 2 steps
  const a = fresh(big);
  const coinsA = a.coins;
  fire(a, big);
  assert.equal(a.coins - coinsA, 4 + 1 + 2);
  const huge = makeDeps([T1 * 100]);
  const b = fresh(huge);
  const coinsB = b.coins;
  fire(b, huge);
  assert.equal(b.coins - coinsB, 4 + 1 + 4);
});

test('fail then retry: totals add up over the Fires of a shift', () => {
  const deps = makeDeps([5, T1]);
  const run = fresh(deps);
  const first = fire(run, deps);
  assert.equal(first.passed, false);
  assert.equal(run.phase, 'build');
  assert.equal(run.firesLeft, 1);
  assert.equal(run.shiftTotal, 5);
  const second = fire(run, deps);
  assert.equal(second.passed, true);
  assert.equal(run.shiftTotal, 5 + T1);
  assert.equal(run.lastFire.shiftTotal, 5 + T1);
  assert.equal(run.phase, 'shop');
  // no unused Fires left, so: 4 base only
  assert.equal(run.lastFire.coinsEarned, 4);
});

test('running out of Fires below target loses the run', () => {
  const deps = makeDeps([1]);
  const run = fresh(deps);
  fire(run, deps);
  const out = fire(run, deps);
  assert.equal(out.runOver, true);
  assert.equal(run.phase, 'lost');
  assert.equal(run.history.length, 1);
  assert.equal(fire(run, deps).reason, 'wrong_phase');
  assert.equal(runSummary(run).won, false);
});

test('each Fire gets a fresh machine seed and simulates a copy', () => {
  const deps = makeDeps([1]);
  const run = fresh(deps);
  fire(run, deps);
  const seeds = deps.simulate.state.machines.map((m) => m.seed);
  fire(run, deps);
  const all = deps.simulate.state.machines.map((m) => m.seed);
  assert.equal(seeds.length, 1);
  assert.notEqual(all[0], all[1]);
  assert.notEqual(deps.simulate.state.machines[0], run.machine);
});

test('startNextShift resets the shift counters and applies twists', () => {
  const deps = makeDeps([1000]);
  const run = fresh(deps);
  fire(run, deps);
  const out = startNextShift(run, deps);
  assert.equal(out.shift, 2);
  assert.equal(run.phase, 'build');
  assert.equal(run.shiftTotal, 0);
  assert.equal(run.firesLeft, 2);
  assert.equal(run.rerollsThisShift, 0);
  assert.equal(getTarget(run), Math.round(SHIFT_RULES.targetBase * SHIFT_RULES.targetGrowth));
});

// Clears shifts until the run is at `shift` (the fake simulate always passes).
function playUpTo(run, deps, shift) {
  while (run.shift < shift) {
    fire(run, deps);
    startNextShift(run, deps);
  }
}

test('voltage 3 shift 5 twist (fewerSparks) lasts one shift only', () => {
  const deps = makeDeps([100000]);
  const run = fresh(deps, { voltage: 3 });
  playUpTo(run, deps, 4);
  assert.equal(run.machine.sparkCount, 3); // shift 4 has no sparks twist
  fire(run, deps);
  startNextShift(run, deps);
  assert.equal(run.shift, 5);
  assert.equal(run.machine.sparkCount, 2);
  fire(run, deps);
  startNextShift(run, deps);
  assert.equal(run.machine.sparkCount, 3);
  assert.deepEqual(run.machine.blocked, []);
});

test('Dr. Volt keeps his start value after a twist shift', () => {
  const deps = makeDeps([100000]);
  const run = fresh(deps, { inventorId: 'drvolt', voltage: 3 });
  playUpTo(run, deps, 5);
  assert.equal(run.machine.sparkCount, 2); // fewerSparks twist on shift 5
  fire(run, deps);
  startNextShift(run, deps);
  assert.equal(run.machine.sparkCount, 3); // back to normal
  assert.equal(run.machine.startValue, 2);
});

test('a whole 8-shift run can be played with plain calls and ends in a win', () => {
  const deps = makeDeps([100000]);
  const run = fresh(deps);
  for (let shift = 1; shift <= 8; shift++) {
    assert.equal(run.shift, shift);
    const out = fire(run, deps);
    assert.equal(out.shiftCleared, true);
    if (shift < 8) {
      assert.equal(run.phase, 'shop');
      buyOffer(run, 0, deps);
      rerollOffers(run, deps);
      assert.equal(startNextShift(run, deps).ok, true);
    }
  }
  assert.equal(run.phase, 'won');
  assert.equal(run.history.length, 8);
  const summary = runSummary(run);
  assert.equal(summary.won, true);
  assert.equal(summary.shiftReached, 8);
  assert.equal(summary.shiftsCleared, 8);
  assert.equal(summary.bestFire, 100000);
  assert.equal(summary.totalBanked, 800000);
  assert.ok(summary.partsOwned.length >= 4);
});

test('save and load in the middle of a run gives identical results', () => {
  const depsA = makeDeps([10, 60, 200, 400]);
  const depsB = makeDeps([10, 60, 200, 400]);
  const a = fresh(depsA);
  fire(a, depsA);
  const b = JSON.parse(JSON.stringify(a));
  depsB.simulate.state.calls = 1; // B starts after the first Fire, like A did
  fire(a, depsA);
  fire(b, depsB);
  assert.deepEqual(a, b);
  startNextShift(a, depsA);
  startNextShift(b, depsB);
  assert.deepEqual(a, b);
  const c = JSON.parse(JSON.stringify(a));
  rerollOffers(a, depsA);
  rerollOffers(c, depsB);
  assert.deepEqual(a, c);
});

test('the run stays plain JSON (no functions)', () => {
  const deps = makeDeps([100]);
  const run = fresh(deps);
  fire(run, deps);
  assert.deepEqual(JSON.parse(JSON.stringify(run)), run);
});

test('firesUsed counts Fires, survives save and load, and shows in the summary', () => {
  const deps = makeDeps([1]);
  const run = fresh(deps);
  assert.equal(run.firesUsed, 0);
  fire(run, deps);
  assert.equal(run.firesUsed, 1);
  const loaded = JSON.parse(JSON.stringify(run));
  fire(loaded, deps);
  assert.equal(loaded.firesUsed, 2);
  const summary = runSummary(loaded);
  assert.equal(summary.firesUsed, 2);
  assert.equal(summary.partsBought, 0);
});

test('an old save without firesUsed and partsBought still works', () => {
  const deps = makeDeps([1]);
  const run = fresh(deps);
  delete run.firesUsed;
  delete run.partsBought;
  fire(run, deps);
  assert.equal(run.firesUsed, 1);
  assert.equal(runSummary(run).partsBought, 0);
});
