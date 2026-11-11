// Tests for src/ui/howtoDiagrams.js: real boards, real event logs. Owner: AI-7
import test from 'node:test';
import assert from 'node:assert/strict';
import { diagramsFor } from '../src/ui/howtoDiagrams.js';

test('cards 0 to 4 have diagrams, card 5 has none', () => {
  for (let i = 0; i < 5; i++) assert.ok(diagramsFor(i).length >= 1, 'card ' + i);
  assert.equal(diagramsFor(5).length, 0);
});

test('the Order card shows two boards with different totals', () => {
  const two = diagramsFor(2);
  assert.equal(two.length, 2);
  const totals = two.map(function (d) {
    const end = d.events[d.events.length - 1];
    return end.total;
  });
  assert.notEqual(totals[0], totals[1]);
});

test('every diagram has events and uses a board no bigger than 5x3', () => {
  for (let i = 0; i < 5; i++) {
    diagramsFor(i).forEach(function (d) {
      assert.ok(d.events.length > 0);
      assert.ok(d.machine.cols <= 5 && d.machine.rows <= 3);
    });
  }
});

test('the steering card lets the spark reach the vault, the edge card loses it', () => {
  const steer = diagramsFor(3)[0].events;
  assert.ok(steer.some(function (e) { return e.type === 'bank'; }));
  const edge = diagramsFor(4)[0].events;
  assert.ok(edge.some(function (e) { return e.type === 'fizzle' && e.reason === 'edge'; }));
});
