// Runs the guided tutorial: shows the overlay and moves through STEPS as the player does each
// action for real (ui:* events from core/events.js). ui.js starts the guided run itself
// (it saves tutorialRun() and opens the run screen), so this file only guides.
// Owner: AI-8

import { on as realOn, off as realOff, emit as realEmit } from '../core/events.js';
import { loadRun as realLoadRun } from '../core/save.js';
import { STEPS } from './steps.js';
import { createOverlay } from './overlay.js';
import { tutorialRun, isContinuableRun } from './tutorialRun.js';

export { tutorialRun, isContinuableRun };

// How often and how many times to look for a target that its screen has not drawn yet.
const FIND_RETRY_MS = 120;
const FIND_RETRY_MAX = 25;

export function shouldShowTutorial(meta) {
  return !!meta && meta.tutorialDone === false;
}

export function markTutorialDone(meta) {
  meta.tutorialDone = true;
  return meta;
}

// The tutorial never imports ui.js (that made a circular import and a build warning).
// It only announces that it is over. ui.js owns the live meta, so it listens for this event,
// marks the tutorial done, saves the meta and goes home. Owner of that listener: AI-7.
function realFinish() {
  realEmit('tutorial:finished', {});
}

// The total of the Fire that just ended, read from the saved run when the event has none.
function realLastTotal() {
  const run = realLoadRun();
  if (run && run.lastFire && typeof run.lastFire.total === 'number') {
    return run.lastFire.total;
  }
  return null;
}

// deps (for tests): { on, off, finish, lastTotal, createOverlay, findTarget }
export function startTutorial(root, deps) {
  const d = deps || {};
  const on = d.on || realOn;
  const off = d.off || realOff;
  const finishApp = d.finish || realFinish;
  const lastTotalOf = d.lastTotal || realLastTotal;
  const makeOverlay = d.createOverlay || createOverlay;
  const findTarget = d.findTarget || function find(name) {
    return name ? document.querySelector('[data-tut="' + name + '"]') : null;
  };
  const host = d.host || (typeof document !== 'undefined' ? document.body : root);

  let index = 0;
  let stopped = false;
  let listening = null; // { name, handler } for the event we wait for
  let retryTimer = null;
  let lastTotal = -1;

  const overlay = makeOverlay(host, { onGotIt: next, onSkip: finish });

  function stopListening() {
    if (listening) {
      off(listening.name, listening.handler);
      listening = null;
    }
  }

  // The screen may not have drawn the target yet: keep looking for a short while.
  function placeSpotlight(step, tries) {
    if (stopped || STEPS[index] !== step) {
      return;
    }
    const target = findTarget(step.target);
    overlay.showStep(step.text, target, !step.waitFor);
    if (!target && step.target && tries < FIND_RETRY_MAX) {
      retryTimer = setTimeout(function again() {
        placeSpotlight(step, tries + 1);
      }, FIND_RETRY_MS);
    }
  }

  function show() {
    if (stopped) {
      return;
    }
    const step = STEPS[index];
    stopListening();
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    placeSpotlight(step, 0);
    if (step.waitFor) {
      const handler = function onEvent(data) {
        handleEvent(step, data);
      };
      listening = { name: step.waitFor, handler: handler };
      on(step.waitFor, handler);
    }
  }

  function handleEvent(step, data) {
    if (step.waitFor === 'ui:fireDone') {
      let total = data && typeof data.total === 'number' ? data.total : lastTotalOf();
      if (typeof total !== 'number') {
        total = null;
      }
      // "Order matters": only move on when the swap really gave the bigger number.
      if (step.needsHigher && total !== null && total <= lastTotal) {
        return;
      }
      if (total !== null) {
        lastTotal = total;
      }
    }
    next();
  }

  function next() {
    index = index + 1;
    if (index >= STEPS.length) {
      finish();
      return;
    }
    show();
  }

  // Both "Skip tutorial" and finishing the last step end up here.
  function finish() {
    if (stopped) {
      return;
    }
    stop();
    finishApp();
  }

  function stop() {
    stopped = true;
    stopListening();
    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    overlay.destroy();
  }

  show();
  return { stop: stop };
}
