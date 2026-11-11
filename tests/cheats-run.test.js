// Tests for the run and shop cheats, using REAL runs made with newRun and the real parts.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { newRun, startNextShift, getTarget, fire } from '../src/run/runState.js';
import { makeOffers, rerollPrice } from '../src/run/shop.js';
import { validateMachine, placePart } from '../src/engine/board.js';
import { allPartIds } from '../src/engine/parts/index.js';
import { benchSizeOf } from '../src/run/runRules.js';
import * as rc from '../src/cheats/runCheats.js';
import * as sc from '../src/cheats/shopCheats.js';
import { makeEnv } from '../src/cheats/cheatEnv.js';

function freshRun(seed) {
  return newRun({ inventorId: 'tinkerbot', voltage: 1, seed: seed || 7, poolIds: allPartIds(), bonuses: {} });
}

// A run that is in the shop (shift 1 cleared).
function shopRun() {
  const run = freshRun(11);
  run.phase = 'shop';
  makeOffers(run);
  return run;
}

// Every run must stay valid after every cheat.
function assertValid(run) {
  assert.deepStrictEqual(validateMachine(run.machine), []);
  assert.ok(Number.isFinite(run.coins) && run.coins >= 0, 'coins ok');
  assert.ok(Number.isFinite(run.firesLeft) && run.firesLeft >= 0, 'fires ok');
  assert.ok(run.bench.length <= benchSizeOf(run), 'bench fits');
  for (let i = 0; i < run.bench.length; i++) {
    assert.ok(allPartIds().indexOf(run.bench[i].partId) !== -1);
    assert.ok(run.bench[i].level >= 1 && run.bench[i].level <= 3);
  }
  assert.ok(Number.isFinite(getTarget(run)) && getTarget(run) > 0);
}

function good(res) {
  assert.strictEqual(res.ok, true, res.msg);
}

test('coins: add, set to zero, never negative, refuse junk', () => {
  const run = freshRun();
  const before = run.coins;
  good(rc.addCoins(run, 100));
  assert.strictEqual(run.coins, before + 100);
  assert.strictEqual(run.cheated, true);
  good(rc.setCoins(run, 0));
  assert.strictEqual(run.coins, 0);
  good(rc.addCoins(run, -50));
  assert.strictEqual(run.coins, 0);
  assert.strictEqual(rc.addCoins(run, NaN).ok, false);
  assert.strictEqual(rc.setCoins(run, -3).ok, false);
  assertValid(run);
});

test('a refused cheat does not mark the run as cheated', () => {
  const run = freshRun();
  assert.strictEqual(rc.addCoins(run, Infinity).ok, false);
  assert.strictEqual(run.cheated, undefined);
});

test('fires: refill and +1 work while building only', () => {
  const run = freshRun();
  run.firesLeft = 0;
  good(rc.refillFires(run));
  assert.strictEqual(run.firesLeft, 2);
  good(rc.extraFire(run));
  assert.strictEqual(run.firesLeft, 3);
  run.phase = 'shop';
  assert.strictEqual(rc.refillFires(run).ok, false);
  assert.strictEqual(rc.extraFire(run).ok, false);
  assertValid(run);
});

test('target multiplier changes getTarget', () => {
  const run = freshRun();
  const normal = getTarget(run);
  good(rc.setTargetMultiplier(run, 0.05));
  assert.ok(getTarget(run) < normal);
  good(rc.setTargetMultiplier(run, 10));
  assert.strictEqual(getTarget(run), normal * 10);
  good(rc.setTargetMultiplier(run, 1));
  assert.strictEqual(getTarget(run), normal);
  assert.strictEqual(rc.setTargetMultiplier(run, 0).ok, false);
  assert.strictEqual(rc.setTargetMultiplier(run, NaN).ok, false);
});

test('easy target: the next Fire clears the shift', () => {
  const run = freshRun(3);
  good(rc.setTargetMultiplier(run, 0.05));
  const out = fire(run);
  assert.strictEqual(out.ok, true);
  assert.strictEqual(out.passed, true);
});

test('skip to every shift 1 to 8 gives a valid build phase', () => {
  for (let n = 1; n <= 8; n++) {
    const run = freshRun(n);
    good(rc.skipToShift(run, n));
    assert.strictEqual(run.shift, n);
    assert.strictEqual(run.phase, 'build');
    assert.strictEqual(run.firesLeft, 2);
    assert.strictEqual(run.cheated, true);
    assertValid(run);
  }
  const run = freshRun();
  assert.strictEqual(rc.skipToShift(run, 0).ok, false);
  assert.strictEqual(rc.skipToShift(run, 9).ok, false);
  assert.strictEqual(rc.skipToShift(run, 2.5).ok, false);
});

test('skip to shift 4 sets up the Overload twist', () => {
  const run = freshRun();
  good(rc.skipToShift(run, 4));
  assert.strictEqual(run.machine.blocked.length, 1);
});

