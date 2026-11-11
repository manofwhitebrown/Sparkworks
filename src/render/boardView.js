// The board view: a canvas that draws the machine, plays event logs, and handles input.
// Only redraws when something changes or moves. Uses the app's single frame loop.
// Owner: AI-6
import { THEME } from './theme.js';
import { computeLayout, cellAtLocal, clampDpr, FOOTER } from './layout.js';
import { drawStaticLayer } from './boardStatic.js';
import { createEffects } from './effects.js';
import { createParticles } from './particles.js';
import { createSparkPlayer } from './sparkPlayer.js';
import { drawFrame } from './boardDraw.js';
import { attachInput } from './input.js';
import { startLoop } from '../core/loop.js';
import { formatNumber } from '../core/format.js';
import { getPart } from '../engine/parts/index.js';

var QUALITY_ORDER = ['low', 'medium', 'high'];
var DEFAULT_MACHINE = { cols: 5, rows: 4, sourceRow: 1, cells: [], blocked: [], banned: [] };

// Sharpness costs fill rate: high gets the contract cap of 2, medium 1.5, low 1.25.
function dprCapFor(quality) {
  if (quality === 'low') { return THEME.lowDpr; }
  if (quality === 'medium') { return THEME.mediumDpr; }
  return THEME.maxDpr;
}

