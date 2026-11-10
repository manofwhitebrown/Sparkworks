// Tests for src/core/loop.js. Owner: AI-1
import test from 'node:test';
import assert from 'node:assert/strict';
import { startLoop, stopLoop } from '../src/core/loop.js';

// A fake animation frame clock we can step by hand.
function installFakeFrames() {
  const state = { now: 1000, queue: [], requests: 0 };
  globalThis.performance = { now: () => state.now };
  globalThis.requestAnimationFrame = (fn) => { state.requests++; state.queue.push(fn); return state.requests; };
  globalThis.cancelAnimationFrame = () => { state.queue = []; };
  state.step = (ms) => {
    state.now += ms;
    const fn = state.queue.shift();
    if (fn) fn(state.now);
  };
  return state;
}

test('loop: callback gets dt in seconds', () => {
  const clock = installFakeFrames();
  const seen = [];
  startLoop((dt) => seen.push(dt));
  clock.step(16);
  clock.step(20);
  stopLoop();
  assert.ok(Math.abs(seen[0] - 0.016) < 1e-9);
  assert.ok(Math.abs(seen[1] - 0.02) < 1e-9);
});

test('loop: dt is clamped to 0.1 seconds', () => {
  const clock = installFakeFrames();
  const seen = [];
  startLoop((dt) => seen.push(dt));
  clock.step(5000);
  stopLoop();
  assert.equal(seen[0], 0.1);
});

test('loop: starting twice does not make a second loop', () => {
  const clock = installFakeFrames();
  let calls = 0;
  const cb = () => calls++;
  startLoop(cb);
  startLoop(cb);
  assert.equal(clock.queue.length, 1);
  clock.step(16);
  assert.equal(calls, 1);
  stopLoop();
});

test('loop: stopLoop stops the frames', () => {
  const clock = installFakeFrames();
  let calls = 0;
  startLoop(() => calls++);
  clock.step(16);
  stopLoop();
  clock.step(16);
  assert.equal(calls, 1);
});

test('loop: a throwing callback does not kill the loop', () => {
  const clock = installFakeFrames();
  const originalError = console.error;
  console.error = () => {};
  let calls = 0;
  startLoop(() => { throw new Error('boom'); });
  startLoop(() => calls++);
  clock.step(16);
  clock.step(16);
  console.error = originalError;
  stopLoop();
  assert.equal(calls, 2);
});
