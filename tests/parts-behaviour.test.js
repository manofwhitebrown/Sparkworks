// Behaviour of each part alone, using the fake ctx. Checks every level and boost.
// Owner: AI-3
import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTS } from '../src/engine/parts/index.js';
import { makeFakeCtx, runPart } from './helpers/fakeCtx.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, a + ' vs ' + b);
const fireOf = (n, banked, count, parts) => ({
  sparkNumber: n, bankedTotal: banked || 0, bankedCount: count || 0, partsOnBoard: parts || 1
});

test('coil adds 3/5/8 and boost scales the bonus', () => {
  [3, 5, 8].forEach((add, i) => {
    near(runPart(PARTS.coil, { value: 1, level: i + 1 }).value, 1 + add);
    near(runPart(PARTS.coil, { value: 1, level: i + 1, boost: 2 }).value, 1 + add * 2);
  });
  assert.equal(runPart(PARTS.coil, { value: 1 }).calls.setValue[0].label, '+3');
});

test('dynamo adds per part on board', () => {
  near(runPart(PARTS.dynamo, { value: 0, level: 2, fire: fireOf(1, 0, 0, 6) }).value, 12);
});

test('ember: first spark gets nothing, later sparks get per earlier spark', () => {
  assert.equal(runPart(PARTS.ember, { value: 4, fire: fireOf(1) }).value, 4);
  near(runPart(PARTS.ember, { value: 4, level: 3, fire: fireOf(3) }).value, 4 + 16);
});

test('amplifier multiplies, boost makes 1 + (m-1)*boost', () => {
  near(runPart(PARTS.amplifier, { value: 4, level: 2 }).value, 10);
  near(runPart(PARTS.amplifier, { value: 4, level: 1, boost: 2 }).value, 12);
});

test('compounder grows with value and is capped', () => {
  near(runPart(PARTS.compounder, { value: 10, level: 1 }).value, 20);
  near(runPart(PARTS.compounder, { value: 1000, level: 1 }).value, 6000);
  near(runPart(PARTS.compounder, { value: 1000, level: 3 }).value, 10000);
});

test('overdrive only works for source spark 1', () => {
  near(runPart(PARTS.overdrive, { value: 2, level: 1, fire: fireOf(1) }).value, 8);
  near(runPart(PARTS.overdrive, { value: 2, level: 3, fire: fireOf(1) }).value, 12);
  assert.equal(runPart(PARTS.overdrive, { value: 2, fire: fireOf(2) }).value, 2);
});

test('bend turns to face its rotation', () => {
  assert.deepEqual(runPart(PARTS.bend, { rot: 1 }).calls.setDir, ['down']);
  assert.deepEqual(runPart(PARTS.bend, { rot: 3 }).calls.setDir, ['up']);
});

test('switch: even goes straight, odd turns', () => {
  assert.deepEqual(runPart(PARTS.switch, { value: 4, rot: 1 }).calls.setDir, []);
  assert.deepEqual(runPart(PARTS.switch, { value: 5, rot: 1 }).calls.setDir, ['down']);
  assert.deepEqual(runPart(PARTS.switch, { value: 5.9, rot: 3 }).calls.setDir, ['up']);
});

test('reverser works N times then disables', () => {
  for (let level = 1; level <= 3; level++) {
    const state = {};
    for (let use = 1; use <= level; use++) {
      const ctx = runPart(PARTS.reverser, { dir: 'right', level, state });
      assert.deepEqual(ctx.calls.setDir, ['left']);
      assert.equal(ctx.calls.disable, use === level ? 1 : 0);
    }
  }
});

test('splitter and triplet copies', () => {
  const s = runPart(PARTS.splitter, { value: 10, level: 2, rot: 1 });
  assert.equal(s.calls.split.length, 1);
  assert.equal(s.calls.split[0].dir, 'down');
  near(s.calls.split[0].value, 6.5);
  assert.equal(s.value, 10);
  const t = runPart(PARTS.triplet, { value: 10, level: 1, rot: 1 });
  assert.deepEqual(t.calls.split.map((c) => c.dir), ['down', 'up']);
  near(t.calls.split[0].value, 4);
  const capped = runPart(PARTS.splitter, { value: 10, level: 3, boost: 2 });
  near(capped.calls.split[0].value, 10);
});

test('capacitor stores then pays back, then repeats', () => {
  const state = {};
  const first = runPart(PARTS.capacitor, { value: 10, level: 1, state });
  near(first.value, 6);
  const second = runPart(PARTS.capacitor, { value: 5, level: 1, state });
  near(second.value, 9);
  const third = runPart(PARTS.capacitor, { value: 10, level: 1, state });
  near(third.value, 6);
});

