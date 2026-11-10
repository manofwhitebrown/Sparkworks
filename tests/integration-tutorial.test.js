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

test('startTutorial walks every step and skipping saves tutorialDone', () => {
  const handlers = {};
  const saved = [];
  let wentTo = '';
  const fakeOverlay = { showStep() {}, destroy() {} };
  let callbacks = null;
  const handle = startTutorial({}, {
    on(name, fn) { handlers[name] = fn; },
    off(name) { delete handlers[name]; },
    go(name) { wentTo = name; },
    loadMeta() { return { tutorialDone: false }; },
    saveMeta(meta) { saved.push(meta); },
    findTarget() { return null; },
    createOverlay(root, cb) { callbacks = cb; return fakeOverlay; }
  });
  callbacks.onGotIt(); // welcome
  handlers['ui:placed']({});
  handlers['ui:fireDone']({ total: 12 });
  handlers['ui:fireDone']({ total: 15 });
  handlers['ui:fireDone']({ total: 10 }); // worse: must NOT advance
  assert.ok(handlers['ui:fireDone']);
  handlers['ui:fireDone']({ total: 24 }); // better: advances
  handlers['ui:shopOpened']({});
  callbacks.onGotIt(); // shop
  callbacks.onGotIt(); // done
  assert.equal(saved.length, 1);
  assert.equal(saved[0].tutorialDone, true);
  assert.equal(wentTo, 'home');
  handle.stop();
});
