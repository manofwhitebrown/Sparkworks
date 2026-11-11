// Regression test for audit R5 item 9: the blocked (dead) cell must not leak its red stroke into the
// corner marks of the empty cells drawn after it.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { drawStaticLayer } from '../src/render/boardStatic.js';
import { computeLayout } from '../src/render/layout.js';
import { THEME } from '../src/render/theme.js';

// A tiny recording 2D context that keeps a save/restore stack for strokeStyle and lineWidth.
function recordingCtx() {
  var state = { strokeStyle: '#000', fillStyle: '#000', lineWidth: 1, globalAlpha: 1 };
  var stack = [];
  var strokes = [];
  var ctx = {
    save: function () { stack.push(Object.assign({}, state)); },
    restore: function () { if (stack.length > 0) { state = stack.pop(); } },
    stroke: function () { strokes.push({ color: state.strokeStyle, width: state.lineWidth }); },
    createLinearGradient: function () { return { addColorStop: function () {} }; },
    createRadialGradient: function () { return { addColorStop: function () {} }; },
    measureText: function () { return { width: 10 }; }
  };
  ['strokeStyle', 'fillStyle', 'lineWidth', 'globalAlpha'].forEach(function (k) {
    Object.defineProperty(ctx, k, { get: function () { return state[k]; }, set: function (v) { state[k] = v; } });
  });
  var noop = ['beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'fillRect', 'strokeRect', 'rect', 'arc',
    'arcTo', 'clip', 'clearRect', 'fillText', 'strokeText', 'quadraticCurveTo', 'bezierCurveTo', 'setLineDash',
    'translate', 'scale', 'rotate', 'drawImage', 'ellipse', 'roundRect'];
  noop.forEach(function (n) { ctx[n] = function () {}; });
  return { ctx: ctx, strokes: strokes };
}

test('blocked cell: its red stroke does not leak into the empty cells drawn after it', function () {
  var L = computeLayout(360, 290, 5, 4);
  var machine = { cols: 5, rows: 4, sourceRow: 1, cells: [], blocked: [{ x: 0, y: 0 }], banned: [], bonusCells: [] };
  var rec = recordingCtx();
  drawStaticLayer(rec.ctx, L, machine);
  var red = rec.strokes.filter(function (s) { return s.color === THEME.colors.bad; });
  // The hatch and the crack are the only red strokes (2 calls); the 19 empty cells draw their corners in another color.
  assert.ok(red.length >= 1 && red.length <= 3, 'red strokes: ' + red.length);
});

import { trailSegmentsFor } from '../src/render/sparkDraw.js';

test('trailSegmentsFor: full trail for a few sparks, shorter when many sparks are alive, never negative', () => {
  assert.equal(trailSegmentsFor(8, 3), 8);
  assert.equal(trailSegmentsFor(8, 7), 4);
  assert.equal(trailSegmentsFor(8, 20), 3);
  assert.equal(trailSegmentsFor(2, 20), 2);
  assert.equal(trailSegmentsFor(NaN, 5), 0);
  assert.equal(trailSegmentsFor(-4, 30), 0);
});
