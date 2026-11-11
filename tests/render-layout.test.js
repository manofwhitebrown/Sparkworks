// Tests for layout math and cell hit testing.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { computeLayout, cellCenter, cellAtLocal, clampDpr, FOOTER, VPAD } from '../src/render/layout.js';

test('cells are square and fit the container', function () {
  var sizes = [[360, 300], [480, 400], [200, 600], [1000, 200]];
  for (var i = 0; i < sizes.length; i++) {
    var l = computeLayout(sizes[i][0], sizes[i][1], 5, 4);
    assert.ok(l.cell >= 1);
    assert.ok(l.gridW + l.cell <= sizes[i][0] + 1);
    assert.ok(l.gridH <= sizes[i][1]);
    assert.equal(l.gridW, l.cell * 5);
  }
});

test('works for bigger boards', function () {
  var l = computeLayout(360, 300, 8, 6);
  assert.equal(l.cols, 8);
  assert.ok(l.cell * 6 <= 300);
});

test('half cell is left for source and vault', function () {
  var l = computeLayout(360, 300, 5, 4);
  assert.ok(l.gridX >= Math.floor(l.cell / 2) - 1);
  assert.ok(l.gridX + l.gridW + Math.floor(l.cell / 2) <= 360 + 1);
});

test('cellAtLocal finds cells and rejects outside', function () {
  var l = computeLayout(360, 300, 5, 4);
  var c = cellCenter(l, 2, 3);
  var hit = cellAtLocal(l, c.px, c.py);
  assert.deepEqual(hit, { x: 2, y: 3 });
  assert.equal(cellAtLocal(l, 0, 0), null);
  assert.equal(cellAtLocal(l, l.gridX + l.gridW + 5, l.gridY + 5), null);
  assert.equal(cellAtLocal(l, l.gridX - 1, l.gridY + 5), null);
});

test('dpr is capped at 2 and sane for bad input', function () {
  assert.equal(clampDpr(3, 2), 2);
  assert.equal(clampDpr(1.5, 2), 1.5);
  assert.equal(clampDpr(NaN, 2), 1);
  assert.equal(clampDpr(0, 2), 1);
});

test('round 3: grid and footer sit inside the panel with breathing room at many box sizes', function () {
  var sizes = [[284, 211], [328, 243], [400, 300], [150, 112], [412, 330], [900, 700]];
  for (var i = 0; i < sizes.length; i++) {
    var w = sizes[i][0];
    var h = Math.round(w * (4 + FOOTER + VPAD) / 6);
    var l = computeLayout(w, h, 5, 4);
    assert.ok(l.gridY >= 1, 'top margin for ' + w);
    assert.ok(l.gridY + l.gridH + l.cell * FOOTER <= h, 'footer fits for ' + w);
    assert.ok(l.gridX - l.cell / 2 >= -1, 'source margin for ' + w);
    assert.ok(l.gridX + l.gridW + l.cell / 2 <= w + 1, 'vault margin for ' + w);
    assert.ok(l.cell >= 20, 'cell stays usable for ' + w);
  }
});