test('skip works from a won or lost run too (it revives it)', () => {
  const run = freshRun();
  rc.loseRun(run);
  good(rc.skipToShift(run, 2));
  assert.strictEqual(run.phase, 'build');
});

test('instant win and lose', () => {
  const run = freshRun();
  good(rc.winRun(run));
  assert.strictEqual(run.phase, 'won');
  good(rc.loseRun(run));
  assert.strictEqual(run.phase, 'lost');
  assert.strictEqual(run.cheated, true);
});

test('board size: min 3, max 8, parts that no longer fit go to the bench', () => {
  const run = freshRun();
  placePart(run.machine, 4, 3, 'coil', 1, 0);
  run.machine.blocked.push({ x: 4, y: 0 });
  good(rc.resizeBoard(run, -1, -1));
  assert.strictEqual(run.machine.cols, 4);
  assert.strictEqual(run.machine.rows, 3);
  assert.strictEqual(run.machine.cells.length, 0);
  assert.ok(run.bench.some(function (b) { return b.partId === 'coil'; }));
  assert.strictEqual(run.machine.blocked.length, 0);
  good(rc.resizeBoard(run, -1, -1));
  assert.strictEqual(run.machine.cols, 3);
  assert.strictEqual(rc.resizeBoard(run, -1, -1).ok, false);
  for (let i = 0; i < 10; i++) {
    rc.resizeBoard(run, 1, 1);
  }
  assert.strictEqual(run.machine.cols, 8);
  assert.strictEqual(run.machine.rows, 8);
  assert.strictEqual(rc.resizeBoard(run, 1, 1).ok, false);
  assertValid(run);
});

test('board shrink keeps the source row inside the board and a full bench still fits', () => {
  const run = freshRun();
  run.machine.sourceRow = 3;
  for (let x = 0; x < 5; x++) {
    placePart(run.machine, x, 3, 'coil', 1, 0);
  }
  good(rc.resizeBoard(run, 0, -1));
  assert.ok(run.machine.sourceRow < run.machine.rows);
  assertValid(run);
});

test('spark count 1 to 8 and start value', () => {
  const run = freshRun();
  good(rc.setSparkCount(run, 8));
  assert.strictEqual(run.machine.sparkCount, 8);
  assert.strictEqual(rc.setSparkCount(run, 0).ok, false);
  assert.strictEqual(rc.setSparkCount(run, 9).ok, false);
  good(rc.setStartValue(run, 10));
  assert.strictEqual(run.machine.startValue, 10);
  assert.strictEqual(rc.setStartValue(run, NaN).ok, false);
  assertValid(run);
});

test('clear twists empties blocked, banned and flags', () => {
  const run = freshRun();
  good(rc.skipToShift(run, 4));
  run.machine.banned.push('coil');
  run.machine.flags.x = 1;
  good(rc.clearTwists(run));
  assert.deepStrictEqual(run.machine.blocked, []);
  assert.deepStrictEqual(run.machine.banned, []);
  assert.deepStrictEqual(run.machine.flags, {});
});

test('give part: every part at every level, merges are applied', () => {
  const ids = allPartIds();
  for (let i = 0; i < ids.length; i++) {
    for (let level = 1; level <= 3; level++) {
      const run = freshRun();
      run.bench = [];
      good(rc.giveBenchPart(run, ids[i], level));
      assert.strictEqual(run.bench.length, 1);
      assert.strictEqual(run.bench[0].level, level);
      assertValid(run);
    }
  }
  const run = freshRun();
  run.bench = [];
  rc.giveBenchPart(run, 'coil', 1);
  rc.giveBenchPart(run, 'coil', 1);
  rc.giveBenchPart(run, 'coil', 1);
  assert.deepStrictEqual(run.bench, [{ partId: 'coil', level: 2 }]);
});

test('give part refuses a bad id, a bad level and a full bench; a bench slot fixes it', () => {
  const run = freshRun();
  assert.strictEqual(rc.giveBenchPart(run, 'nope', 1).ok, false);
  assert.strictEqual(rc.giveBenchPart(run, 'coil', 4).ok, false);
  const ids = allPartIds();
  run.bench = [];
  for (let i = 0; i < benchSizeOf(run); i++) {
    run.bench.push({ partId: ids[i], level: 1 });
  }
  assert.strictEqual(rc.giveBenchPart(run, 'coil', 1).ok, false);
  const size = benchSizeOf(run);
  good(rc.addBenchSlot(run));
  assert.strictEqual(benchSizeOf(run), size + 1);
  good(rc.giveBenchPart(run, ids[ids.length - 1], 1));
  assertValid(run);
});

test('bench slots stop at the limit', () => {
  const run = freshRun();
  for (let i = 0; i < 20; i++) {
    rc.addBenchSlot(run);
  }
  assert.strictEqual(benchSizeOf(run), 12);
  assert.strictEqual(rc.addBenchSlot(run).ok, false);
});

