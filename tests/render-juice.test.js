// Tests for juice math (never NaN) and the tempo ramp.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { jumpSize, popScale, numberScale, shakePixels, popCurve, easeOutBack } from '../src/render/juice.js';
import { moveMsForPass } from '../src/render/timeline.js';

var WEIRD = [0, 1e-9, 0.5, 1, 10, 1e300, NaN, Infinity, -5, undefined, null];

test('juice functions are never NaN or Infinity', function () {
  for (var i = 0; i < WEIRD.length; i++) {
    for (var j = 0; j < WEIRD.length; j++) {
      var values = [jumpSize(WEIRD[i], WEIRD[j]), popScale(WEIRD[i], WEIRD[j]),
        numberScale(WEIRD[i], WEIRD[j]), shakePixels(WEIRD[j])];
      for (var k = 0; k < values.length; k++) {
        assert.ok(Number.isFinite(values[k]), 'bad value for ' + WEIRD[i] + ',' + WEIRD[j]);
      }
    }
  }
});

test('bigger jumps pop bigger, with a cap', function () {
  assert.ok(popScale(1, 1000) > popScale(1, 2));
  assert.equal(popScale(1, 1e100), popScale(1, 1e10));
  assert.equal(jumpSize(100, 50), 0);
});

test('shake grows with value but is capped', function () {
  assert.equal(shakePixels(1), 0);
  assert.ok(shakePixels(1e6) > shakePixels(100));
  assert.ok(shakePixels(1e300) <= 7);
});

test('pop curve starts and ends at zero', function () {
  assert.equal(popCurve(0), 0);
  assert.equal(popCurve(1), 0);
  assert.ok(popCurve(0.3) > 0.99);
  assert.ok(Number.isFinite(easeOutBack(5)));
});

test('tempo ramps up per pass and has a floor', function () {
  assert.equal(moveMsForPass(0, 1, false), 130);
  assert.ok(moveMsForPass(1, 1, false) < moveMsForPass(0, 1, false));
  assert.equal(moveMsForPass(500, 1, false), 45);
  assert.equal(moveMsForPass(0, 2, false), 65);
  assert.ok(Math.abs(moveMsForPass(0, 1, true) - 130 / 1.5) < 1e-9);
});
