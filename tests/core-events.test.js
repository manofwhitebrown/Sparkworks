// Tests for src/core/events.js. Owner: AI-1
import test from 'node:test';
import assert from 'node:assert/strict';
import { on, off, emit } from '../src/core/events.js';

test('events: on and emit deliver the data', () => {
  const seen = [];
  const fn = (data) => seen.push(data);
  on('t:basic', fn);
  emit('t:basic', { n: 1 });
  emit('t:basic', { n: 2 });
  assert.deepEqual(seen, [{ n: 1 }, { n: 2 }]);
  off('t:basic', fn);
});

test('events: off stops delivery', () => {
  let count = 0;
  const fn = () => count++;
  on('t:off', fn);
  emit('t:off');
  off('t:off', fn);
  emit('t:off');
  assert.equal(count, 1);
});

test('events: emitting with no listeners is fine', () => {
  emit('t:nobody', 5);
  off('t:nobody', () => {});
});

test('events: a throwing listener does not stop the others', () => {
  const originalError = console.error;
  console.error = () => {};
  let reached = false;
  on('t:throw', () => { throw new Error('boom'); });
  on('t:throw', () => { reached = true; });
  emit('t:throw');
  console.error = originalError;
  assert.equal(reached, true);
});

test('events: a listener may remove itself while emitting', () => {
  let a = 0;
  let b = 0;
  const first = () => { a++; off('t:self', first); };
  on('t:self', first);
  on('t:self', () => b++);
  emit('t:self');
  emit('t:self');
  assert.equal(a, 1);
  assert.equal(b, 2);
});
