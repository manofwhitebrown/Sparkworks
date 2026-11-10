// Plays an event log as an animation: moves sparks, triggers effects, reports each event once.
// It never draws. sparkDraw.js reads the sparks from here.
// Owner: AI-6
import { THEME } from './theme.js';
import { buildTimeline } from './timeline.js';
import { PCOLOR } from './particles.js';

// the source and the vault sit in the half-cell margins: centers are a quarter cell off the grid
var SOURCE_X = -0.75;
var VAULT_OFFSET = -0.25;
var MAX_SPARKS = 16;
var TRAIL = 8;

export function createSparkPlayer(env) {
  // env: { getLayout, getMachine, effects, particles, getFlags, onEventPlayed, formatNumber, rand }
  var sparks = [];
  var state = { playing: false, clock: 0, startIdx: 0, reportIdx: 0, events: null, tl: null,
    resolve: null, skipping: false, skipPerSec: 0, opts: null };
  var i;
  for (i = 0; i < MAX_SPARKS; i++) {
    sparks.push({ on: false, id: 0, fx: 0, fy: 0, tx: 0, ty: 0, x: 0, y: 0, t0: 0, dur: 1,
      dx: 1, dy: 0, fade: 1, dying: false, trail: new Float32Array(TRAIL * 2), trailLen: 0, trailTick: 0 });
  }

  function findSpark(id, create) {
    var free = -1;
    for (var k = 0; k < MAX_SPARKS; k++) {
      if (sparks[k].on && sparks[k].id === id) { return sparks[k]; }
      if (!sparks[k].on && free < 0) { free = k; }
    }
    if (!create || free < 0) { return null; }
    var s = sparks[free];
    s.on = true; s.id = id; s.dying = false; s.fade = 1; s.trailLen = 0; s.dur = 1; s.t0 = 0;
    return s;
  }

  function placeSpark(s, x, y) {
    s.fx = x; s.fy = y; s.tx = x; s.ty = y; s.x = x; s.y = y;
  }

  function moveSpark(s, x, y, start, dur) {
    s.fx = s.x; s.fy = s.y; s.tx = x; s.ty = y; s.t0 = start; s.dur = Math.max(1, dur);
    if (x !== s.x) { s.dx = x > s.x ? 1 : -1; s.dy = 0; }
    if (y !== s.y) { s.dy = y > s.y ? 1 : -1; s.dx = 0; }
  }

  function px(cx) { var L = env.getLayout(); return L.gridX + cx * L.cell + L.cell / 2; }
  function py(cy) { var L = env.getLayout(); return L.gridY + cy * L.cell + L.cell / 2; }

  // Called when a step begins: only movement is set up here.
  function onStart(step, ev) {
    var machine = env.getMachine();
    var s;
    if (ev.type === 'spawn') {
      s = findSpark(ev.spark, true);
      if (s) {
        if (ev.parent === 0) { placeSpark(s, SOURCE_X, ev.y); } else { placeSpark(s, ev.x, ev.y); }
      }
    } else if (ev.type === 'enter' || ev.type === 'blocked') {
      s = findSpark(ev.spark, true);
      if (s) { moveSpark(s, ev.x, ev.y, step.start, step.moveMs); }
    } else if (ev.type === 'bank') {
      s = findSpark(ev.spark, true);
      if (s) { moveSpark(s, machine.cols + VAULT_OFFSET, s.y, step.start, step.moveMs); }
    } else if (ev.type === 'fizzle') {
      s = findSpark(ev.spark, false);
      if (s) { s.dying = true; moveSpark(s, s.x + s.dx * 0.5, s.y + s.dy * 0.5, step.start, step.dur); }
    }
  }

  function burstAt(x, y, count, speed, color) {
    var f = env.getFlags();
    if (f.reduceMotion) { return; }
    env.particles.burst(x, y, count, speed, 0.5, 7, color, env.rand);
  }

  // Called when an event is "shown": effects plus the one onEventPlayed call.
  function onReport(step, ev, silent) {
    var fx = env.effects;
    var f = env.getFlags();
    var rich = !silent && f.quality !== 'low' && !f.reduceMotion;
    var ppx = px(ev.x || 0);
    var ppy = py(ev.y || 0);
    if (ev.type === 'bank') {
      fx.setVaultTarget(ev.runningTotal);
      if (!silent) {
        fx.bank(f.quality === 'low' || f.reduceMotion ? 0 : ev.value);
        burstAt(px(env.getMachine().cols + VAULT_OFFSET), ppyOfSpark(ev.spark), 18, 160, PCOLOR.hot);
        var s0 = findSpark(ev.spark, false);
        if (s0) { s0.dying = true; }
      }
    } else if (silent) {
      // skipping: no visuals except the vault total above
    } else if (ev.type === 'enter') {
      fx.lightCell(ev.x, ev.y, 1);
    } else if (ev.type === 'value') {
      fx.popTile(ev.x, ev.y, ev.before, ev.after);
      fx.valuePopup(ev.x, ev.y, ev.label, ev.before, ev.after, ppx, ppy - env.getLayout().cell * 0.3,
        env.formatNumber, f.reduceMotion);
      if (rich) { env.particles.burst(ppx, ppy, 5, 70, 0.4, 5, PCOLOR.spark, env.rand); }
    } else if (ev.type === 'split') {
      fx.lightCell(ev.x, ev.y, 1);
      fx.popTile(ev.x, ev.y, 1, 1);
      if (ev.label) { fx.addPopup(ev.label, '', ppx, ppy - env.getLayout().cell * 0.3, 1, THEME.tagColors.split, 0.6); }
      splitOut(ev, ppx, ppy, rich);
    } else if (ev.type === 'turn') {
      fx.lightCell(ev.x, ev.y, 1);
      fx.flashCell(ev.x, ev.y);
    } else if (ev.type === 'state') {
      fx.setNote(ev.x, ev.y, ev.label);
    } else if (ev.type === 'coins') {
      fx.addPopup('+' + ev.amount, '', ppx, ppy - env.getLayout().cell * 0.3, 1, THEME.coinColor, 0.7);
      if (rich) { env.particles.burst(ppx, ppy, 4, 60, 0.4, 5, PCOLOR.coin, env.rand); }
    } else if (ev.type === 'disable') {
      fx.flickerTile(ev.x, ev.y);
    } else if (ev.type === 'blocked') {
      fx.flashCell(ev.x, ev.y);
    } else if (ev.type === 'fizzle') {
      if (rich) { burstAt(ppxOfSpark(ev.spark, ppx), ppyOfSpark(ev.spark), 6, 50, PCOLOR.spark); }
    }
    env.onEventPlayed(ev);
  }

  function ppxOfSpark(id, fallback) {
    var s = findSpark(id, false);
    return s ? px(s.x) : fallback;
  }
  function ppyOfSpark(id) {
    var s = findSpark(id, false);
    return s ? py(s.y) : py(env.getMachine().sourceRow);
  }

  function splitOut(ev, ppx, ppy, rich) {
    var L = env.getLayout();
    var vx = 0;
    var vy = 0;
    if (ev.dir === 'right') { vx = 1; } else if (ev.dir === 'left') { vx = -1; }
    if (ev.dir === 'down') { vy = 1; } else if (ev.dir === 'up') { vy = -1; }
    if (!rich) { return; }
    for (var k = 0; k < 5; k++) {
      env.particles.emit(ppx + vx * L.cell * 0.2, ppy + vy * L.cell * 0.2,
        vx * 150 + (env.rand() - 0.5) * 40, vy * 150 + (env.rand() - 0.5) * 40, 0.35, 6, PCOLOR.accent);
    }
  }

  function finish() {
    for (var k = 0; k < MAX_SPARKS; k++) { sparks[k].on = false; }
    state.playing = false;
    state.skipping = false;
    env.effects.setPlaying(false);
    env.effects.clearDisabled();
    var done = state.resolve;
    state.resolve = null;
    if (done) { done(); }
  }

  function updateSparks(dt) {
    var tick = state.clock;
    for (var k = 0; k < MAX_SPARKS; k++) {
      var s = sparks[k];
      if (!s.on) { continue; }
      var u = Math.min(1, Math.max(0, (tick - s.t0) / s.dur));
      s.x = s.fx + (s.tx - s.fx) * u;
      s.y = s.fy + (s.ty - s.fy) * u;
      if (s.dying) { s.fade = Math.max(0, s.fade - dt * 4); if (s.fade === 0) { s.on = false; } }
      pushTrail(s, dt);
    }
  }

  function pushTrail(s, dt) {
    s.trailTick += dt;
    if (s.trailTick < 0.016) { return; }
    s.trailTick = 0;
    for (var t = TRAIL - 1; t > 0; t--) {
      s.trail[t * 2] = s.trail[t * 2 - 2];
      s.trail[t * 2 + 1] = s.trail[t * 2 - 1];
    }
    s.trail[0] = s.x;
    s.trail[1] = s.y;
    if (s.trailLen < TRAIL) { s.trailLen++; }
  }

  function update(dt) {
    if (!state.playing) { return; }
    var steps = state.tl.steps;
    var ev = state.events;
    if (state.skipping) {
      var count = Math.max(1, Math.ceil(state.skipPerSec * dt));
      while (count > 0 && state.reportIdx < steps.length) {
        onReport(steps[state.reportIdx], ev[state.reportIdx], true);
        state.reportIdx++;
        count--;
      }
      if (state.reportIdx >= steps.length) { finish(); }
      return;
    }
    state.clock += dt * 1000;
    while (state.startIdx < steps.length && steps[state.startIdx].start <= state.clock) {
      onStart(steps[state.startIdx], ev[state.startIdx]);
      state.startIdx++;
    }
    while (state.reportIdx < state.startIdx && steps[state.reportIdx].reportAt <= state.clock) {
      onReport(steps[state.reportIdx], ev[state.reportIdx], false);
      state.reportIdx++;
    }
    updateSparks(dt);
    if (state.clock >= state.tl.totalMs && state.reportIdx >= steps.length) { finish(); }
  }

  function play(events, playOptions) {
    if (state.playing) { skip(); flushNow(); }
    return new Promise(function (resolve) {
      var opts = playOptions || {};
      state.events = events || [];
      state.tl = buildTimeline(state.events, opts);
      state.clock = 0; state.startIdx = 0; state.reportIdx = 0; state.skipping = false;
      state.opts = opts;
      state.resolve = resolve;
      state.playing = true;
      env.effects.setPlaying(true);
      if (state.events.length === 0) { finish(); }
    });
  }

  // Report everything that is left right now (used when a new play() interrupts an old one).
  function flushNow() {
    while (state.playing && state.reportIdx < state.tl.steps.length) {
      onReport(state.tl.steps[state.reportIdx], state.events[state.reportIdx], true);
      state.reportIdx++;
    }
    if (state.playing) { finish(); }
  }

  function skip() {
    if (!state.playing || state.skipping) { return; }
    var left = state.tl.steps.length - state.reportIdx;
    var burstMs = Math.min(250, Math.max(16, left * THEME.timing.skipBurstMs));
    state.skipping = true;
    state.skipPerSec = left / (burstMs / 1000);
    for (var k = 0; k < MAX_SPARKS; k++) { sparks[k].on = false; }
  }

  return {
    play: play, skip: skip, update: update, sparks: sparks,
    isPlaying: function () { return state.playing; },
    isSkipping: function () { return state.skipping; }
  };
}
