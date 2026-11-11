// Round 5 renderer tests: fireScale, hero bank, shimmer phase, wire/ring/vault-fill effects, merge, slow-down.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { fireScale, isHeroBank, heroShake } from '../src/render/fireScale.js';
import { shimmerPhase, shimmerOn } from '../src/render/shimmer.js';
import { createEffects } from '../src/render/effects.js';
import { createSparkPlayer } from '../src/render/sparkPlayer.js';
import { createParticles } from '../src/render/particles.js';
import { computeLayout } from '../src/render/layout.js';
import { simulate } from '../src/engine/simulate.js';
import { makeMachine, placePart } from '../src/engine/board.js';

test('fireScale: empty, junk and huge values never give NaN', function () {
  assert.equal(fireScale([]).intensity, 0);
  assert.equal(fireScale(null).bankCount, 0);
  var s = fireScale([{ n: 0, type: 'bank', value: NaN }, { n: 1, type: 'bank', value: 1e300 }]);
  assert.ok(s.intensity >= 0 && s.intensity <= 1);
  assert.equal(s.bigBankN, 1);
  assert.equal(s.bankCount, 2);
});

test('fireScale: intensity grows with the biggest bank', function () {
  var small = fireScale([{ n: 0, type: 'bank', value: 5 }]);
  var big = fireScale([{ n: 0, type: 'bank', value: 5e6 }]);
  assert.ok(big.intensity > small.intensity);
});

test('isHeroBank: only the biggest bank, only when large', function () {
  var events = [{ n: 3, type: 'bank', value: 20 }, { n: 7, type: 'bank', value: 5000 }];
  var sc = fireScale(events);
  assert.equal(isHeroBank(sc, events[1]), true);
  assert.equal(isHeroBank(sc, events[0]), false);
  var tiny = fireScale([{ n: 0, type: 'bank', value: 50 }]);
  assert.equal(isHeroBank(tiny, { n: 0, type: 'bank', value: 50 }), false);
  assert.equal(isHeroBank(sc, null), false);
});

test('heroShake is stronger than the base but capped', function () {
  assert.ok(heroShake(5, 7) > 5);
  assert.ok(heroShake(1000, 7) <= 7 * 1.4 + 1e-9);
  assert.equal(heroShake(NaN, 7), 0);
});

test('shimmerPhase sweeps then rests, never NaN', function () {
  assert.equal(shimmerPhase(0, 0), -1);
  var mid = shimmerPhase(0.64, 0);
  assert.ok(mid > -1 && mid < 1);
  assert.equal(shimmerPhase(2.5, 0), null);
  assert.equal(shimmerPhase(NaN, 0), null);
  assert.equal(shimmerOn({ quality: 'low', reduceMotion: false }), false);
  assert.equal(shimmerOn({ quality: 'medium', reduceMotion: true }), false);
  assert.equal(shimmerOn({ quality: 'high', reduceMotion: false }), true);
});

test('effects: wire glow, rings and vault fill come and go', function () {
  var fx = createEffects();
  fx.reset(5, 4);
  fx.lightWire(2, 1, 1, 1);
  assert.equal(fx.wireOf(1 * 5 + 2), 1);
  assert.equal(fx.wireGeoOf(1 * 5 + 2, 0), 1);
  fx.addRing(1, 1, 1);
  fx.setPlaying(true);
  fx.bank(1e6, true);
  assert.ok(fx.vault.fillTarget > 0.3);
  assert.equal(fx.busy(), true);
  fx.setPlaying(false);
  for (var i = 0; i < 600; i++) { fx.update(1 / 60); }
  assert.equal(fx.wireOf(1 * 5 + 2), 0);
  assert.equal(fx.rings[0].on, false);
  assert.equal(fx.vault.fill, 0);
  fx.vault.shown = fx.vault.target;
  for (i = 0; i < 120; i++) { fx.update(1 / 60); }
  assert.equal(fx.busy(), false);
});

function makeHarness(machine) {
  var effects = createEffects();
  effects.reset(machine.cols, machine.rows);
  var layout = computeLayout(360, 300, machine.cols, machine.rows);
  var played = [];
  var player = createSparkPlayer({
    getLayout: function () { return layout; }, getMachine: function () { return machine; },
    effects: effects, particles: createParticles(),
    getFlags: function () { return { quality: 'medium', reduceMotion: false }; },
    onEventPlayed: function (e) { played.push(e.n); },
    formatNumber: String, rand: function () { return 0.5; }
  });
  return { player: player, effects: effects, played: played };
}

test('a hero bank slows the clock and every event is still reported once', function () {
  var machine = makeMachine({ sparkCount: 1 });
  var events = [
    { n: 0, type: 'spawn', spark: 1, x: 0, y: 1, dir: 'right', value: 1, parent: 0 },
    { n: 1, type: 'enter', spark: 1, x: 0, y: 1, dir: 'right', value: 1 },
    { n: 2, type: 'bank', spark: 1, value: 9000, runningTotal: 9000 },
    { n: 3, type: 'end', spark: 0, total: 9000, coins: 0 }
  ];
  var h = makeHarness(machine);
  h.player.play(events, {});
  var framesSlow = 0;
  while (h.player.isPlaying() && framesSlow < 5000) { h.player.update(1 / 60); framesSlow++; }
  assert.deepEqual(h.played, [0, 1, 2, 3]);
  // the same log with a small bank is faster (no slow-down)
  events[2].value = 20;
  events[2].runningTotal = 20;
  var h2 = makeHarness(machine);
  h2.player.play(events, {});
  var framesFast = 0;
  while (h2.player.isPlaying() && framesFast < 5000) { h2.player.update(1 / 60); framesFast++; }
  assert.ok(framesSlow > framesFast);
});

test('real fires: wires light up and all events are reported once', function () {
  var machine = makeMachine({ sparkCount: 3, seed: 4 });
  placePart(machine, 0, 1, 'coil', 1, 0);
  placePart(machine, 1, 1, 'amplifier', 1, 0);
  var result = simulate(machine);
  var h = makeHarness(machine);
  h.player.play(result.events, {});
  var sawWire = false;
  var frames = 0;
  while (h.player.isPlaying() && frames < 20000) {
    h.player.update(1 / 60);
    h.effects.update(1 / 60);
    if (h.effects.wireOf(1 * machine.cols + 1) > 0) { sawWire = true; }
    frames++;
  }
  assert.equal(sawWire, true);
  assert.equal(h.played.length, result.events.length);
});
