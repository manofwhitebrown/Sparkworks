// The particle pool never grows past its cap and cleans itself up.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { createParticles } from '../src/render/particles.js';

function rand() { return 0.5; }

test('pool respects the quality cap', function () {
  var p = createParticles();
  p.setCap(30);
  for (var i = 0; i < 10; i++) {
    p.burst(10, 10, 40, 100, 1, 6, 0, rand);
  }
  assert.ok(p.count() <= 30);
});

test('particles die after their life', function () {
  var p = createParticles();
  p.setCap(80);
  p.burst(0, 0, 20, 50, 0.5, 5, 1, rand);
  assert.ok(p.count() > 0);
  for (var i = 0; i < 100; i++) {
    p.update(0.02);
  }
  assert.equal(p.count(), 0);
});

test('cap of zero emits nothing', function () {
  var p = createParticles();
  p.setCap(0);
  p.burst(0, 0, 20, 50, 0.5, 5, 1, rand);
  assert.equal(p.count(), 0);
});
