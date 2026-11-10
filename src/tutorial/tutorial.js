// Runs the guided tutorial: starts the tutorial run, shows the overlay, and moves through
// STEPS as the player does each action for real (ui:* events from core/events.js).
// Owner: AI-8

import { on as realOn, off as realOff } from '../core/events.js';
import { loadMeta as realLoadMeta, saveMeta as realSaveMeta } from '../core/save.js';
import { go as realGo } from '../ui/ui.js';
import { STEPS } from './steps.js';
import { createOverlay } from './overlay.js';
import { tutorialRun } from './tutorialRun.js';

export { tutorialRun };

export function shouldShowTutorial(meta) {
  return !!meta && meta.tutorialDone === false;
}

export function markTutorialDone(meta) {
  meta.tutorialDone = true;
  return meta;
}

// deps (for tests): { on, off, go, loadMeta, saveMeta, createOverlay, findTarget }
export function startTutorial(root, deps) {
  const d = deps || {};
  const on = d.on || realOn;
  const off = d.off || realOff;
  const go = d.go || realGo;
  const loadMeta = d.loadMeta || realLoadMeta;
  const saveMeta = d.saveMeta || realSaveMeta;
  const makeOverlay = d.createOverlay || createOverlay;
  const findTarget = d.findTarget || function find(name) {
    return name ? document.querySelector('[data-tut="' + name + '"]') : null;
  };

  let index = 0;
  let stopped = false;
  let listening = null; // { name, handler } for the event we wait for
  let lastTotal = -1;

  const overlay = makeOverlay(root, { onGotIt: next, onSkip: finish });

  function stopListening() {
    if (listening) {
      off(listening.name, listening.handler);
      listening = null;
    }
  }

  function show() {
    if (stopped) {
      return;
    }
    const step = STEPS[index];
    stopListening();
    overlay.showStep(step.text, findTarget(step.target), !step.waitFor);
    if (step.waitFor) {
      const handler = function onEvent(data) {
        handleEvent(step, data);
      };
      listening = { name: step.waitFor, handler: handler };
      on(step.waitFor, handler);
    }
  }

  function handleEvent(step, data) {
    if (step.waitFor === 'ui:fireDone' && data && typeof data.total === 'number') {
      const better = data.total > lastTotal;
      // Remember the best number so far: the swap must beat the Fire before it.
      if (step.needsHigher && !better) {
        return;
      }
      lastTotal = data.total;
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
    const meta = loadMeta();
    markTutorialDone(meta);
    saveMeta(meta);
    stop();
    go('home');
  }

  function stop() {
    stopped = true;
    stopListening();
    overlay.destroy();
  }

  go('run', { run: tutorialRun(), tutorial: true });
  show();
  return { stop: stop };
}
