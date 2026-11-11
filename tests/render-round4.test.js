// Round 4 renderer tests: path preview math, bonus labels, bonus event, lost-spark marker, diagram timer.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPreview } from '../src/render/previewPath.js';
import { bonusLabel, bonusAt } from '../src/render/bonusTiles.js';
import { createSparkPlayer } from '../src/render/sparkPlayer.js';
import { createEffects } from '../src/render/effects.js';
import { createParticles } from '../src/render/particles.js';
import { computeLayout } from '../src/render/layout.js';
import { buildTimeline } from '../src/render/timeline.js';
import { waitStep, activeDiagramCount } from '../src/render/diagram.js';
import { simulate } from '../src/engine/simulate.js';
import { makeMachine, placePart } from '../src/engine/board.js';

function makePlayer(machine, played) {
  var effects = createEffects();
  effects.reset(machine.cols, machine.rows);
  var layout = computeLayout(360, 300, machine.cols, machine.rows);
  var player = createSparkPlayer({
    getLayout: function () { return layout; },
    getMachine: function () { return machine; },
    effects: effects,
    particles: createParticles(),
    getFlags: function () { return { quality: 'medium', reduceMotion: false }; },
    onEventPlayed: function (e) { played.push(e.n); },
    formatNumber: function (n) { return String(n); },
    rand: function () { return 0.5; }
  });
  return { player: player, effects: effects };
}

function runAll(player) {
  var frames = 0;
  while (player.isPlaying() && frames < 100000) { player.update(1 / 60); frames++; }
  return frames;
}

test('buildPreview: three sparks on one road draw one line', function () {
  var cells = [];
  for (var s = 0; s < 3; s++) {
    for (var x = 0; x < 5; x++) { cells.push({ x: x, y: 1 }); }
  }
  var p = buildPreview(cells);
  assert.equal(p.segments.length, 4);
  assert.equal(p.startsAtSource, true);
  assert.equal(p.segments[0].dir, 'right');
});

test('buildPreview: turns, repeats and bad input', function () {
  var p = buildPreview([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 1 }, { x: 0, y: 0 }]);
  assert.deepEqual(p.segments.map(function (s) { return s.dir; }), ['right', 'down', 'left', 'up']);
  assert.deepEqual(buildPreview(null).segments, []);
  assert.deepEqual(buildPreview([]).segments, []);
  assert.equal(buildPreview([{ x: 0, y: 0 }, { x: 3, y: 3 }]).segments.length, 0);
});

test('bonusLabel and bonusAt', function () {
  assert.equal(bonusLabel({ kind: 'add', amount: 3 }), '+3');
  assert.equal(bonusLabel({ kind: 'mult', amount: 2 }), 'x2');
  assert.equal(bonusLabel({ kind: 'mult', amount: 1.5 }), 'x1.5');
  assert.equal(bonusLabel(null), '');
  assert.equal(bonusLabel({ kind: 'add', amount: NaN }), '');
  var m = { bonusCells: [{ x: 1, y: 2, kind: 'add', amount: 3 }] };
  assert.equal(bonusAt(m, 1, 2).amount, 3);
  assert.equal(bonusAt(m, 0, 0), null);
  assert.equal(bonusAt({}, 0, 0), null);
});

test('timeline gives a bonus event time to play', function () {
  var tl = buildTimeline([{ n: 0, type: 'bonus', spark: 1, x: 1, y: 1 }], {});
  assert.ok(tl.steps[0].dur > 0);
});

test('a bonus event is reported once and lights the floor tile', function () {
  var machine = makeMachine({ sparkCount: 1 });
  var played = [];
  var h = makePlayer(machine, played);
  var events = [
    { n: 0, type: 'spawn', spark: 1, x: 0, y: 1, dir: 'right', value: 1, parent: 0 },
    { n: 1, type: 'enter', spark: 1, x: 0, y: 1, dir: 'right', value: 1 },
    { n: 2, type: 'bonus', spark: 1, x: 0, y: 1, kind: 'add', amount: 3, before: 1, after: 4 },
    { n: 3, type: 'bank', spark: 1, value: 4, runningTotal: 4 },
    { n: 4, type: 'end', spark: 0, total: 4, coins: 0 }
  ];
  h.player.play(events, {});
  var sawFlash = false;
  var frames = 0;
  while (h.player.isPlaying() && frames < 5000) {
    h.player.update(1 / 60);
    if (h.effects.bonusFlashOf(1 * machine.cols + 0) > 0) { sawFlash = true; }
    frames++;
  }
  assert.deepEqual(played, [0, 1, 2, 3, 4]);
  assert.equal(sawFlash, true);
});

test('a spark lost at a side edge gets one "x" marker', function () {
  var machine = makeMachine({ sparkCount: 2, seed: 3 });
  placePart(machine, 1, 1, 'bend', 1, 3); // turns the spark up, out of the top edge
  var result = simulate(machine);
  var lost = result.events.filter(function (e) { return e.type === 'fizzle' && e.reason === 'edge'; });
  assert.ok(lost.length >= 1);
  var played = [];
  var h = makePlayer(machine, played);
  h.player.play(result.events, {});
  var maxMarks = 0;
  var frames = 0;
  while (h.player.isPlaying() && frames < 20000) {
    h.player.update(1 / 60);
    var on = 0;
    for (var i = 0; i < h.effects.lostMarks.length; i++) { if (h.effects.lostMarks[i].on) { on++; } }
    if (on > maxMarks) { maxMarks = on; }
    frames++;
  }
  assert.ok(maxMarks >= 1);
  assert.equal(played.length, result.events.length);
  // the marker sits above the board (y < 0) because the spark left through the top
  var found = false;
  h.player.play(result.events, {});
  frames = 0;
  while (h.player.isPlaying() && frames < 20000) {
    h.player.update(1 / 60);
    for (var j = 0; j < h.effects.lostMarks.length; j++) {
      if (h.effects.lostMarks[j].on && h.effects.lostMarks[j].y < 0) { found = true; }
    }
    frames++;
  }
  assert.equal(found, true);
});

test('skip still reports every event once with bonus and lost events', function () {
  var machine = makeMachine({ sparkCount: 3, seed: 9 });
  placePart(machine, 1, 1, 'bend', 1, 3);
  var result = simulate(machine);
  var played = [];
  var h = makePlayer(machine, played);
  h.player.play(result.events, {});
  h.player.update(1 / 60);
  h.player.skip();
  runAll(h.player);
  assert.equal(played.length, result.events.length);
  for (var i = 0; i < played.length; i++) { assert.equal(played[i], result.events[i].n); }
});

test('waitStep counts down and never goes below zero', function () {
  assert.equal(waitStep(1, 0.25), 0.75);
  assert.equal(waitStep(0.1, 0.5), 0);
  assert.equal(waitStep(0, 0.5), 0);
  assert.equal(activeDiagramCount(), 0);
});
