// Input logic with a fake canvas: tap, drag, and skip-while-playing.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { attachInput } from '../src/render/input.js';

function fakeCanvas() {
  var listeners = {};
  return {
    style: {},
    addEventListener: function (n, f) { listeners[n] = f; },
    removeEventListener: function (n) { delete listeners[n]; },
    getBoundingClientRect: function () { return { left: 0, top: 0 }; },
    fire: function (n, e) { listeners[n](e); }
  };
}

function setup(playing) {
  var calls = [];
  var canvas = fakeCanvas();
  attachInput(canvas, {
    cellAt: function (x, y) { return { x: Math.floor(x / 50), y: Math.floor(y / 50) }; },
    hasPart: function () { return true; },
    isPlaying: function () { return playing; },
    onSkip: function () { calls.push('skip'); },
    onTap: function (x, y) { calls.push('tap ' + x + ',' + y); },
    onDrag: function (a, b, c, d) { calls.push('drag ' + a + ',' + b + '>' + c + ',' + d); },
    onDragMove: function (info) { calls.push(info ? 'move' : 'moveEnd'); }
  });
  return { canvas: canvas, calls: calls };
}

test('tap calls onTap, canvas gets touch-action none', function () {
  var t = setup(false);
  assert.equal(t.canvas.style.touchAction, 'none');
  t.canvas.fire('pointerdown', { pointerId: 1, clientX: 60, clientY: 60 });
  t.canvas.fire('pointerup', { pointerId: 1, clientX: 61, clientY: 61 });
  assert.deepEqual(t.calls, ['tap 1,1']);
});

test('press-hold-drag calls onCellDrag on release', function () {
  var t = setup(false);
  t.canvas.fire('pointerdown', { pointerId: 1, clientX: 10, clientY: 10 });
  t.canvas.fire('pointermove', { pointerId: 1, clientX: 120, clientY: 10 });
  t.canvas.fire('pointerup', { pointerId: 1, clientX: 120, clientY: 10 });
  assert.deepEqual(t.calls, ['move', 'moveEnd', 'drag 0,0>2,0']);
});

test('tapping while playing skips and does not tap', function () {
  var t = setup(true);
  t.canvas.fire('pointerdown', { pointerId: 1, clientX: 60, clientY: 60 });
  t.canvas.fire('pointerup', { pointerId: 1, clientX: 60, clientY: 60 });
  assert.deepEqual(t.calls, ['skip']);
});
