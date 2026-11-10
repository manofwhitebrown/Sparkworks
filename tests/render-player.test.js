// The spark player reports every event once, in order, also when skipped. No canvas needed.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSparkPlayer } from '../src/render/sparkPlayer.js';
import { createEffects } from '../src/render/effects.js';
import { createParticles } from '../src/render/particles.js';
import { computeLayout } from '../src/render/layout.js';

function sampleEvents() {
  var ev = [];
  var n = 0;
  function add(e) { e.n = n; n++; ev.push(e); }
  for (var s = 1; s <= 3; s++) {
    add({ type: 'spawn', spark: s, x: 0, y: 1, dir: 'right', value: 1, parent: 0 });
    add({ type: 'enter', spark: s, x: 0, y: 1, dir: 'right', value: 1 });
    add({ type: 'value', spark: s, x: 0, y: 1, partId: 'coil', before: 1, after: 4, label: '+3' });
    add({ type: 'enter', spark: s, x: 1, y: 1, dir: 'right', value: 4 });
    add({ type: 'state', spark: s, x: 1, y: 1, partId: 'counter', label: '1/3' });
    add({ type: 'bank', spark: s, value: 4, runningTotal: 4 * s });
  }
  add({ type: 'end', spark: 0, total: 12, coins: 0 });
  return ev;
}

function makePlayer(played) {
  var effects = createEffects();
  effects.reset(5, 4);
  var particles = createParticles();
  var layout = computeLayout(360, 300, 5, 4);
  var machine = { cols: 5, rows: 4, sourceRow: 1 };
  var player = createSparkPlayer({
    getLayout: function () { return layout; },
    getMachine: function () { return machine; },
    effects: effects,
    particles: particles,
    getFlags: function () { return { quality: 'medium', reduceMotion: false }; },
    onEventPlayed: function (e) { played.push(e.n); },
    formatNumber: function (n) { return String(n); },
    rand: function () { return 0.5; }
  });
  return player;
}

function runFrames(player, maxFrames) {
  var frames = 0;
  while (player.isPlaying() && frames < maxFrames) {
    player.update(1 / 60);
    frames++;
  }
  return frames;
}

test('plays every event once, in order, then resolves', async function () {
  var played = [];
  var player = makePlayer(played);
  var events = sampleEvents();
  var done = false;
  var promise = player.play(events, { speed: 1 }).then(function () { done = true; });
  var frames = runFrames(player, 5000);
  await promise;
  assert.ok(done);
  assert.ok(frames < 5000);
  assert.equal(played.length, events.length);
  for (var i = 0; i < played.length; i++) { assert.equal(played[i], i); }
});

test('skip reports the remaining events once each and ends fast', async function () {
  var played = [];
  var player = makePlayer(played);
  var events = sampleEvents();
  var promise = player.play(events, { speed: 1 });
  runFrames(player, 10);
  player.skip();
  var frames = runFrames(player, 5000);
  await promise;
  assert.ok(frames < 40, 'skip took ' + frames + ' frames');
  assert.equal(played.length, events.length);
  for (var i = 0; i < played.length; i++) { assert.equal(played[i], i); }
});

test('an empty event list resolves at once', async function () {
  var player = makePlayer([]);
  await player.play([], {});
  assert.equal(player.isPlaying(), false);
});

test('starting a new play flushes the old one without losing events', async function () {
  var played = [];
  var player = makePlayer(played);
  var events = sampleEvents();
  var first = player.play(events, {});
  runFrames(player, 5);
  var second = player.play(events, {});
  await first;
  runFrames(player, 5000);
  await second;
  assert.equal(played.length, events.length * 2);
});

test('500 events play to the end', async function () {
  var played = [];
  var player = makePlayer(played);
  var big = [];
  for (var k = 0; k < 125; k++) {
    var s = k + 1;
    big.push({ n: big.length, type: 'spawn', spark: s, x: 0, y: 1, dir: 'right', value: 1, parent: 0 });
    big.push({ n: big.length, type: 'enter', spark: s, x: 0, y: 1, dir: 'right', value: 1 });
    big.push({ n: big.length, type: 'value', spark: s, x: 0, y: 1, partId: 'coil', before: 1, after: 2, label: 'x2' });
    big.push({ n: big.length, type: 'fizzle', spark: s, x: 0, y: 1, value: 2, reason: 'edge' });
  }
  var p = player.play(big, {});
  runFrames(player, 20000);
  await p;
  assert.equal(played.length, 500);
});
