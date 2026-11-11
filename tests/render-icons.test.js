// Every required part id has a shape, and drawing never throws (fake ctx).
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { SHAPES } from '../src/render/iconShapes.js';
import { drawPartIcon, getPartIconUrl } from '../src/render/partIcons.js';

var REQUIRED = ['coil', 'dynamo', 'ember', 'amplifier', 'compounder', 'overdrive', 'bend', 'switch',
  'reverser', 'splitter', 'triplet', 'capacitor', 'counter', 'anvil', 'flywheel', 'battery',
  'gambler', 'fuse', 'rectifier', 'tollgate', 'spring', 'sideamp', 'bouncer', 'workbench', 'jackpot',
  'finisher', 'starter', 'portal'];

// A plain fake context: every drawing method is a do-nothing function.
function fakeCtx() {
  var names = ['save', 'restore', 'beginPath', 'moveTo', 'lineTo', 'arc', 'arcTo', 'quadraticCurveTo',
    'closePath', 'stroke', 'fill', 'strokeRect', 'fillRect', 'fillText'];
  var ctx = {};
  for (var i = 0; i < names.length; i++) {
    ctx[names[i]] = function () {};
  }
  return ctx;
}

test('all required ids have a shape', function () {
  for (var i = 0; i < REQUIRED.length; i++) {
    assert.equal(typeof SHAPES[REQUIRED[i]], 'function', REQUIRED[i]);
  }
});

test('drawing known and unknown ids does not throw', function () {
  var ctx = fakeCtx();
  for (var i = 0; i < REQUIRED.length; i++) {
    drawPartIcon(ctx, REQUIRED[i], 0, 0, 32, '#fff');
  }
  drawPartIcon(ctx, 'brandNewPart', 0, 0, 32, '#fff');
  drawPartIcon(ctx, undefined, 0, 0, 32);
});

test('getPartIconUrl is safe without a document', function () {
  assert.equal(getPartIconUrl('coil', 32, '#fff'), '');
});
