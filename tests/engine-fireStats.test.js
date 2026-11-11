// Tests for src/engine/fireStats.js on REAL simulate output.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { simulate } from '../src/engine/simulate.js';
import { fireStats } from '../src/engine/fireStats.js';
import { makeMachine, placePart } from '../src/engine/board.js';
import { allPartIds } from '../src/engine/parts/index.js';

function build(list, overrides) {
  const machine = makeMachine(Object.assign({ seed: 3 }, overrides || {}));
  for (let i = 0; i < list.length; i++) {
    placePart(machine, list[i][0], list[i][1], list[i][2], list[i][3] || 1, list[i][4] || 0);
  }
  return machine;
}

function statsOf(machine) {
  return fireStats(simulate(machine).events);
}

function assertSane(s) {
  const keys = ['chainLength', 'biggestMultiplier', 'biggestBank', 'bankedCount', 'lostCount', 'splitCount', 'intensity'];
  assert.deepStrictEqual(Object.keys(s), keys);
  for (let i = 0; i < keys.length; i++) {
    assert.ok(Number.isFinite(s[keys[i]]), keys[i] + ' is a finite number');
    assert.ok(s[keys[i]] >= 0, keys[i] + ' is not negative');
  }
  assert.ok(s.intensity >= 0 && s.intensity <= 1);
  assert.ok(s.biggestMultiplier >= 1);
}

test('empty board: sparks just bank, nothing happens, intensity is small', () => {
  const s = statsOf(build([]));
  assertSane(s);
  assert.strictEqual(s.bankedCount, 3);
  assert.strictEqual(s.lostCount, 0);
  assert.strictEqual(s.splitCount, 0);
  assert.strictEqual(s.chainLength, 0);
  assert.strictEqual(s.biggestMultiplier, 1);
  assert.strictEqual(s.biggestBank, 1);
  assert.ok(s.intensity < 0.1);
});

test('coil then amplifier: the multiplier, the bank and the chain are read right', () => {
  // Coil +3 then Amplifier x2 (see docs/ENGINE.md): 1 -> 4 -> 8 per spark.
  const s = statsOf(build([[1, 1, 'coil'], [2, 1, 'amplifier']]));
  assertSane(s);
  assert.strictEqual(s.biggestBank, 8);
  assert.strictEqual(s.biggestMultiplier, 2);
  assert.strictEqual(s.chainLength, 2);
  assert.strictEqual(s.bankedCount, 3);
});

test('an add (+3 on a 1) is not a multiplier; a bonus add tile is not either', () => {
  const s = statsOf(build([[1, 1, 'coil']], { sparkCount: 1, bonusCells: [{ x: 3, y: 1, kind: 'add', amount: 9 }] }));
  assert.strictEqual(s.biggestMultiplier, 1);
  assert.strictEqual(s.chainLength, 2);
  assert.strictEqual(s.biggestBank, 13);
});

test('splits and lost sparks are counted', () => {
  const s = statsOf(build([[1, 1, 'splitter', 1, 0], [2, 1, 'bend', 1, 1]], { sparkCount: 1 }));
  assertSane(s);
  assert.ok(s.splitCount >= 1);
  assert.strictEqual(s.bankedCount + s.lostCount, 1 + s.splitCount);
});

test('a spark that leaves the board counts as lost', () => {
  const s = statsOf(build([[1, 1, 'bend', 1, 3]], { sparkCount: 2 }));
  assert.strictEqual(s.lostCount, 2);
  assert.strictEqual(s.bankedCount, 0);
  assert.strictEqual(s.biggestBank, 0);
});

test('a bonus tile counts as a multiplier and as a chain step', () => {
  const machine = build([], { sparkCount: 1, bonusCells: [{ x: 2, y: 1, kind: 'mult', amount: 5 }] });
  const s = statsOf(machine);
  assert.strictEqual(s.biggestMultiplier, 5);
  assert.strictEqual(s.chainLength, 1);
});

test('a bigger Fire has a higher intensity', () => {
  const small = statsOf(build([[1, 1, 'coil']]));
  const big = statsOf(build([[1, 1, 'coil'], [2, 1, 'amplifier', 3], [3, 1, 'amplifier', 3]]));
  assert.ok(big.intensity > small.intensity);
});

test('intensity stays in 0..1 for huge numbers', () => {
  const log = [
    { n: 0, type: 'value', spark: 1, before: 1, after: 1e300 },
    { n: 1, type: 'bank', spark: 1, value: 1e300, runningTotal: 1e300 }
  ];
  const s = fireStats(log);
  assertSane(s);
  assert.strictEqual(s.intensity > 0.5, true);
  assert.ok(s.intensity <= 1);
});

test('bad input never gives NaN or throws', () => {
  assertSane(fireStats(undefined));
  assertSane(fireStats(null));
  assertSane(fireStats([]));
  assertSane(fireStats([null, 5, {}, { type: 7 }, { type: 'bank', value: NaN }, { type: 'value', spark: 1, before: 0, after: 5 },
    { type: 'value', spark: 1, before: Infinity, after: 1 }, { type: 'value', spark: 1, before: 1, after: Infinity },
    { type: 'bank', value: Infinity }]));
  assert.strictEqual(fireStats([{ type: 'value', spark: 1, before: 0, after: 5 }]).biggestMultiplier, 1);
});

test('it does not change the event list', () => {
  const events = simulate(build([[1, 1, 'coil'], [2, 1, 'amplifier']])).events;
  const before = JSON.stringify(events);
  fireStats(events);
  assert.strictEqual(JSON.stringify(events), before);
});

test('the same log gives the same stats', () => {
  const events = simulate(build([[1, 1, 'splitter'], [2, 1, 'coil']])).events;
  assert.deepStrictEqual(fireStats(events), fireStats(events));
});

test('300 random boards with all real parts: always sane, and stats agree with simulate', () => {
  const ids = allPartIds();
  let seed = 4242;
  function next() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  for (let i = 0; i < 300; i++) {
    const machine = makeMachine({ seed: i + 1, sparkCount: 1 + Math.floor(next() * 4) });
    for (let x = 0; x < machine.cols; x++) {
      for (let y = 0; y < machine.rows; y++) {
        if (next() < 0.55) {
          placePart(machine, x, y, ids[Math.floor(next() * ids.length)], 1 + Math.floor(next() * 3), Math.floor(next() * 4));
        }
      }
    }
    const result = simulate(machine);
    const s = fireStats(result.events);
    assertSane(s);
    assert.strictEqual(s.bankedCount, result.banked);
    assert.strictEqual(s.lostCount, result.fizzled);
    assert.ok(s.biggestBank <= result.total || result.total === 1e300);
  }
});

test('speed: a 120-spark Fire is read in well under 1 ms on average', () => {
  const events = [];
  for (let s = 1; s <= 120; s++) {
    for (let k = 0; k < 8; k++) {
      events.push({ n: events.length, type: 'value', spark: s, before: 1 + k, after: 2 + k, x: k, y: 1 });
    }
    events.push({ n: events.length, type: 'bank', spark: s, value: s, runningTotal: s });
  }
  fireStats(events);
  const start = process.hrtime.bigint();
  for (let r = 0; r < 100; r++) {
    fireStats(events);
  }
  const ms = Number(process.hrtime.bigint() - start) / 1e6 / 100;
  assert.ok(ms < 1, 'one call took ' + ms.toFixed(3) + ' ms');
});
