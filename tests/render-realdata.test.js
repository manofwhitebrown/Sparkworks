// Plays REAL event logs (real engine, real parts) through the spark player without a canvas.
// Every event must be reported exactly once, in order, with and without skip.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSparkPlayer } from '../src/render/sparkPlayer.js';
import { createEffects } from '../src/render/effects.js';
import { createParticles } from '../src/render/particles.js';
import { computeLayout } from '../src/render/layout.js';
import { simulate } from '../src/engine/simulate.js';
import { makeMachine, placePart } from '../src/engine/board.js';
import { allPartIds } from '../src/engine/parts/index.js';
import { makeRng } from '../src/core/rng.js';

function randomMachine(seed) {
  var rng = makeRng(seed);
  var ids = allPartIds();
  var m = makeMachine({ sparkCount: 3, seed: seed });
  for (var y = 0; y < m.rows; y++) {
    for (var x = 0; x < m.cols; x++) {
      if (rng() < 0.75) {
        placePart(m, x, y, ids[Math.floor(rng() * ids.length)], 1 + Math.floor(rng() * 3), Math.floor(rng() * 4));
      }
    }
  }
  return m;
}

function makePlayer(machine, played) {
  var effects = createEffects();
  effects.reset(machine.cols, machine.rows);
  var layout = computeLayout(360, 300, machine.cols, machine.rows);
  return createSparkPlayer({
    getLayout: function () { return layout; },
    getMachine: function () { return machine; },
    effects: effects,
    particles: createParticles(),
    getFlags: function () { return { quality: 'medium', reduceMotion: false }; },
    onEventPlayed: function (e) { played.push(e.n); },
    formatNumber: function (n) { return String(n); },
    rand: function () { return 0.5; }
  });
}

function runAll(player, skipAfter) {
  var frames = 0;
  while (player.isPlaying() && frames < 200000) {
    player.update(1 / 60);
    frames++;
    if (frames === skipAfter) { player.skip(); }
  }
  return frames;
}

test('30 random real machines: every event reported once, in order', async function () {
  for (var seed = 1; seed <= 30; seed++) {
    var machine = randomMachine(seed);
    var events = simulate(machine).events;
    var played = [];
    var player = makePlayer(machine, played);
    var promise = player.play(events, { speed: 4 });
    var frames = runAll(player, 0);
    await promise;
    assert.ok(frames < 200000, 'seed ' + seed + ' never finished');
    assert.equal(played.length, events.length, 'seed ' + seed);
    for (var i = 0; i < played.length; i++) { assert.equal(played[i], i, 'seed ' + seed); }
  }
});

test('real logs with skip in the middle still report everything once', async function () {
  for (var seed = 100; seed < 110; seed++) {
    var machine = randomMachine(seed);
    var events = simulate(machine).events;
    var played = [];
    var player = makePlayer(machine, played);
    var promise = player.play(events, {});
    runAll(player, 30);
    await promise;
    assert.equal(played.length, events.length, 'seed ' + seed);
    for (var i = 0; i < played.length; i++) { assert.equal(played[i], i, 'seed ' + seed); }
  }
});
