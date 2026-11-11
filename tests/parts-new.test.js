// Behaviour of the 7 round-4 parts (spring, sideamp, bouncer, workbench, jackpot, finisher, starter).
// Owner: AI-3
import test from 'node:test';
import assert from 'node:assert/strict';
import spring from '../src/engine/parts/spring.js';
import sideamp from '../src/engine/parts/sideamp.js';
import bouncer from '../src/engine/parts/bouncer.js';
import workbench from '../src/engine/parts/workbench.js';
import jackpot from '../src/engine/parts/jackpot.js';
import finisher from '../src/engine/parts/finisher.js';
import starter from '../src/engine/parts/starter.js';
import { runPart } from './helpers/fakeCtx.js';

// Imported straight from the files, so these tests do not depend on index.js registration.
const PARTS = { spring, sideamp, bouncer, workbench, jackpot, finisher, starter };
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + ' vs ' + b);
const fireOf = (parts) => ({ sparkNumber: 1, bankedTotal: 0, bankedCount: 0, partsOnBoard: parts });

test('new parts have matching ids, valid rarity and short plain texts', () => {
  for (const id of Object.keys(PARTS)) {
    const part = PARTS[id];
    assert.equal(part.id, id);
    assert.ok(Number.isInteger(part.cost) && part.cost > 0, id);
    assert.ok(['common', 'rare', 'legendary'].includes(part.rarity), id);
    for (let level = 1; level <= 3; level++) {
      const text = part.describe(level, part.directional ? 1 : undefined);
      const sentences = text.split(/[.:]\s+|\.$/).filter((x) => x.trim().length > 0);
      for (const sentence of sentences) {
        assert.ok(sentence.trim().split(/\s+/).length <= 10, id + ': ' + sentence);
      }
      const example = part.example(level);
      assert.ok(example === null || example.before === 2, id);
    }
  }
  assert.equal(PARTS.jackpot.rarity, 'legendary');
});

test('spring adds 2/4/7 and turns to face its rotation; boost scales the add', () => {
  [2, 4, 7].forEach((add, i) => {
    const ctx = runPart(PARTS.spring, { value: 1, level: i + 1, rot: 1 });
    near(ctx.value, 1 + add);
    assert.deepEqual(ctx.calls.setDir, ['down']);
  });
  near(runPart(PARTS.spring, { value: 1, level: 1, boost: 2 }).value, 5);
  assert.equal(PARTS.spring.describe(1, 1), 'Adds 2 and turns the spark DOWN.');
});

test('sideamp only multiplies sparks moving up or down', () => {
  near(runPart(PARTS.sideamp, { value: 4, level: 1, dir: 'down' }).value, 8);
  near(runPart(PARTS.sideamp, { value: 4, level: 2, dir: 'up' }).value, 10);
  near(runPart(PARTS.sideamp, { value: 4, level: 3, dir: 'down', boost: 2 }).value, 4 * 5);
  assert.equal(runPart(PARTS.sideamp, { value: 4, dir: 'right' }).value, 4);
  assert.equal(runPart(PARTS.sideamp, { value: 4, dir: 'left' }).value, 4);
});

test('bouncer goes up or down by a seeded coin flip and adds 0/2/5', () => {
  assert.deepEqual(runPart(PARTS.bouncer, { rngValues: [0.1] }).calls.setDir, ['up']);
  assert.deepEqual(runPart(PARTS.bouncer, { rngValues: [0.9] }).calls.setDir, ['down']);
  assert.equal(runPart(PARTS.bouncer, { value: 3, level: 1 }).value, 3);
  near(runPart(PARTS.bouncer, { value: 3, level: 2 }).value, 5);
  near(runPart(PARTS.bouncer, { value: 3, level: 3 }).value, 8);
});

test('workbench pays once per Fire: 1 coin per part, capped', () => {
  const state = {};
  const first = runPart(PARTS.workbench, { level: 1, state: state, fire: fireOf(2) });
  assert.deepEqual(first.calls.addCoins, [2]);
  const second = runPart(PARTS.workbench, { level: 1, state: state, fire: fireOf(2) });
  assert.deepEqual(second.calls.addCoins, []);
  assert.deepEqual(runPart(PARTS.workbench, { level: 1, fire: fireOf(20) }).calls.addCoins, [3]);
  assert.deepEqual(runPart(PARTS.workbench, { level: 3, fire: fireOf(20) }).calls.addCoins, [6]);
  assert.deepEqual(runPart(PARTS.workbench, { level: 1, fire: fireOf(0) }).calls.addCoins, []);
});

test('jackpot: win multiplier on a low roll, x0.9 otherwise', () => {
  near(runPart(PARTS.jackpot, { value: 2, level: 1, rngValues: [0.1] }).value, 40);
  near(runPart(PARTS.jackpot, { value: 2, level: 2, rngValues: [0.2] }).value, 50);
  near(runPart(PARTS.jackpot, { value: 2, level: 3, rngValues: [0.29] }).value, 60);
  near(runPart(PARTS.jackpot, { value: 10, level: 1, rngValues: [0.5] }).value, 9);
  near(runPart(PARTS.jackpot, { value: 10, level: 3, rngValues: [0.3] }).value, 9);
  near(runPart(PARTS.jackpot, { value: 1, level: 1, boost: 2, rngValues: [0] }).value, 39);
});

test('jackpot chance matches its level over many seeded rolls', () => {
  let wins = 0;
  const total = 1000;
  for (let i = 0; i < total; i++) {
    const roll = (i + 0.5) / total;
    if (runPart(PARTS.jackpot, { value: 1, level: 1, rngValues: [roll] }).value > 1) {
      wins++;
    }
  }
  assert.equal(wins, 200);
});

test('finisher only works in the last column', () => {
  near(runPart(PARTS.finisher, { value: 3, level: 1, x: 4, cols: 5 }).value, 9);
  near(runPart(PARTS.finisher, { value: 3, level: 3, x: 4, cols: 5 }).value, 18);
  const early = runPart(PARTS.finisher, { value: 3, level: 1, x: 3, cols: 5 });
  assert.equal(early.value, 3);
  assert.equal(early.calls.note.length, 1);
  assert.equal(runPart(PARTS.finisher, { value: 3, x: undefined }).value, 3);
});

test('starter only works in the first column', () => {
  near(runPart(PARTS.starter, { value: 1, level: 1, x: 0 }).value, 7);
  near(runPart(PARTS.starter, { value: 1, level: 3, x: 0, boost: 2 }).value, 33);
  assert.equal(runPart(PARTS.starter, { value: 1, level: 3, x: 1 }).value, 1);
});

test('new parts never give NaN or Infinity', () => {
  const ids = ['spring', 'sideamp', 'bouncer', 'workbench', 'jackpot', 'finisher', 'starter'];
  const values = [0, 1, 1e100, 1e300];
  for (const id of ids) {
    for (let level = 1; level <= 3; level++) {
      for (const value of values) {
        const ctx = runPart(PARTS[id], { value: value, level: level, boost: 3, dir: 'down', x: 0, rngValues: [0] });
        assert.ok(Number.isFinite(ctx.value), id + ' ' + value);
      }
    }
  }
});
