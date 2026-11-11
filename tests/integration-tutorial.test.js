// The tutorial lesson only works if "amplifier AFTER the coil" really beats "BEFORE".
// Uses the REAL simulate. If a stub is still in place the numbers test is skipped.
// Owner: AI-8

import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../src/engine/simulate.js';
import { STEPS } from '../src/tutorial/steps.js';
import { shouldShowTutorial, markTutorialDone, startTutorial } from '../src/tutorial/tutorial.js';
import {
  coilOnlyMachine,
  amplifierBeforeMachine,
  amplifierAfterMachine,
  tutorialRun
} from '../src/tutorial/tutorialRun.js';

test('amplifier AFTER the coil beats amplifier BEFORE it', () => {
  const stubbed = simulate(coilOnlyMachine(), { recordEvents: false }).total === 0;
  if (stubbed) {
    return; // simulate is still AI-2's stub; the test turns on by itself when it lands
  }
  const coilOnly = simulate(coilOnlyMachine(), { recordEvents: false }).total;
  const before = simulate(amplifierBeforeMachine(), { recordEvents: false }).total;
  const after = simulate(amplifierAfterMachine(), { recordEvents: false }).total;
  assert.ok(coilOnly > 0);
  assert.ok(after > before, 'after ' + after + ' must beat before ' + before);
});

test('steps have the right shape and end with a button step', () => {
  assert.equal(STEPS.length, 8);
  for (const step of STEPS) {
    assert.ok(step.id && step.text);
    assert.ok(step.text.length < 140, step.id + ' text is too long');
  }
  assert.equal(STEPS[STEPS.length - 1].waitFor, null);
});

test('tutorial flag helpers', () => {
  assert.equal(shouldShowTutorial({ tutorialDone: false }), true);
  const meta = markTutorialDone({ tutorialDone: false });
  assert.equal(shouldShowTutorial(meta), false);
});

test('tutorialRun gives a fixed run with the lesson parts', () => {
  const run = tutorialRun({ newRun() { return { machine: { cells: [] }, bench: [] }; } });
  assert.equal(run.bench.length, 2);
  assert.equal(run.firesLeft, 3);
  assert.equal(run.offers[0].partId, 'coil');
});

function runTutorial(getLastTotal) {
  const handlers = {};
  let finished = 0;
  let callbacks = null;
  const handle = startTutorial({}, {
    on(name, fn) { handlers[name] = fn; },
    off(name) { delete handlers[name]; },
    finish() { finished = finished + 1; },
    lastTotal: getLastTotal,
    findTarget() { return null; },
    createOverlay(host, cb) { callbacks = cb; return { showStep() {}, destroy() {} }; }
  });
  return { handlers: handlers, callbacks: callbacks, handle: handle, finished() { return finished; } };
}

test('startTutorial walks every step and only accepts a BETTER swap', () => {
  const t = runTutorial(function none() { return null; });
  t.callbacks.onGotIt(); // welcome
  t.handlers['ui:placed']({});
  t.handlers['ui:fireDone']({ total: 12 });
  t.handlers['ui:fireDone']({ total: 15 });
  t.handlers['ui:fireDone']({ total: 10 }); // worse: must NOT advance
  assert.ok(t.handlers['ui:fireDone']);
  t.handlers['ui:fireDone']({ total: 24 }); // better: advances
  assert.ok(t.handlers['ui:shopOpened']);
  t.handlers['ui:shopOpened']({});
  t.callbacks.onGotIt(); // shop
  assert.equal(t.finished(), 0);
  t.callbacks.onGotIt(); // done
  assert.equal(t.finished(), 1);
  t.handle.stop();
});

test('when the event has no total, the saved run is used', () => {
  const totals = [12, 15, 15, 24];
  const t = runTutorial(function next() { return totals.shift(); });
  t.callbacks.onGotIt();
  t.handlers['ui:placed']({});
  t.handlers['ui:fireDone']({ passed: false }); // 12
  t.handlers['ui:fireDone']({ passed: false }); // 15
  t.handlers['ui:fireDone']({ passed: false }); // 15 again: not higher, stays
  assert.ok(t.handlers['ui:fireDone']);
  t.handlers['ui:fireDone']({ passed: true });  // 24: advances
  assert.ok(!t.handlers['ui:fireDone']);
});

test('skip finishes right away', () => {
  const t = runTutorial(function none() { return null; });
  t.callbacks.onSkip();
  assert.equal(t.finished(), 1);
});

test('by default, skipping announces tutorial:finished and never imports ui.js', async () => {
  const { on, off } = await import('../src/core/events.js');
  let heard = 0;
  function listener() { heard = heard + 1; }
  on('tutorial:finished', listener);
  let callbacks = null;
  const handle = startTutorial({}, {
    on() {}, off() {}, findTarget() { return null; },
    createOverlay(host, cb) { callbacks = cb; return { showStep() {}, destroy() {} }; }
  });
  callbacks.onSkip();
  off('tutorial:finished', listener);
  handle.stop();
  assert.equal(heard, 1);
});
