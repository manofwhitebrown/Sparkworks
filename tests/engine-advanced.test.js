// Engine tests: loops, splits, boosts, state, disable, bad numbers, determinism.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { simulate } from '../src/engine/simulate.js';
import { CONFIG } from '../src/data/config.js';
import { makeRng } from '../src/core/rng.js';
import { makeMachine, placePart } from '../src/engine/board.js';
import {
  makeAdder, makeMultiplier, turner, makeSplitter, disabler, thrower, booster,
  counter, badNumbers, gambler, makeGetPart, machineWith
} from './engine-helpers.test.js';

const getPart = makeGetPart({
  coil: makeAdder(2),
  amp: makeMultiplier(2),
  turn: turner,
  splitDown: makeSplitter('down', 0),
  splitRight: makeSplitter('right', 10),
  disabler: disabler,
  thrower: thrower,
  booster: booster,
  counter: counter,
  bad: badNumbers,
  gambler: gambler,
  bigAdder: { id: 'bigAdder', onPass(ctx) { ctx.setValue(1e305, 'big'); } },
  negative: { id: 'negative', onPass(ctx) { ctx.setValue(-5, 'neg'); } },
  manySplits: {
    id: 'manySplits',
    onPass(ctx) {
      for (let i = 0; i < 200; i++) {
        ctx.split('right', 1, 'spam');
      }
    }
  },
  coiner: { id: 'coiner', onPass(ctx) { ctx.addCoins(2); ctx.addCoins(NaN); ctx.note('1/3'); } },
  noop: { id: 'noop', onPass() {} }
});

function ofType(result, type) {
  return result.events.filter(function (e) {
    return e.type === type;
  });
}

// A little closed loop: (1,1) down, (1,2) right, (2,2) up, (2,1) left, back to (1,1).
const LOOP = [[1, 1, 'turn', 1], [1, 2, 'turn', 0], [2, 2, 'turn', 3], [2, 1, 'turn', 2]];

test('a closed loop ends early by the visit limit (reason steps)', () => {
  const machine = machineWith(LOOP);
  machine.sparkCount = 1;
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.total, 0);
  assert.strictEqual(result.fizzled, 1);
  const f = ofType(result, 'fizzle')[0];
  assert.strictEqual(f.reason, 'steps');
  // the 5th entry of cell (1,1) is the one that fizzles; it makes no enter event
  assert.strictEqual(f.x, 1);
  assert.strictEqual(f.y, 1);
  const enters = ofType(result, 'enter');
  assert.strictEqual(enters.length, 17);
  assert.ok(enters.length < CONFIG.maxSteps);
  const sameCell = enters.filter(function (e) {
    return e.x === 1 && e.y === 1;
  });
  assert.strictEqual(sameCell.length, CONFIG.maxVisitsPerCell);
});

test('visit limit: a part in the loop acts exactly maxVisitsPerCell times', () => {
  // The part at (2,2) adds 1 and then turns the spark up, like the plain turner.
  // It is entered 4 times and never a 5th, because (1,1) is the cell that runs out first.
  const counted = {
    id: 'counted',
    onPass(ctx) {
      ctx.setValue(ctx.value + 1, '+1');
      ctx.turnToFacing();
    }
  };
  const counting = makeGetPart({ turn: turner, counted: counted });
  const machine = machineWith([[1, 1, 'turn', 1], [1, 2, 'turn', 0], [2, 2, 'counted', 3], [2, 1, 'turn', 2]]);
  machine.sparkCount = 1;
  const result = simulate(machine, { getPart: counting });
  assert.strictEqual(ofType(result, 'value').length, CONFIG.maxVisitsPerCell);
  assert.strictEqual(result.fizzled, 1);
  assert.strictEqual(ofType(result, 'fizzle')[0].reason, 'steps');
});

