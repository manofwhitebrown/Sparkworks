// Tests for the pure UI helpers. Owner: AI-7
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  progressRatio, shiftText, firesLeftText, nextScreenAfterFire, fireBannerText, backAction
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
