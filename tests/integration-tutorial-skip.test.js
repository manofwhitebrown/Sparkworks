// Skipping or finishing the tutorial must announce tutorial:finished (both paths) and must not
// leave a tutorial run that Home would offer as "Continue run". Uses the real save, events and run.
// Owner: AI-8

import test from 'node:test';
import assert from 'node:assert/strict';

// A tiny in-memory localStorage, installed before the save module is used.
const memory = {};
globalThis.localStorage = {
  getItem(k) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; },
  setItem(k, v) { memory[k] = String(v); },
  removeItem(k) { delete memory[k]; }
};

const { startTutorial, tutorialRun, isContinuableRun } = await import('../src/tutorial/tutorial.js');
const { STEPS } = await import('../src/tutorial/steps.js');
const { loadRun, saveRun, clearRun } = await import('../src/core/save.js');
const { on, off } = await import('../src/core/events.js');

function begin() {
  clearRun();
  saveRun(tutorialRun());
  const handlers = {};
  let callbacks = null;
  let finished = 0;
  function listener() { finished = finished + 1; }
  on('tutorial:finished', listener);
  const handle = startTutorial({}, {
    on(name, fn) { handlers[name] = fn; },
    off(name) { delete handlers[name]; },
    findTarget() { return null; },
    lastTotal() { return null; },
    createOverlay(host, cb) { callbacks = cb; return { showStep() {}, destroy() {} }; }
  });
  return {
    handlers: handlers,
    callbacks: callbacks,
    handle: handle,
    finished() { return finished; },
    close() { off('tutorial:finished', listener); handle.stop(); }
  };
}

test('the saved tutorial run is a tutorial run and is not continuable', () => {
  const t = begin();
  const saved = loadRun();
  assert.ok(saved);
  assert.equal(saved.tutorial, true);
  assert.equal(isContinuableRun(saved), false);
  t.close();
});

test('skip emits tutorial:finished once and leaves nothing to continue', () => {
  const t = begin();
  t.callbacks.onSkip();
  assert.equal(t.finished(), 1);
  assert.equal(isContinuableRun(loadRun()), false);
  t.close();
});

test('finishing the last step emits tutorial:finished once', () => {
  const t = begin();
  // Walk the steps: each one is "Got it" or waits for its ui event.
  for (let i = 0; i < STEPS.length; i++) {
    const wait = STEPS[i].waitFor;
    if (!wait) {
      t.callbacks.onGotIt();
    } else if (wait === 'ui:fireDone') {
      t.handlers[wait]({ total: 10 + i * 10 });
    } else {
      t.handlers[wait]({});
    }
  }
  assert.equal(t.finished(), 1);
  assert.equal(isContinuableRun(loadRun()), false);
  t.close();
});

test('isContinuableRun accepts a normal build or shop run only', () => {
  assert.equal(isContinuableRun(null), false);
  assert.equal(isContinuableRun({ phase: 'build' }), true);
  assert.equal(isContinuableRun({ phase: 'shop' }), true);
  assert.equal(isContinuableRun({ phase: 'won' }), false);
  assert.equal(isContinuableRun({ phase: 'lost' }), false);
  assert.equal(isContinuableRun({ phase: 'build', tutorial: true }), false);
});
