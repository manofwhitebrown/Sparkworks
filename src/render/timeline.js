// Pure math: turns an event list into timed steps for the spark player.
// Each step says when it starts, how long it lasts and when its event is reported.
// Owner: AI-6
import { THEME } from './theme.js';

// Milliseconds one cell move takes for a given pass (0, 1, 2...). Gets faster each pass.
export function moveMsForPass(pass, speed, reduceMotion) {
  var T = THEME.timing;
  var p = Math.max(0, pass | 0);
  var ms = T.moveMs * Math.pow(T.rampPerPass, p);
  if (ms < T.minMoveMs) {
    ms = T.minMoveMs;
  }
  var divisor = speed > 0 ? speed : 1;
  if (reduceMotion) {
    divisor = divisor * T.reduceMotionSpeedUp;
  }
  return ms / divisor;
}

function actionMs(type, moveMs) {
  if (type === 'spawn') {
    return moveMs * 0.5;
  }
  if (type === 'enter') {
    return moveMs;
  }
  if (type === 'value' || type === 'split') {
    return moveMs * 0.55;
  }
  if (type === 'turn' || type === 'state' || type === 'coins' || type === 'disable') {
    return moveMs * 0.3;
  }
  if (type === 'bank') {
    // the pause after arriving shrinks with the tempo ramp, but never below a third
    return moveMs + THEME.timing.bankMs * 0.4 * Math.max(0.33, moveMs / THEME.timing.moveMs);
  }
  if (type === 'fizzle') {
    return THEME.timing.fizzleMs;
  }
  if (type === 'blocked') {
    return THEME.timing.blockedMs;
  }
  if (type === 'end') {
    return THEME.timing.endMs;
  }
  return 0;
}

// When inside the step is the event reported? enter and bank are reported on arrival.
function reportOffset(type, dur) {
  if (type === 'enter') {
    return dur;
  }
  if (type === 'bank') {
    return Math.min(dur, dur * 0.7);
  }
  return 0;
}

export function buildTimeline(events, playOptions) {
  var opts = playOptions || {};
  var speed = opts.speed > 0 ? opts.speed : 1;
  var reduce = !!opts.reduceMotion;
  var steps = [];
  var t = 0;
  var pass = 0;
  var moveMs = moveMsForPass(0, speed, reduce);
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    if (ev.type === 'spawn') {
      moveMs = moveMsForPass(pass, speed, reduce);
      pass = pass + 1;
    }
    var dur = actionMs(ev.type, moveMs);
    steps.push({
      index: i,
      type: ev.type,
      start: t,
      dur: dur,
      moveMs: moveMs,
      reportAt: t + reportOffset(ev.type, dur)
    });
    t = t + dur;
  }
  return { steps: steps, totalMs: t };
}
