// Tests for building a timeline from a hand-written event list.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline } from '../src/render/timeline.js';

function sampleEvents() {
  return [
    { n: 0, type: 'spawn', spark: 1, x: 0, y: 1, dir: 'right', value: 1, parent: 0 },
    { n: 1, type: 'enter', spark: 1, x: 0, y: 1, dir: 'right', value: 1 },
    { n: 2, type: 'value', spark: 1, x: 0, y: 1, partId: 'coil', before: 1, after: 4, label: '+3' },
    { n: 3, type: 'enter', spark: 1, x: 1, y: 1, dir: 'right', value: 4 },
    { n: 4, type: 'bank', spark: 1, value: 4, runningTotal: 4 },
    { n: 5, type: 'spawn', spark: 2, x: 0, y: 1, dir: 'right', value: 1, parent: 0 },
    { n: 6, type: 'enter', spark: 2, x: 0, y: 1, dir: 'right', value: 1 },
    { n: 7, type: 'fizzle', spark: 2, x: 0, y: 1, value: 1, reason: 'edge' },
    { n: 8, type: 'end', spark: 0, total: 4, coins: 0 }
  ];
}

test('one step per event, in order', function () {
  var events = sampleEvents();
  var tl = buildTimeline(events, { speed: 1 });
  assert.equal(tl.steps.length, events.length);
  for (var i = 0; i < tl.steps.length; i++) {
    assert.equal(tl.steps[i].index, i);
    assert.equal(tl.steps[i].type, events[i].type);
  }
});

test('report times never go backwards', function () {
  var tl = buildTimeline(sampleEvents(), { speed: 1 });
  for (var i = 1; i < tl.steps.length; i++) {
    assert.ok(tl.steps[i].reportAt >= tl.steps[i - 1].reportAt);
  }
});

test('total duration is positive and shrinks with speed and reduceMotion', function () {
  var normal = buildTimeline(sampleEvents(), { speed: 1 });
  var fast = buildTimeline(sampleEvents(), { speed: 2 });
  var reduced = buildTimeline(sampleEvents(), { speed: 1, reduceMotion: true });
  assert.ok(normal.totalMs > 0);
  assert.ok(fast.totalMs < normal.totalMs);
  assert.ok(reduced.totalMs < normal.totalMs);
});

test('later sparks move faster than the first', function () {
  var tl = buildTimeline(sampleEvents(), { speed: 1 });
  assert.ok(tl.steps[6].moveMs < tl.steps[1].moveMs);
});

test('empty list gives an empty timeline', function () {
  var tl = buildTimeline([], {});
  assert.equal(tl.steps.length, 0);
  assert.equal(tl.totalMs, 0);
});
