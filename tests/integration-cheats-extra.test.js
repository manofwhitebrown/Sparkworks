// Tests for the round 5 cheat additions (giveThree) and for the Back-button order fix:
// the cheat menu must be installed BEFORE the app, so its popstate listener runs first.
// Owner: AI-8

import test from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { newRun } from '../src/run/runState.js';
import { allPartIds } from '../src/engine/parts/index.js';
import { benchSizeOf } from '../src/run/runRules.js';
import { giveThree, setStartValue } from '../src/cheats/runCheats.js';
import { validateMachine } from '../src/engine/board.js';

function freshRun() {
  return newRun({ inventorId: 'tinkerbot', voltage: 1, seed: 5, poolIds: allPartIds(), bonuses: {} });
}

test('giveThree: three level 1 parts merge into one level 2 part', function () {
  const run = freshRun();
  const before = run.bench.filter(function (b) { return b.partId === 'anvil'; }).length;
  const res = giveThree(run, 'anvil', 1);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(run.cheated, true);
  const level2 = run.bench.filter(function (b) { return b.partId === 'anvil' && b.level === 2; });
  assert.ok(level2.length >= 1, 'a level 2 anvil exists');
  assert.ok(run.bench.length <= benchSizeOf(run), 'bench still fits');
  assert.ok(before >= 0);
  assert.deepStrictEqual(validateMachine(run.machine), []);
});

test('giveThree: refuses level 3, bad level and unknown part, and changes nothing', function () {
  const run = freshRun();
  const copy = JSON.stringify(run);
  assert.strictEqual(giveThree(run, 'coil', 3).ok, false);
  assert.strictEqual(giveThree(run, 'coil', 0).ok, false);
  assert.strictEqual(giveThree(run, 'nope', 1).ok, false);
  assert.strictEqual(JSON.stringify(run), copy);
});

test('start value accepts the big numbers the new buttons use', function () {
  const values = [100, 1000, 1e6, 1e12];
  for (let i = 0; i < values.length; i++) {
    const run = freshRun();
    assert.strictEqual(setStartValue(run, values[i]).ok, true);
    assert.strictEqual(run.machine.startValue, values[i]);
  }
});

test('main.js installs the cheat listener before the app starts', function () {
  const src = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const cheats = src.indexOf('installCheats();');
  const app = src.indexOf('startApp();');
  assert.ok(cheats !== -1 && app !== -1, 'both calls exist');
  assert.ok(cheats < app, 'installCheats() must come before startApp()');
});
