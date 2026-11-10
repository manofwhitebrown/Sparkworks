// A tiny test so CI has something to run on the skeleton. Owner: AI-1
import test from 'node:test';
import assert from 'node:assert/strict';

test('smoke: the test runner works', () => {
  assert.equal(1 + 1, 2);
});