export function createBoardView(container, options) {
  var opts = options || {};
  var deps = opts.deps || {};
  var loopStart = deps.startLoop || startLoop;
  var destroyed = false;
  var canvas = document.createElement('canvas');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Machine board');
  container.appendChild(canvas);
  var ctx = canvas.getContext('2d');
  var staticCanvas = document.createElement('canvas');

  var S = {
    L: computeLayout(360, 300, 5, 4), machine: DEFAULT_MACHINE, staticCanvas: staticCanvas, dpr: 1,
    tileSlots: [], selected: null, highlights: [], rawHighlights: [], drag: null, time: 0, dirty: true,
    flags: { quality: 'medium', reduceMotion: false },
    effects: createEffects(), particles: createParticles(),
    formatNumber: deps.formatNumber || formatNumber, getPart: deps.getPart || getPart
  };
  var rand = deps.rand || Math.random; // only for visual sparkle, never for game logic
  var frameWindow = { sum: 0, count: 0 };

  S.particles.setCap(THEME.particleCaps.medium);
  S.player = createSparkPlayer({
    getLayout: function () { return S.L; }, getMachine: function () { return S.machine; },
    effects: S.effects, particles: S.particles, getFlags: function () { return S.flags; },
    onEventPlayed: function (ev) { if (opts.onEventPlayed) { opts.onEventPlayed(ev); } },
    formatNumber: S.formatNumber, rand: rand
  });

  function rebuildStatic() {
    var L = S.L;
    staticCanvas.width = Math.round(L.width * S.dpr);
    staticCanvas.height = Math.round(L.height * S.dpr);
    var sctx = staticCanvas.getContext('2d');
    sctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
    drawStaticLayer(sctx, L, S.machine);
    S.dirty = true;
  }

  function resize() {
    // measure the container without our own canvas, or its old height would feed back into it
    canvas.style.display = 'none';
    var rect = container.getBoundingClientRect();
    canvas.style.display = 'block';
    var w = rect.width > 0 ? rect.width : 360;
    var m = S.machine;
    var aspectH = Math.round(w * (m.rows + FOOTER) / (m.cols + 1));
    var h = rect.height > 60 ? Math.min(rect.height, aspectH) : aspectH;
    S.dpr = clampDpr(window.devicePixelRatio, dprCapFor(S.flags.quality));
    canvas.width = Math.round(w * S.dpr);
    canvas.height = Math.round(h * S.dpr);
    canvas.style.height = h + 'px';
    S.L = computeLayout(w, h, m.cols, m.rows);
    rebuildStatic();
  }

  function cellAtPoint(clientX, clientY) {
    var rect = canvas.getBoundingClientRect();
    return cellAtLocal(S.L, clientX - rect.left, clientY - rect.top);
  }

  function dropQuality() {
    var at = QUALITY_ORDER.indexOf(S.flags.quality);
    if (at <= 0) { return; }
    setQuality(QUALITY_ORDER[at - 1]);
    if (opts.onQualityDrop) { opts.onQualityDrop(S.flags.quality); }
  }

  // Auto quality: if a Fire averages above 24 ms per frame, step down one level.
  function watchFrameTime(dt) {
    if (!S.player.isPlaying() || S.player.isSkipping()) { frameWindow.sum = 0; frameWindow.count = 0; return; }
    frameWindow.sum += dt * 1000;
    frameWindow.count++;
    if (frameWindow.count >= 30) {
      if (frameWindow.sum / frameWindow.count > THEME.timing.autoQualityFrameMs) { dropQuality(); }
      frameWindow.sum = 0;
      frameWindow.count = 0;
    }
  }

  function frame(dt) {
    if (destroyed) { return; }
    var safeDt = dt > 0.1 ? 0.1 : dt;
    S.player.update(safeDt);
    S.particles.update(safeDt);
    S.effects.update(safeDt);
    S.time += safeDt;
    watchFrameTime(dt);
    var animating = S.player.isPlaying() || S.effects.busy() || S.particles.count() > 0 ||
      S.highlights.length > 0 || S.drag !== null;
    if (S.dirty || animating) {
      drawFrame(ctx, S);
      S.dirty = false;
    }
  }

  // Valid-drop highlights never go on blocked cells: they cannot take a part, and an
  // always-pulsing highlight would keep the idle board redrawing every frame.
  function applyHighlights() {
    var out = [];
    var blocked = S.machine.blocked || [];
    for (var i = 0; i < S.rawHighlights.length; i++) {
      var h = S.rawHighlights[i];
      var isBlocked = false;
      for (var b = 0; b < blocked.length; b++) {
        if (blocked[b].x === h.x && blocked[b].y === h.y) { isBlocked = true; }
      }
      if (!isBlocked) { out.push(h); }
    }
    S.highlights = out;
    S.dirty = true;
  }

  function setMachine(machine) {
    S.machine = machine || DEFAULT_MACHINE;
    applyHighlights();
    var sizeChanged = S.L.cols !== S.machine.cols || S.L.rows !== S.machine.rows;
    if (sizeChanged) { S.effects.reset(S.machine.cols, S.machine.rows); resize(); } else { rebuildStatic(); }
  }

  function setQuality(level) {
    if (QUALITY_ORDER.indexOf(level) < 0) { return; }
    var before = S.dpr;
    S.flags.quality = level;
    S.particles.setCap(THEME.particleCaps[level]);
    S.dirty = true;
    // a new quality can mean a new pixel density, which needs a new canvas size
    if (clampDpr(window.devicePixelRatio, dprCapFor(level)) !== before) { resize(); }
  }

  function play(events, playOptions) {
    var po = playOptions || {};
    S.flags.reduceMotion = !!po.reduceMotion;
    S.particles.setCap(S.flags.reduceMotion ? 0 : THEME.particleCaps[S.flags.quality]);
    return S.player.play(events, po);
  }

  var detach = attachInput(canvas, {
    cellAt: cellAtPoint,
    hasPart: function (x, y) { return findCell(x, y) !== null; },
    isPlaying: function () { return S.player.isPlaying(); },
    onSkip: function () { S.player.skip(); },
    onTap: function (x, y) { if (opts.onCellTap) { opts.onCellTap(x, y); } },
    onDrag: function (a, b, c, d) { if (opts.onCellDrag) { opts.onCellDrag(a, b, c, d); } },
    onDragMove: function (info) { S.drag = info; S.dirty = true; }
  });

  function findCell(x, y) {
    var cells = S.machine.cells || [];
    for (var i = 0; i < cells.length; i++) {
      if (cells[i].x === x && cells[i].y === y) { return cells[i]; }
    }
    return null;
  }

  S.effects.reset(S.machine.cols, S.machine.rows);
  resize();
  loopStart(frame);
  var observer = null;
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(function () { resize(); });
    observer.observe(container);
  }

  return {
    setMachine: setMachine,
    setSelectedCell: function (x, y) { S.selected = x === null || x === undefined ? null : { x: x, y: y }; S.dirty = true; },
    setHighlightCells: function (list) { S.rawHighlights = list || []; applyHighlights(); },
    cellAtPoint: cellAtPoint, play: play, skip: function () { S.player.skip(); },
    setQuality: setQuality, resize: resize,
    frame: frame,
    destroy: function () {
      // stopLoop() would stop every callback of the app, so we only switch our own frame off
      destroyed = true;
      detach();
      if (observer) { observer.disconnect(); }
      if (canvas.parentNode) { canvas.parentNode.removeChild(canvas); }
    }
  };
}
