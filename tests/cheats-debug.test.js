// Tests for the debug helpers: Fire preview, event text, rebuilding the last Fire, switches.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { newRun, fire } from '../src/run/runState.js';
import { placeFromBench } from '../src/run/boardActions.js';
import { allPartIds } from '../src/engine/parts/index.js';
import { makeMachine, placePart } from '../src/engine/board.js';
import { simulate } from '../src/engine/simulate.js';
import { defaultMeta } from '../src/meta/metaState.js';
import * as dbg from '../src/cheats/debugTools.js';

function freshRun(seed, inventor) {
  return newRun({ inventorId: inventor || 'tinkerbot', voltage: 1, seed: seed, poolIds: allPartIds(), bonuses: {} });
}

// Put every bench part on the board in a simple row-by-row layout.
function fillBoard(run) {
  let index = 0;
  for (let y = 0; y < 4 && run.bench.length > 0; y++) {
    for (let x = 0; x < 5 && run.bench.length > 0; x++) {
      if (placeFromBench(run, 0, x, y, (x + y) % 4).ok) {
        index++;
      }
    }
  }
  return index;
}

test('preview: same numbers as a real simulate, run unchanged except cheated', () => {
  const run = freshRun(4);
  fillBoard(run);
  const before = JSON.stringify(Object.assign({}, run, { cheated: undefined }));
  const out = dbg.previewFire(run);
  assert.strictEqual(out.ok, true);
  const real = simulate(run.machine);
  assert.strictEqual(out.data.total, real.total);
  assert.strictEqual(out.data.banked, real.banked);
  assert.strictEqual(out.data.fizzled, real.fizzled);
  assert.strictEqual(out.data.coins, real.coins);
  assert.strictEqual(run.cheated, true);
  assert.strictEqual(JSON.stringify(Object.assign({}, run, { cheated: undefined })), before);
});

test('preview: best and worst spark (a fizzle counts as 0)', () => {
  const run = freshRun(1);
  run.machine = makeMachine({ sparkCount: 3, startValue: 1 });
  placePart(run.machine, 1, 1, 'coil', 1, 0);
  const s = dbg.previewFire(run).data;
  assert.strictEqual(s.fizzled, 0);
  assert.strictEqual(s.best, s.worst);
  run.machine.blocked.push({ x: 3, y: 1 });
  const t = dbg.previewFire(run).data;
  assert.strictEqual(t.worst, 0);
  assert.strictEqual(t.total, 0);
  assert.ok(dbg.summaryText(t).indexOf('worst spark 0') !== -1);
});

test('preview uses a fake simulate when given one', () => {
  const run = freshRun(1);
  const fake = function () { return { events: [], total: 7, coins: 1, banked: 2, fizzled: 1 }; };
  const s = dbg.previewFire(run, { simulate: fake }).data;
  assert.strictEqual(s.total, 7);
  assert.strictEqual(s.best, 0);
});

test('event text: a line for every event type of a real Fire, none empty', () => {
  const run = freshRun(9, 'drvolt');
  fillBoard(run);
  const out = fire(run);
  const text = dbg.eventsText(out.result.events);
  const lines = text.split('\n');
  assert.strictEqual(lines.length, out.result.events.length);
  assert.ok(lines[0].indexOf('spawn') !== -1);
  assert.ok(lines[lines.length - 1].indexOf('end') !== -1);
  assert.ok(text.indexOf('undefined') === -1);
  assert.ok(text.indexOf('NaN') === -1);
});

test('event text is capped for huge logs', () => {
  const events = [];
  for (let i = 0; i < 5000; i++) {
    events.push({ n: i, spark: 1, type: 'enter', x: 0, y: 0, dir: 'right', value: 1 });
  }
  const lines = dbg.eventsText(events).split('\n');
  assert.strictEqual(lines.length, 1501);
  assert.ok(lines[1500].indexOf('more events') !== -1);
});

test('rebuilding the last Fire gives the exact events of the real Fire', () => {
  let rebuilt = 0;
  let passedCases = 0;
  for (let seed = 1; seed <= 30; seed++) {
    const run = freshRun(seed, seed % 2 === 0 ? 'drvolt' : 'tinkerbot');
    fillBoard(run);
    if (seed % 3 === 0) {
      run.targetMultiplier = 0.01; // clear the shift so the shop uses the rng again
    }
    const out = fire(run);
    const result = dbg.reconstructFire(run);
    assert.ok(result, 'rebuilt for seed ' + seed);
    assert.deepStrictEqual(result.events, out.result.events);
    rebuilt++;
    if (out.passed) {
      passedCases++;
    }
  }
  assert.strictEqual(rebuilt, 30);
  assert.ok(passedCases > 0);
});

test('rebuilding returns null when there is nothing to rebuild', () => {
  assert.strictEqual(dbg.reconstructFire(null), null);
  assert.strictEqual(dbg.reconstructFire(freshRun(1)), null);
  const run = freshRun(1);
  run.lastFire = { total: 123456789 };
  assert.strictEqual(dbg.reconstructFire(run), null);
});

test('recorder keeps the log of the latest Fire and prefers events sent with the signal', () => {
  const run = freshRun(5);
  fillBoard(run);
  let handler = null;
  const recorder = dbg.makeFireRecorder({
    on: function (name, fn) { assert.strictEqual(name, 'ui:fired'); handler = fn; },
    getRun: function () { return run; }
  });
  assert.strictEqual(recorder.get(), null);
  const out = fire(run);
  handler({});
  assert.strictEqual(recorder.get().how, 'rebuilt');
  assert.deepStrictEqual(recorder.get().events, out.result.events);
  handler({ events: [{ n: 0, spark: 0, type: 'end', total: 1, coins: 0 }] });
  assert.strictEqual(recorder.get().how, 'recorded');
  assert.strictEqual(recorder.get().events.length, 1);
});

test('speed: only known speeds are sent', () => {
  const sent = [];
  const emit = function (name, data) { sent.push([name, data.speed]); };
  for (let i = 0; i < dbg.SPEEDS.length; i++) {
    assert.strictEqual(dbg.setSpeed(dbg.SPEEDS[i], emit).ok, true);
  }
  assert.strictEqual(dbg.setSpeed(3, emit).ok, false);
  assert.strictEqual(dbg.setSpeed('fast', emit).ok, false);
  assert.deepStrictEqual(sent, [['cheat:speed', 0.25], ['cheat:speed', 1], ['cheat:speed', 2], ['cheat:speed', 4], ['cheat:speed', 'instant']]);
});

test('quality override only accepts the real settings values', () => {
  const meta = defaultMeta();
  assert.strictEqual(dbg.setQuality(meta, 'low').ok, true);
  assert.strictEqual(meta.settings.quality, 'low');
  assert.strictEqual(dbg.setQuality(meta, 'ultra').ok, false);
  assert.strictEqual(meta.settings.quality, 'low');
  assert.strictEqual(meta.cheatsUsed, undefined);
});

test('fps and the test error are safe outside a browser', () => {
  dbg.setFps(true);
  dbg.setFps(false);
  assert.strictEqual(dbg.isFpsOn(), false);
});
