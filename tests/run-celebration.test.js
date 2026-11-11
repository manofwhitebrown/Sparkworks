// Tests for the celebration numbers (stars, medal, burst, timings). Owner: AI-4
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  starsForShift, starsFromHistory, runRating, fxTier, burstCount, burstPieces,
  flightMs, staggerDelays, tickValue, clearedTitle, starsLabel, lostLine
} from '../src/run/celebration.js';
import { CELEBRATION_RULES } from '../src/data/shifts.js';

test('stars: 0 below the target, then 1, 2 and 3 at the ratios', () => {
  assert.equal(starsForShift(19, 20), 0);
  assert.equal(starsForShift(20, 20), 1);
  assert.equal(starsForShift(29, 20), 1);
  assert.equal(starsForShift(30, 20), 2);
  assert.equal(starsForShift(50, 20), 3);
  assert.equal(starsForShift(1e300, 20), 3);
});

test('stars: bad numbers give 0 and never NaN', () => {
  assert.equal(starsForShift(NaN, 20), 0);
  assert.equal(starsForShift(10, 0), 0);
  assert.equal(starsForShift(undefined, undefined), 0);
});

test('history stars: a lost last shift counts 0', () => {
  const history = [{ shift: 1, total: 20, target: 16 }, { shift: 2, total: 5, target: 22 }];
  assert.deepEqual(starsFromHistory(history), [1, 0]);
  assert.deepEqual(starsFromHistory(null), []);
});

function wonHistory(total, target) {
  const history = [];
  for (let shift = 1; shift <= 8; shift++) history.push({ shift: shift, total: total, target: target });
  return history;
}

test('medal: lost runs get none, won runs get bronze, silver or gold', () => {
  assert.equal(runRating(wonHistory(100, 10), false).medal, 'none');
  assert.equal(runRating(wonHistory(10, 10), true).medal, 'bronze');
  assert.equal(runRating(wonHistory(15, 10), true).medal, 'silver');
  assert.equal(runRating(wonHistory(25, 10), true).medal, 'gold');
});

test('rating counts stars and cleared shifts', () => {
  const rating = runRating(wonHistory(25, 10), true);
  assert.equal(rating.earned, 24);
  assert.equal(rating.possible, 24);
  assert.equal(rating.cleared, 8);
  assert.equal(runRating([], false).possible, 0);
});

test('motion tier follows the settings', () => {
  assert.equal(fxTier({ reduceMotion: true, quality: 'high' }), 'none');
  assert.equal(fxTier({ quality: 'low' }), 'low');
  assert.equal(fxTier({ quality: 'auto' }), 'full');
  assert.equal(fxTier(undefined), 'full');
});

test('burst size stays under the particle caps and is 0 with reduce motion', () => {
  assert.equal(burstCount({ reduceMotion: true }), 0);
  assert.ok(burstCount({ quality: 'low' }) <= 30);
  assert.ok(burstCount({ quality: 'auto' }) <= 80);
  assert.ok(burstCount({ quality: 'high' }) <= 150);
  assert.ok(burstCount({ quality: 'low' }) < burstCount({ quality: 'high' }));
});

test('burst pieces: same seed gives the same pieces, all numbers are finite', () => {
  const a = burstPieces(30, 42);
  const b = burstPieces(30, 42);
  assert.deepEqual(a, b);
  assert.equal(a.length, 30);
  for (let i = 0; i < a.length; i++) {
    assert.ok(Number.isFinite(a[i].angle) && Number.isFinite(a[i].distance));
    assert.ok(a[i].size >= 3 && a[i].delay >= 0);
  }
  assert.notDeepEqual(a, burstPieces(30, 43));
});

test('flight time stays inside its limits', () => {
  assert.equal(flightMs(0), CELEBRATION_RULES.flightMsMin);
  assert.equal(flightMs(100000), CELEBRATION_RULES.flightMsMax);
  assert.equal(flightMs(NaN), CELEBRATION_RULES.flightMsMin);
});

test('stagger delays rise by the step and stop at the max', () => {
  const delays = staggerDelays(20);
  assert.equal(delays[0], 0);
  assert.equal(delays[1], CELEBRATION_RULES.staggerStepMs);
  assert.equal(delays[19], CELEBRATION_RULES.staggerMaxMs);
});

test('tickValue starts at from, ends exactly at to and survives bad input', () => {
  assert.equal(tickValue(0, 100, 0), 0);
  assert.equal(tickValue(0, 100, 1), 100);
  assert.ok(tickValue(0, 100, 0.5) > 50);
  assert.equal(tickValue(10, 4, 1), 4);
  assert.equal(tickValue(NaN, 7, 0.3) <= 7, true);
  assert.equal(tickValue(0, 9, NaN), 9);
});

test('words are short and plain', () => {
  assert.equal(clearedTitle(3), 'Shift 3 cleared');
  assert.equal(starsLabel(2), '2 of 3 stars');
  assert.equal(lostLine(0), 'Not this time. Try a new run.');
  assert.equal(lostLine(1), 'Not this time. You cleared 1 shift.');
  assert.equal(lostLine(4), 'Not this time. You cleared 4 shifts.');
  const banned = /\b(pass|passed|banked|bank|fizzle|value|fail|failed)\b/i;
  [clearedTitle(2), lostLine(0), lostLine(3), starsLabel(1)].forEach(function (text) {
    assert.ok(!banned.test(text), text);
    assert.ok(text.split(/\s+/).length <= 12, text);
  });
});
