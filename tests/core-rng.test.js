// Tests for src/core/rng.js. Owner: AI-1
import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, hashString } from '../src/core/rng.js';

function take(seed, count) {
  const rng = makeRng(seed);
  const out = [];
  for (let i = 0; i < count; i++) out.push(rng());
  return out;
}

test('rng: same seed gives the same first 20 numbers', () => {
  assert.deepEqual(take(12345, 20), take(12345, 20));
});

test('rng: different seeds differ', () => {
  assert.notDeepEqual(take(1, 20), take(2, 20));
});

test('rng: all numbers are in [0, 1)', () => {
  const numbers = take(987, 5000);
  for (let i = 0; i < numbers.length; i++) {
    assert.ok(numbers[i] >= 0 && numbers[i] < 1);
  }
});

test('rng: known first value stays the same on every device', () => {
  // If this ever changes, every saved run and every daily contract would change too.
  assert.equal(makeRng(1)(), 0.6270739405881613);
});

test('hashString: stable, 32-bit, and different for different text', () => {
  assert.equal(hashString('a'), hashString('a'));
  assert.notEqual(hashString('a'), hashString('b'));
  const h = hashString('2026-11-10');
  assert.ok(Number.isInteger(h) && h >= 0 && h < 4294967296);
});
