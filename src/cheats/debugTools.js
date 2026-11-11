// Debug helpers: preview a Fire without using one, turn an event log into text, find the
// event log of the Fire that was just played, speed / quality / fps / error-bar helpers.
// The DOM parts (fps box) are guarded, the rest is plain logic that tests can run.
// Owner: AI-2

import { simulate as realSimulate } from '../engine/simulate.js';
import { cloneMachine } from '../engine/board.js';
import { EVT } from '../engine/eventTypes.js';
import { nextMachineSeed } from '../run/runRng.js';

export const SPEEDS = [0.25, 1, 2, 4, 'instant'];
export const QUALITIES = ['auto', 'low', 'medium', 'high'];
const MAX_LOG_LINES = 1500;

// ---------- Fire preview ----------

// What each spark ended up worth: its banked value, or 0 for a fizzle.
function sparkWorths(events) {
  const worths = [];
  for (let i = 0; i < events.length; i++) {
    if (events[i].type === EVT.BANK) {
      worths.push(events[i].value);
    } else if (events[i].type === EVT.FIZZLE) {
      worths.push(0);
    }
  }
  return worths;
}

export function summarizeResult(result) {
  const worths = sparkWorths(result.events);
  let best = 0;
  let worst = worths.length > 0 ? worths[0] : 0;
  for (let i = 0; i < worths.length; i++) {
    best = Math.max(best, worths[i]);
    worst = Math.min(worst, worths[i]);
  }
  return {
    total: result.total, banked: result.banked, fizzled: result.fizzled,
    coins: result.coins, errors: result.errors || 0, best: best, worst: worst
  };
}

// Runs the machine on a COPY. The run is not changed, except that it is marked as cheated.
// The real Fire uses a new seed, so parts that use random numbers can differ a little.
export function previewFire(run, deps) {
  const sim = deps && deps.simulate ? deps.simulate : realSimulate;
  const result = sim(cloneMachine(run.machine));
  run.cheated = true;
  return { ok: true, msg: 'Preview done (no Fire used)', data: summarizeResult(result) };
}

export function summaryText(s) {
  return 'total ' + s.total + ', banked ' + s.banked + ', fizzled ' + s.fizzled +
    ', coins ' + s.coins + '\nbest spark ' + s.best + ', worst spark ' + s.worst +
    (s.errors > 0 ? '\nparts that threw: ' + s.errors : '');
}

// ---------- event log as text ----------

export function eventText(e) {
  const head = '#' + e.n + ' s' + e.spark + ' ' + e.type;
  switch (e.type) {
    case EVT.SPAWN: return head + ' at ' + e.x + ',' + e.y + ' ' + e.dir + ' v=' + e.value + ' parent ' + e.parent;
    case EVT.ENTER: return head + ' ' + e.x + ',' + e.y + ' ' + e.dir + ' v=' + e.value;
    case EVT.VALUE: return head + ' ' + e.partId + ' ' + e.before + ' -> ' + e.after + ' ' + e.label;
    case EVT.TURN: return head + ' ' + e.partId + ' ' + e.from + ' -> ' + e.to;
    case EVT.SPLIT: return head + ' ' + e.partId + ' child s' + e.child + ' ' + e.dir + ' v=' + e.value;
    case EVT.STATE: return head + ' ' + e.partId + ' ' + e.label;
    case EVT.COINS: return head + ' ' + e.partId + ' +' + e.amount;
    case EVT.DISABLE: return head + ' ' + e.partId;
    case EVT.BLOCKED: return head + ' ' + e.x + ',' + e.y;
    case EVT.BANK: return head + ' v=' + e.value + ' total ' + e.runningTotal;
    case EVT.FIZZLE: return head + ' ' + e.x + ',' + e.y + ' v=' + e.value + ' ' + e.reason;
    case EVT.END: return head + ' total ' + e.total + ' coins ' + e.coins;
    default: return head;
  }
}

