// The Home demo machine really plays: three sparks, all reach the vault, same events every time.
// Owner: AI-1 (covering AI-7)
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeDemoMachine, demoEvents, shouldLoop } from '../src/ui/homeDemo.js';
import { validateMachine } from '../src/engine/board.js';
import { simulate } from '../src/engine/simulate.js';

test('the demo machine is a valid machine', () => {
  assert.deepEqual(validateMachine(makeDemoMachine()), []);
});

test('the demo Fire sends 3 sparks to the vault and scores something', () => {
  const result = simulate(makeDemoMachine());
  assert.equal(result.banked, 3);
  assert.equal(result.fizzled, 0);
  assert.ok(result.total > 3);
});

test('the demo events are the same every time and end with an end event', () => {
  const a = demoEvents();
  const b = demoEvents();
  assert.deepEqual(a, b);
  assert.equal(a[a.length - 1].type, 'end');
});

test('the loop is off with reduce motion and on the low tier', () => {
  assert.equal(shouldLoop({ reduceMotion: true }), false);
  assert.equal(shouldLoop({ quality: 'low' }), false);
  assert.equal(shouldLoop({ quality: 'auto' }), true);
  assert.equal(shouldLoop(undefined), true);
});