test('all parts to level 3 and all parts to the bench', () => {
  const run = freshRun();
  placePart(run.machine, 0, 0, 'coil', 1, 0);
  placePart(run.machine, 1, 0, 'amplifier', 2, 1);
  good(rc.allPartsToLevel3(run));
  for (let i = 0; i < run.machine.cells.length; i++) {
    assert.strictEqual(run.machine.cells[i].level, 3);
  }
  for (let j = 0; j < run.bench.length; j++) {
    assert.strictEqual(run.bench[j].level, 3);
  }
  const count = run.bench.length + run.machine.cells.length;
  good(rc.allPartsToBench(run));
  assert.strictEqual(run.machine.cells.length, 0);
  assert.strictEqual(run.bench.length, count);
  assertValid(run);
});

test('after every cheat the real game keeps working (fire, shop, next shift)', () => {
  const run = freshRun(21);
  rc.addCoins(run, 1000);
  rc.allPartsToLevel3(run);
  rc.resizeBoard(run, 1, 1);
  rc.setSparkCount(run, 5);
  rc.setTargetMultiplier(run, 0.05);
  const out = fire(run);
  assert.strictEqual(out.ok, true);
  assert.strictEqual(run.phase, 'shop');
  assert.strictEqual(startNextShift(run).ok, true);
  assertValid(run);
});

// ---------- shop cheats ----------

test('free reroll: coins stay the same, offers change, run is cheated', () => {
  const run = shopRun();
  const coins = run.coins;
  const price = rerollPrice(run);
  assert.ok(price > 0);
  good(sc.freeReroll(run));
  assert.strictEqual(run.coins, coins);
  assert.strictEqual(run.cheated, true);
  assertValid(run);
  run.phase = 'build';
  assert.strictEqual(sc.freeReroll(run).ok, false);
});

test('zero prices make every offer free and buyable with 0 coins', () => {
  const run = shopRun();
  good(sc.zeroOfferPrices(run));
  for (let i = 0; i < run.offers.length; i++) {
    assert.strictEqual(run.offers[i].price, 0);
  }
  assertValid(run);
});

test('force offers: up to 4 known parts at their normal price', () => {
  const run = shopRun();
  good(sc.forceOffers(run, ['coil', 'coil', 'nope', 'splitter', 'battery', 'anvil', 'dynamo']));
  assert.deepStrictEqual(run.offers.map(function (o) { return o.partId; }), ['coil', 'splitter', 'battery', 'anvil']);
  assert.ok(run.offers.every(function (o) { return o.price > 0 && o.sold === false && o.level === 1; }));
  assert.strictEqual(sc.forceOffers(run, []).ok, false);
  assert.strictEqual(sc.forceOffers(run, ['nope']).ok, false);
  run.phase = 'build';
  assert.strictEqual(sc.forceOffers(run, ['coil']).ok, false);
});

// ---------- the env glue ----------

function fakeDeps(run, meta) {
  const log = { saved: 0, metaSaved: 0, events: [], toasts: [], applied: 0 };
  const deps = {
    getRun: function () { return run; },
    getMeta: function () { return meta; },
    saveRun: function () { log.saved++; },
    saveMeta: function () { log.metaSaved++; },
    emit: function (name, data) { log.events.push({ name: name, data: data }); },
    toast: function (text) { log.toasts.push(text); },
    applySettings: function () { log.applied++; }
  };
  return { deps: deps, log: log };
}

test('env: no run gives "Open a run first" and nothing else happens', () => {
  const f = fakeDeps(null, {});
  const env = makeEnv(f.deps);
  const res = env.doRun('coins', function (r) { return rc.addCoins(r, 1); });
  assert.strictEqual(res.ok, false);
  assert.deepStrictEqual(f.log.toasts, ['Open a run first']);
  assert.strictEqual(f.log.saved, 0);
  assert.strictEqual(f.log.events.length, 0);
});

test('env: a good cheat saves, sends cheat:changed and toasts; a refused one only toasts', () => {
  const run = freshRun();
  const f = fakeDeps(run, {});
  const env = makeEnv(f.deps);
  env.doRun('coins', function (r) { return rc.addCoins(r, 10); });
  assert.strictEqual(f.log.saved, 1);
  assert.deepStrictEqual(f.log.events, [{ name: 'cheat:changed', data: { what: 'coins' } }]);
  assert.deepStrictEqual(f.log.toasts, ['Done']);
  env.doRun('coins', function (r) { return rc.addCoins(r, NaN); });
  assert.strictEqual(f.log.saved, 1);
  assert.strictEqual(f.log.events.length, 1);
  assert.strictEqual(f.log.toasts[1], 'Not a number');
});

test('env: quiet mode saves but sends no event', () => {
  const run = freshRun();
  const f = fakeDeps(run, {});
  const env = makeEnv(f.deps);
  env.doRun('preview', function (r) { return rc.addCoins(r, 0); }, { quiet: true });
  assert.strictEqual(f.log.saved, 1);
  assert.strictEqual(f.log.events.length, 0);
});