export function eventsText(events) {
  const lines = [];
  const count = Math.min(events.length, MAX_LOG_LINES);
  for (let i = 0; i < count; i++) {
    lines.push(eventText(events[i]));
  }
  if (events.length > count) {
    lines.push('... ' + (events.length - count) + ' more events not shown');
  }
  return lines.join('\n');
}

// ---------- the Fire that was just played ----------

// The run screen does not send the events, so we rebuild them. fire() made its machine seed
// from the run's rng counter just before the shop (if any) used it again. We try the last few
// counter values and keep the one whose total matches run.lastFire.total.
export function reconstructFire(run, deps) {
  const sim = deps && deps.simulate ? deps.simulate : realSimulate;
  if (!run || !run.lastFire || typeof run.rngState !== 'number') {
    return null;
  }
  for (let back = 1; back <= 4; back++) {
    if (run.rngState - back < 0) {
      break;
    }
    const machine = cloneMachine(run.machine);
    machine.seed = nextMachineSeed({ seed: run.seed, rngState: run.rngState - back });
    const result = sim(machine);
    if (result.total === run.lastFire.total) {
      return result;
    }
  }
  return null;
}

// Listens for ui:fired and keeps the log of the latest Fire. deps: { on, getRun, simulate }.
// If the run screen one day sends { events } with the event, that is used as it is.
export function makeFireRecorder(deps) {
  let last = null;
  deps.on('ui:fired', function (data) {
    if (data && Array.isArray(data.events)) {
      last = { events: data.events, how: 'recorded' };
      return;
    }
    const result = reconstructFire(deps.getRun(), deps);
    last = result ? { events: result.events, how: 'rebuilt' } : null;
  });
  return {
    get: function () {
      return last;
    }
  };
}

// ---------- small switches ----------

export function setSpeed(speed, emit) {
  if (SPEEDS.indexOf(speed) === -1) {
    return { ok: false, msg: 'Unknown speed' };
  }
  emit('cheat:speed', { speed: speed });
  return { ok: true, msg: 'Fire speed: ' + (speed === 'instant' ? 'instant' : speed + 'x') };
}

export function setQuality(meta, quality) {
  if (QUALITIES.indexOf(quality) === -1) {
    return { ok: false, msg: 'Unknown quality' };
  }
  meta.settings.quality = quality;
  return { ok: true, msg: 'Quality: ' + quality };
}

// Throws on the next tick so the window error handler (the red bar) gets it.
export function throwTestError() {
  setTimeout(function () {
    throw new Error('Cheat menu test error: the red error bar should show this');
  }, 0);
}

// ---------- fps counter (the only place here that uses its own requestAnimationFrame) ----------

let fpsBox = null;
let fpsFrame = 0;

export function isFpsOn() {
  return fpsBox !== null;
}

function fpsLoop(box, state) {
  state.frames++;
  const now = performance.now();
  if (now - state.since >= 500) {
    box.textContent = Math.round((state.frames * 1000) / (now - state.since)) + ' fps';
    state.frames = 0;
    state.since = now;
  }
  fpsFrame = requestAnimationFrame(function () {
    fpsLoop(box, state);
  });
}

export function setFps(on) {
  if (typeof document === 'undefined') {
    return;
  }
  if (!on && fpsBox) {
    cancelAnimationFrame(fpsFrame);
    fpsBox.remove();
    fpsBox = null;
    return;
  }
  if (on && !fpsBox) {
    fpsBox = document.createElement('div');
    fpsBox.style.cssText = 'position:fixed;top:calc(4px + env(safe-area-inset-top,0px));right:4px;' +
      'z-index:100001;padding:2px 6px;border-radius:6px;background:rgba(0,0,0,0.7);' +
      'color:#7BE495;font:12px monospace;pointer-events:none';
    document.body.appendChild(fpsBox);
    fpsLoop(fpsBox, { frames: 0, since: performance.now() });
  }
}