test('visit limit is per spark, not per Fire', () => {
  const machine = machineWith(LOOP);
  machine.sparkCount = 3;
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.fizzled, 3);
  assert.strictEqual(ofType(result, 'enter').length, 3 * 17);
  const fast = simulate(machine, { getPart, recordEvents: false });
  assert.strictEqual(fast.fizzled, 3);
  assert.strictEqual(fast.total, result.total);
});

test('maxSteps still ends a long walk that never visits a cell 5 times', () => {
  // a 40 cell corridor: right to the end, a turner sends the spark back left
  const machine = machineWith([[39, 0, 'turn', 2]], { seed: 1, cols: 40, rows: 1, sourceRow: 0, sparkCount: 1 });
  const result = simulate(machine, { getPart });
  const f = ofType(result, 'fizzle')[0];
  assert.strictEqual(f.reason, 'steps');
  assert.strictEqual(f.x, 39 - (CONFIG.maxSteps + 1 - 39));
  assert.strictEqual(result.total, 0);
});

test('visit limit: a Reverser double pass with real parts still works', () => {
  // Bend (1,1) turns right, Coil (2,1) +3, Reverser (3,1) turns the spark back.
  // The coil is entered 3 times (under the limit of 4): 1 + 3 + 3 + 3 = 10.
  const machine = makeMachine({ startValue: 1, sparkCount: 1, seed: 1 });
  placePart(machine, 1, 1, 'bend', 1, 0);
  placePart(machine, 2, 1, 'coil', 1, 0);
  placePart(machine, 3, 1, 'reverser', 1, 0);
  const result = simulate(machine);
  assert.strictEqual(result.total, 10);
  assert.strictEqual(result.banked, 1);
  assert.strictEqual(result.fizzled, 0);
});

test('a part acts every time a spark re-enters its cell', () => {
  const machine = machineWith([
    [1, 1, 'turn', 1], [1, 2, 'turn', 0], [2, 2, 'turn', 3], [2, 1, 'turn', 2]
  ]);
  machine.sparkCount = 1;
  const result = simulate(machine, { getPart });
  assert.ok(ofType(result, 'turn').length > 10);
});

test('split: the child moves first and does not trigger its birth cell again', () => {
  const machine = machineWith([[1, 1, 'splitDown']]);
  machine.sparkCount = 1;
  const result = simulate(machine, { getPart });
  const spawns = ofType(result, 'spawn');
  assert.strictEqual(spawns.length, 2);
  assert.strictEqual(spawns[1].parent, 1);
  assert.strictEqual(spawns[1].dir, 'down');
  const split = ofType(result, 'split')[0];
  assert.strictEqual(split.child, 2);
  assert.strictEqual(split.spark, 1);
  const childEnters = ofType(result, 'enter').filter(function (e) {
    return e.spark === 2;
  });
  assert.strictEqual(childEnters[0].x, 1);
  assert.strictEqual(childEnters[0].y, 2);
});

test('split: the child going right banks its own value', () => {
  const machine = machineWith([[1, 1, 'splitRight']]);
  machine.sparkCount = 1;
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.banked, 2);
  assert.strictEqual(result.total, 1 + 11);
});

test('split: children run right after the parent, before the next source spark', () => {
  const machine = machineWith([[1, 1, 'splitDown']]);
  machine.sparkCount = 2;
  const result = simulate(machine, { getPart });
  const spawnIds = ofType(result, 'spawn').map(function (e) {
    return e.spark;
  });
  assert.deepStrictEqual(spawnIds, [1, 2, 3, 4]);
  const parents = ofType(result, 'spawn').map(function (e) {
    return e.parent;
  });
  assert.deepStrictEqual(parents, [0, 1, 0, 3]);
  // every event of spark 2 comes before the spawn of spark 3
  const spawn3 = result.events.findIndex(function (e) {
    return e.type === 'spawn' && e.spark === 3;
  });
  for (let i = spawn3; i < result.events.length; i++) {
    assert.notStrictEqual(result.events[i].spark, 2);
  }
});

