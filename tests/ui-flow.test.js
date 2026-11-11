// Tests for the pure UI helpers. Owner: AI-7
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  progressRatio, shiftText, firesLeftText, nextScreenAfterFire, fireBannerText, backAction,
  screenForPhase, fireSpeedFrom, isTutorialRun, continuableRun, fitBoardSize, validDropCells, emptyPanelText
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
  assert.equal(reasonText('bench_full'), 'Bench is full. Sell or place a part.');
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

test('isTutorialRun only matches the scripted run', () => {
  assert.equal(isTutorialRun({ tutorial: true, phase: 'build' }), true);
  assert.equal(isTutorialRun({ phase: 'build' }), false);
  assert.equal(isTutorialRun(null), false);
});

test('continuableRun ignores tutorial runs and finished runs', () => {
  const real = { phase: 'build', shift: 2 };
  assert.equal(continuableRun(real), real);
  assert.equal(continuableRun({ phase: 'shop' }).phase, 'shop');
  assert.equal(continuableRun({ phase: 'build', tutorial: true }), null);
  assert.equal(continuableRun({ phase: 'won' }), null);
  assert.equal(continuableRun({ phase: 'lost' }), null);
  assert.equal(continuableRun(null), null);
});

test('fitBoardSize fits the board inside the slot without overflow', () => {
  assert.deepEqual(fitBoardSize(300, 400, 5, 4), { width: 300, height: 240 });
  assert.deepEqual(fitBoardSize(400, 200, 5, 4), { width: 250, height: 200 });
  assert.deepEqual(fitBoardSize(0, 200, 5, 4), { width: 0, height: 0 });
  assert.deepEqual(fitBoardSize(300, -5, 5, 4), { width: 0, height: 0 });
  assert.deepEqual(fitBoardSize(300, 300, 0, 4), { width: 0, height: 0 });
  const fit = fitBoardSize(333, 217, 5, 4);
  assert.ok(fit.width <= 333 && fit.height <= 217);
});

test('validDropCells skips parts and blocked cells', () => {
  const machine = { cols: 3, rows: 2, cells: [{ x: 0, y: 0 }], blocked: [{ x: 2, y: 1 }] };
  const cells = validDropCells(machine);
  assert.equal(cells.length, 4);
  assert.ok(!cells.some((c) => c.x === 0 && c.y === 0));
  assert.ok(!cells.some((c) => c.x === 2 && c.y === 1));
});

test('emptyPanelText follows the game and stays short and plain', () => {
  assert.match(emptyPanelText(2, 0, 0), /place it/);
  assert.match(emptyPanelText(0, 3, 1), /FIRE again/);
  assert.match(emptyPanelText(0, 3, 0), /press FIRE/);
  assert.match(emptyPanelText(0, 0, 0), /shop/);
  assert.match(emptyPanelText(NaN, undefined, null), /shop/);
  [emptyPanelText(2, 0, 0), emptyPanelText(0, 3, 1), emptyPanelText(0, 3, 0), emptyPanelText(0, 0, 0)].forEach((t) => {
    assert.ok(t.split(' ').length <= 12, t);
    assert.doesNotMatch(t, /\b(pass|bank|fizzle|value)\b/i);
  });
});
