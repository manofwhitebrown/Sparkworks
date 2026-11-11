// Tests for the pure UI helpers. Owner: AI-7
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  progressRatio, shiftText, firesLeftText, nextScreenAfterFire, fireBannerText, backAction,
  screenForPhase, fireSpeedFrom
} from '../src/ui/flow.js';

test('progressRatio clamps and survives bad input', () => {
  assert.equal(progressRatio(50, 100), 0.5);
  assert.equal(progressRatio(500, 100), 1);
  assert.equal(progressRatio(10, 0), 0);
  assert.equal(progressRatio(NaN, 100), 0);
  assert.equal(progressRatio(-5, 100), 0);
});

test('texts', () => {
  assert.equal(shiftText(3, 8), 'Shift 3 of 8');
  assert.equal(firesLeftText(1), '1 Fire left');
  assert.equal(firesLeftText(2), '2 Fires left');
});

test('nextScreenAfterFire follows the run phase', () => {
  assert.equal(nextScreenAfterFire({ phase: 'shop' }), 'shop');
  assert.equal(nextScreenAfterFire({ phase: 'won' }), 'results');
  assert.equal(nextScreenAfterFire({ phase: 'lost' }), 'results');
  assert.equal(nextScreenAfterFire({ phase: 'build' }), 'run');
});

test('fireBannerText', () => {
  assert.equal(fireBannerText({ phase: 'shop', lastFire: { passed: true } }), 'Shift cleared!');
  assert.equal(fireBannerText({ phase: 'build', firesLeft: 1, lastFire: { passed: false } }), 'Not enough. 1 Fire left');
  assert.equal(fireBannerText({ phase: 'lost', lastFire: { passed: false } }), 'Out of Fires');
  assert.equal(fireBannerText({ phase: 'build', lastFire: null }), '');
});

test('backAction', () => {
  assert.equal(backAction('run'), 'confirm');
  assert.equal(backAction('shop'), 'confirm');
  assert.equal(backAction('home'), 'stay');
  assert.equal(backAction('settings'), 'home');
});

import { reasonText, shownTotalDuring } from '../src/ui/flow.js';

test('reasonText has a sentence for known codes and a fallback', () => {
  assert.equal(reasonText('bench_full'), 'Your bench is full.');
  assert.equal(reasonText('???'), 'That did not work.');
});

test('shownTotalDuring adds the running total to the earlier total', () => {
  assert.equal(shownTotalDuring(40, 12), 52);
});

test('screenForPhase picks the screen for a run phase', () => {
  assert.equal(screenForPhase('build'), 'run');
  assert.equal(screenForPhase('shop'), 'shop');
  assert.equal(screenForPhase('won'), 'results');
  assert.equal(screenForPhase('lost'), 'results');
  assert.equal(screenForPhase('whatever'), 'run');
});

test('fireSpeedFrom accepts the cheat speeds and ignores junk', () => {
  assert.deepEqual(fireSpeedFrom(0.25), { speed: 0.25, instant: false });
  assert.deepEqual(fireSpeedFrom(4), { speed: 4, instant: false });
  assert.deepEqual(fireSpeedFrom('instant'), { speed: 1, instant: true });
  assert.deepEqual(fireSpeedFrom(undefined), { speed: 1, instant: false });
  assert.deepEqual(fireSpeedFrom(-2), { speed: 1, instant: false });
  assert.deepEqual(fireSpeedFrom('fast'), { speed: 1, instant: false });
});