test('split: ids are in creation order and the cap maxSparksPerFire holds', () => {
  const machine = machineWith([[1, 1, 'manySplits']]);
  const result = simulate(machine, { getPart });
  const spawns = ofType(result, 'spawn');
  assert.strictEqual(spawns.length, CONFIG.maxSparksPerFire);
  for (let i = 0; i < spawns.length; i++) {
    assert.strictEqual(spawns[i].spark, i + 1);
  }
  // the three source sparks are still all there
  const sources = spawns.filter(function (e) {
    return e.parent === 0;
  });
  assert.strictEqual(sources.length, 3);
  assert.strictEqual(result.banked, CONFIG.maxSparksPerFire);
});

test('boost: a booster next to an adder scales the adder', () => {
  const machine = machineWith([[1, 1, 'coil'], [1, 0, 'booster']]);
  machine.sparkCount = 1;
  assert.strictEqual(simulate(machine, { getPart }).total, 1 + 2 * 1.5);
});

test('boost: two boosters multiply; far away boosters do nothing', () => {
  const two = machineWith([[1, 1, 'coil'], [1, 0, 'booster'], [1, 2, 'booster']]);
  two.sparkCount = 1;
  assert.strictEqual(simulate(two, { getPart }).total, 1 + 2 * 2.25);
  const far = machineWith([[1, 1, 'coil'], [0, 0, 'booster'], [3, 3, 'booster']]);
  far.sparkCount = 1;
  assert.strictEqual(simulate(far, { getPart }).total, 3);
});

test('boost: a booster next to a multiplier makes it stronger', () => {
  const machine = machineWith([[1, 1, 'amp'], [0, 1, 'booster']]);
  machine.sparkCount = 1;
  // multiplier 1 + (2 - 1) * 1.5 = 2.5
  assert.strictEqual(simulate(machine, { getPart }).total, 2.5);
});

test('boost: a banned booster gives no boost', () => {
  const machine = machineWith([[1, 1, 'coil'], [1, 0, 'booster']]);
  machine.sparkCount = 1;
  machine.banned.push('booster');
  assert.strictEqual(simulate(machine, { getPart }).total, 3);
});

test('state persists across sparks in one Fire and starts empty next time', () => {
  const machine = machineWith([[1, 1, 'counter']]);
  // sparks get +1, +2, +3 on top of 1
  assert.strictEqual(simulate(machine, { getPart }).total, 2 + 3 + 4);
  assert.strictEqual(simulate(machine, { getPart }).total, 2 + 3 + 4);
});

test('disable stops a part for the rest of the Fire', () => {
  const machine = machineWith([[1, 1, 'disabler']]);
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.total, 2 + 1 + 1);
  assert.strictEqual(ofType(result, 'disable').length, 1);
});

test('NaN and Infinity from a part never leak into the total', () => {
  const machine = machineWith([[1, 1, 'bad']]);
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.total, 6);
  assert.ok(Number.isFinite(result.total));
  assert.strictEqual(ofType(result, 'value').length, 3);
});

test('values are clamped to 0 and maxValue', () => {
  const big = simulate(machineWith([[1, 1, 'bigAdder']]), { getPart });
  assert.strictEqual(big.total, 1e300); // the total is capped too
  const neg = simulate(machineWith([[1, 1, 'negative']]), { getPart });
  assert.strictEqual(neg.total, 0);
});

test('a throwing part does not crash and is counted in errors', () => {
  const machine = machineWith([[1, 1, 'thrower'], [2, 1, 'coil']]);
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.errors, 3);
  assert.strictEqual(result.total, 3 * 3);
});

test('a part with no onPass is treated as empty', () => {
  const odd = makeGetPart({ weird: { id: 'weird' } });
  const result = simulate(machineWith([[1, 1, 'weird']]), { getPart: odd });
  assert.strictEqual(result.total, 3);
});

test('coins and notes: only real numbers count', () => {
  const machine = machineWith([[1, 1, 'coiner']]);
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.coins, 6);
  assert.strictEqual(ofType(result, 'coins').length, 3);
  assert.strictEqual(ofType(result, 'state')[0].label, '1/3');
});

