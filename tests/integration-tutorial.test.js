// The tutorial lesson only works if "amplifier AFTER the coil" really beats "BEFORE".
// Uses the REAL simulate. If a stub is still in place the numbers test is skipped.
// Owner: AI-8

import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../src/engine/simulate.js';
import { getTarget } from '../src/run/runState.js';
import { makeMachine, placePart } from '../src/engine/board.js';
import { STEPS } from '../src/tutorial/steps.js';
import { shouldShowTutorial, markTutorialDone, startTutorial } from '../src/tutorial/tutorial.js';
import {
  coilOnlyMachine,
  amplifierBeforeMachine,
  amplifierAfterMachine,
  detourMachine,
  giveSteeringParts,
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
  assert.equal(STEPS.length, 11);
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
  assert.equal(run.firesLeft, 10);
  assert.equal(run.offers[0].partId, 'coil');
});

function runTutorial(getLastTotal, give) {
  const handlers = {};
  let finished = 0;
  let callbacks = null;
  const texts = [];
  const handle = startTutorial({}, {
    giveSteeringParts: give || function none() {},
    on(name, fn) { handlers[name] = fn; },
    off(name) { delete handlers[name]; },
    finish() { finished = finished + 1; },
    lastTotal: getLastTotal,
    findTarget() { return null; },
    createOverlay(host, cb) { callbacks = cb; return { showStep(text) { texts.push(text); }, destroy() {} }; }
  });
  return { shown() { return texts; }, handlers: handlers, callbacks: callbacks, handle: handle, finished() { return finished; } };
}

// Walks a tutorial from the first step to `stopAtId`, feeding each step what it waits for.
function walkTo(t, stopAtId, totals) {
  let fireIndex = 0;
  for (let i = 0; i < STEPS.length && STEPS[i].id !== stopAtId; i++) {
    const wait = STEPS[i].waitFor;
    if (!wait) {
      t.callbacks.onGotIt();
    } else if (wait === 'ui:fireDone') {
      t.handlers[wait]({ total: totals[fireIndex] });
      fireIndex = fireIndex + 1;
    } else {
      t.handlers[wait]({});
    }
  }
}

test('startTutorial walks every step and only accepts a BETTER swap', () => {
  const t = runTutorial(function none() { return null; });
  walkTo(t, 'orderMatters', [12, 15]);
  t.handlers['ui:fireDone']({ total: 10 }); // worse: must NOT advance
  assert.ok(t.handlers['ui:fireDone']);
  t.handlers['ui:fireDone']({ total: 24 }); // better: advances to the steering lesson
  assert.equal(t.finished(), 0);
  t.callbacks.onGotIt(); // steerIntro
  t.handlers['ui:fireDone']({ total: 12 }); // detour works
  t.callbacks.onGotIt(); // detourSeen
  t.handlers['ui:shopOpened']({});
  t.callbacks.onGotIt(); // shop
  assert.equal(t.finished(), 0);
  t.callbacks.onGotIt(); // done
  assert.equal(t.finished(), 1);
  t.handle.stop();
});

test('a detour Fire of 0 shows the "lost" text and stays on the step', () => {
  const t = runTutorial(function none() { return null; });
  walkTo(t, 'detour', [12, 15, 24]);
  t.handlers['ui:fireDone']({ total: 0 });
  assert.ok(t.handlers['ui:fireDone'], 'still waiting for a working detour');
  assert.ok(t.shown().some(function lost(text) { return text.indexOf('Lost off the bottom') === 0; }));
  t.handlers['ui:fireDone']({ total: 12 });
  assert.ok(!t.handlers['ui:fireDone'], 'moved on after a working detour');
});

test('entering the steering step swaps the bench once', () => {
  let given = 0;
  const t = runTutorial(function none() { return null; }, function give() { given = given + 1; });
  walkTo(t, 'orderMatters', [12, 15]);
  assert.equal(given, 0);
  t.handlers['ui:fireDone']({ total: 24 });
  assert.equal(given, 1);
});

test('when the event has no total, the saved run is used', () => {
  const totals = [12, 15, 15, 24];
  const t = runTutorial(function next() { return totals.shift(); });
  walkTo(t, 'orderMatters', [null, null]);
  assert.ok(t.handlers['ui:fireDone']);
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

test('the detour machine reaches the vault for 12; without the second Bend all sparks are lost', () => {
  const ok = simulate(detourMachine(), { recordEvents: false });
  assert.equal(ok.total, 12);
  assert.equal(ok.banked, 3);
  const broken = makeMachine({ seed: 777 });
  placePart(broken, 1, 1, 'bend', 1, 1);
  placePart(broken, 1, 2, 'coil', 1, 0);
  const lost = simulate(broken, { recordEvents: false });
  assert.equal(lost.total, 0);
  assert.equal(lost.fizzled, 3);
});

test('the lesson Fires add up below the target, so the shop opens only after the detour lesson', () => {
  const run = tutorialRun();
  const target = getTarget(run);
  const coil = simulate(coilOnlyMachine(), { recordEvents: false }).total;
  const before = simulate(amplifierBeforeMachine(), { recordEvents: false }).total;
  const after = simulate(amplifierAfterMachine(), { recordEvents: false }).total;
  const detour = simulate(detourMachine(), { recordEvents: false }).total;
  assert.ok(coil + before < target);
  assert.ok(coil + before + after < target);
  assert.ok(coil + before + after + detour < target);
  // Two more detour Fires clear it, and the run has Fires to spare.
  assert.ok(coil + before + after + detour * 3 >= target);
  assert.ok(run.firesLeft >= 8);
});

test('giveSteeringParts swaps the bench, clears the board and tells the run screen', () => {
  const run = { bench: [{ partId: 'coil', level: 1 }], machine: { cells: [{ x: 1, y: 1 }] } };
  const heard = [];
  assert.equal(giveSteeringParts({ run: run, emit(name) { heard.push(name); } }), true);
  assert.deepEqual(run.bench.map(function id(b) { return b.partId; }), ['bend', 'bend', 'coil']);
  assert.equal(run.machine.cells.length, 0);
  assert.deepEqual(heard, ['cheat:changed']);
  assert.equal(giveSteeringParts({ run: null, emit() {} }), false);
});
