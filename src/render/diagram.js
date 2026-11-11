// Diagram mode: a tiny looping demo of a small board for the How to Play screen and the tutorial.
// It uses the SAME board view (same drawing code) and plays the event list the caller gives it.
// No engine calls here: the caller passes the machine and the events.
// Cheap on purpose: 30 fps, pauses when the tab or the diagram is hidden, one shared loop callback.
// Owner: AI-6
import { createBoardView } from './boardView.js';
import { startLoop } from '../core/loop.js';

var STEP = 1 / 30;
var DEFAULT_PAUSE_MS = 1200;

// One loop callback for ALL diagrams (core/loop has no "remove", so we never add one per diagram).
var active = [];
var registered = false;

function tickAll(dt) {
  for (var i = 0; i < active.length; i++) {
    active[i].tick(dt);
  }
}

function register(loopFn) {
  if (registered) { return; }
  registered = true;
  loopFn(tickAll);
}

// Pure helper (tested): given the time left in the wait between loops, returns the new time left.
export function waitStep(waitLeft, dt) {
  var left = waitLeft - dt;
  return left > 0 ? left : 0;
}

// machineLike: { cols, rows, sourceRow, cells, blocked, bonusCells } (a small board such as 3x2 or 5x3)
// events: an event log as in contract section 7, given by the caller
// options: { speed, pauseMs, quality, reduceMotion, deps }
export function createDiagram(container, machineLike, events, options) {
  var opts = options || {};
  var deps = opts.deps || {};
  var pauseSec = (opts.pauseMs >= 0 ? opts.pauseMs : DEFAULT_PAUSE_MS) / 1000;
  var frameFn = null;
  var view = createBoardView(container, {
    // the view hands us its frame function instead of adding its own loop callback
    deps: { startLoop: function (cb) { frameFn = cb; } },
    onEventPlayed: function () {}
  });
  var canvas = container.querySelector('canvas');
  if (canvas) { canvas.style.pointerEvents = 'none'; }
  view.setQuality(opts.quality || 'medium');

  var state = { destroyed: false, visible: true, playing: false, waitLeft: 0, acc: 0, run: 0 };
  var machine = machineLike;
  var script = events || [];

  function startRound() {
    state.run++;
    var myRun = state.run;
    view.resetEffects();
    view.setMachine(machine);
    state.playing = true;
    view.play(script, { speed: opts.speed || 1, reduceMotion: !!opts.reduceMotion }).then(function () {
      if (state.destroyed || myRun !== state.run) { return; }
      state.playing = false;
      state.waitLeft = pauseSec;
    });
  }

  function tick(dt) {
    if (state.destroyed || !frameFn) { return; }
    if (!state.visible || (typeof document !== 'undefined' && document.hidden)) { return; }
    state.acc += dt;
    if (state.acc < STEP) { return; }
    var step = state.acc;
    state.acc = 0;
    if (!state.playing) {
      state.waitLeft = waitStep(state.waitLeft, step);
      if (state.waitLeft === 0) { startRound(); }
    }
    frameFn(step);
  }

  var entry = { tick: tick };
  active.push(entry);
  register(deps.startLoop || startLoop);

  // Pause when scrolled out of view (cards that are off screen in a swipe list cost nothing).
  var observer = null;
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(function (list) {
      for (var i = 0; i < list.length; i++) { state.visible = list[i].isIntersecting; }
    });
    observer.observe(container);
  }

  startRound();

  return {
    restart: function () { startRound(); },
    // new data (another demo in the same box)
    setData: function (newMachine, newEvents) { machine = newMachine; script = newEvents || []; startRound(); },
    destroy: function () {
      state.destroyed = true;
      var at = active.indexOf(entry);
      if (at >= 0) { active.splice(at, 1); }
      if (observer) { observer.disconnect(); }
      view.destroy();
    }
  };
}

// Test helper: how many diagrams are alive.
export function activeDiagramCount() {
  return active.length;
}