test('ctx.fire reports the source spark number and what is banked so far', () => {
  const seen = [];
  const spy = {
    id: 'spy',
    onPass(ctx) {
      seen.push({
        n: ctx.fire.sparkNumber, total: ctx.fire.bankedTotal,
        count: ctx.fire.bankedCount, parts: ctx.fire.partsOnBoard
      });
    }
  };
  const spyGetPart = makeGetPart({ spy: spy, splitDown: makeSplitter('right', 0) });
  simulate(machineWith([[1, 1, 'spy']]), { getPart: spyGetPart });
  assert.deepStrictEqual(seen, [
    { n: 1, total: 0, count: 0, parts: 1 },
    { n: 2, total: 1, count: 1, parts: 1 },
    { n: 3, total: 2, count: 2, parts: 1 }
  ]);
});

test('determinism: same machine and seed give deeply equal results', () => {
  const machine = machineWith([[1, 1, 'gambler'], [2, 1, 'splitDown'], [3, 1, 'coil']]);
  const a = simulate(machine, { getPart });
  const b = simulate(machine, { getPart });
  assert.deepStrictEqual(a, b);
});

test('a different seed can differ when a part uses ctx.rng()', (t) => {
  if (makeRng(1)() === makeRng(2)()) {
    t.skip('core/rng.js is still a constant stub');
    return;
  }
  const a = simulate(machineWith([[1, 1, 'gambler']], { seed: 1 }), { getPart });
  const b = simulate(machineWith([[1, 1, 'gambler']], { seed: 2 }), { getPart });
  assert.notStrictEqual(a.total, b.total);
});

test('recordEvents false gives the same numbers as the full run', () => {
  const machine = machineWith([
    [1, 1, 'gambler'], [2, 1, 'splitDown'], [3, 1, 'coil'], [2, 2, 'coiner'], [3, 3, 'thrower']
  ]);
  const full = simulate(machine, { getPart });
  const fast = simulate(machine, { getPart, recordEvents: false });
  assert.strictEqual(fast.total, full.total);
  assert.strictEqual(fast.coins, full.coins);
  assert.strictEqual(fast.banked, full.banked);
  assert.strictEqual(fast.fizzled, full.fizzled);
  assert.strictEqual(fast.errors, full.errors);
  assert.strictEqual(fast.events.length, 0);
  assert.ok(full.events.length > 10);
});

test('events hold only plain data (they survive JSON)', () => {
  const machine = machineWith([[1, 1, 'splitDown'], [2, 1, 'coiner']]);
  const result = simulate(machine, { getPart });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(result.events)), result.events);
});

test('a source row outside the board fizzles instead of crashing', () => {
  const machine = machineWith([]);
  machine.sourceRow = 9;
  const result = simulate(machine, { getPart });
  assert.strictEqual(result.total, 0);
  assert.strictEqual(result.fizzled, 3);
});

test('addCoins: only whole numbers above 0 count, fractions are floored', () => {
  const calls = [-3, 0, -0.5, 0.9, NaN, Infinity, -Infinity, undefined, '5', null, 2.7, 4];
  const payer = {
    id: 'payer',
    onPass(ctx) {
      for (let i = 0; i < calls.length; i++) {
        ctx.addCoins(calls[i]);
      }
    }
  };
  const machine = machineWith([[1, 1, 'payer']]);
  machine.sparkCount = 1;
  const result = simulate(machine, { getPart: makeGetPart({ payer: payer }) });
  assert.strictEqual(result.coins, 2 + 4);
  const events = ofType(result, 'coins');
  assert.deepStrictEqual(events.map(function (e) { return e.amount; }), [2, 4]);
  assert.ok(Number.isInteger(result.coins) && result.coins >= 0);
  const fast = simulate(machine, { getPart: makeGetPart({ payer: payer }), recordEvents: false });
  assert.strictEqual(fast.coins, 6);
});