test('counter triggers on every Nth spark', () => {
  const state = {};
  assert.equal(runPart(PARTS.counter, { value: 2, level: 1, state }).value, 2);
  assert.equal(runPart(PARTS.counter, { value: 2, level: 1, state }).value, 2);
  assert.equal(runPart(PARTS.counter, { value: 2, level: 1, state }).value, 6);
  const state3 = {};
  assert.equal(runPart(PARTS.counter, { value: 2, level: 3, state: state3 }).value, 2);
  assert.equal(runPart(PARTS.counter, { value: 2, level: 3, state: state3 }).value, 8);
  assert.deepEqual(runPart(PARTS.counter, { value: 2, level: 1, state: {} }).calls.note, ['1/3']);
});

test('anvil and flywheel grow with passes', () => {
  const a = {};
  near(runPart(PARTS.anvil, { value: 0, level: 1, state: a }).value, 2);
  near(runPart(PARTS.anvil, { value: 0, level: 1, state: a }).value, 4);
  const f = {};
  near(runPart(PARTS.flywheel, { value: 10, level: 1, state: f }).value, 12);
  near(runPart(PARTS.flywheel, { value: 10, level: 1, state: f }).value, 14);
});

test('battery boosts neighbours and does not change the spark', () => {
  assert.deepEqual([1, 2, 3].map((l) => PARTS.battery.boostFor(l)), [1.5, 1.75, 2]);
  assert.equal(runPart(PARTS.battery, { value: 7 }).value, 7);
});

test('gambler uses the rng and the level tables', () => {
  const at = (r, level) => runPart(PARTS.gambler, { value: 10, level, rngValues: [r] }).value;
  assert.equal(at(0.1, 1), 5);
  assert.equal(at(0.4, 1), 10);
  assert.equal(at(0.6, 1), 20);
  assert.equal(at(0.95, 1), 40);
  assert.equal(at(0.0, 3), 10);
  assert.equal(at(0.3, 3), 20);
  assert.equal(at(0.99, 3), 40);
  assert.equal(at(0.1, 2), 5);
});

test('fuse fires once then disables', () => {
  const ctx = runPart(PARTS.fuse, { value: 2, level: 2 });
  near(ctx.value, 30);
  assert.equal(ctx.calls.disable, 1);
});

test('rectifier: odd adds, even multiplies', () => {
  near(runPart(PARTS.rectifier, { value: 3, level: 1 }).value, 7);
  near(runPart(PARTS.rectifier, { value: 4, level: 1 }).value, 6);
  near(runPart(PARTS.rectifier, { value: 4, level: 3 }).value, 8);
});

test('tollgate pays coins and keeps the value', () => {
  const ctx = runPart(PARTS.tollgate, { value: 9, level: 3 });
  assert.deepEqual(ctx.calls.addCoins, [4]);
  assert.equal(ctx.value, 9);
  assert.deepEqual(runPart(PARTS.tollgate, { level: 1, boost: 2 }).calls.addCoins, [4]);
});

test('prism copies go both sides', () => {
  const ctx = runPart(PARTS.prism, { value: 10, level: 2, rot: 0 });
  assert.deepEqual(ctx.calls.split.map((c) => c.dir), ['right', 'left']);
  near(ctx.calls.split[0].value, 8.5);
});

test('turnstile cycles through three roads', () => {
  const state = {};
  const dirs = [];
  for (let i = 0; i < 4; i++) {
    dirs.push(runPart(PARTS.turnstile, { rot: 1, state }).calls.setDir[0] || 'straight');
  }
  assert.deepEqual(dirs, ['down', 'straight', 'up', 'down']);
});

test('echo adds a share of the banked total', () => {
  assert.equal(runPart(PARTS.echo, { value: 5, fire: fireOf(1, 0) }).value, 5);
  near(runPart(PARTS.echo, { value: 5, level: 3, fire: fireOf(2, 100, 1) }).value, 30);
});

test('mint trades value for coins', () => {
  const ctx = runPart(PARTS.mint, { value: 100, level: 1 });
  near(ctx.value, 80);
  assert.deepEqual(ctx.calls.addCoins, [2]);
  assert.deepEqual(runPart(PARTS.mint, { value: 1000, level: 1 }).calls.addCoins, [3]);
  assert.deepEqual(runPart(PARTS.mint, { value: 5 }).calls.addCoins, []);
});

test('makeFakeCtx refuses NaN like the engine', () => {
  const ctx = makeFakeCtx({ value: 3 });
  ctx.setValue(NaN, 'x');
  assert.equal(ctx.value, 3);
});
