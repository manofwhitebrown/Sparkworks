// A fixed pool of particles. Arrays are made once and reused, so no garbage per frame.
// Owner: AI-6
import { THEME } from './theme.js';
import { getGlowSprite, drawGlow } from './glow.js';

var MAX = 150;
var COLORS = [THEME.colors.spark, THEME.colors.sparkHot, THEME.colors.good, THEME.colors.bad,
  THEME.colors.accent, THEME.coinColor];

export var PCOLOR = { spark: 0, hot: 1, good: 2, bad: 3, accent: 4, coin: 5 };

export function createParticles() {
  var px = new Float32Array(MAX);
  var py = new Float32Array(MAX);
  var vx = new Float32Array(MAX);
  var vy = new Float32Array(MAX);
  var life = new Float32Array(MAX);
  var maxLife = new Float32Array(MAX);
  var size = new Float32Array(MAX);
  var color = new Uint8Array(MAX);
  var cap = THEME.particleCaps.medium;
  var next = 0;
  var sprites = [];
  // particles stay inside the framed panel: they fade near its edge and are removed outside
  var bounds = { x0: -1e9, y0: -1e9, x1: 1e9, y1: 1e9 };
  var FADE_PX = 18;

  function setCap(n) {
    cap = Math.min(MAX, Math.max(0, n));
    for (var i = cap; i < MAX; i++) {
      life[i] = 0;
    }
  }

  // Reuse the next slot in a ring. Old particles are simply overwritten when the pool is full.
  function emit(x, y, dx, dy, seconds, radius, colorIndex) {
    if (cap === 0) {
      return;
    }
    var i = next % cap;
    next = next + 1;
    px[i] = x;
    py[i] = y;
    vx[i] = dx;
    vy[i] = dy;
    life[i] = seconds;
    maxLife[i] = seconds;
    size[i] = radius;
    color[i] = colorIndex;
  }

  // A ring of particles flying outward (used for bank bursts and fizzles).
  function burst(x, y, count, speed, seconds, radius, colorIndex, rand) {
    var n = Math.min(count, cap);
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + rand() * 0.6;
      var s = speed * (0.5 + rand() * 0.8);
      emit(x, y, Math.cos(a) * s, Math.sin(a) * s, seconds * (0.6 + rand() * 0.6), radius, colorIndex);
    }
  }

  function setBounds(x0, y0, x1, y1) {
    bounds.x0 = x0; bounds.y0 = y0; bounds.x1 = x1; bounds.y1 = y1;
  }

  // 0 outside the panel, 1 well inside, in between near the edge
  function edgeFade(x, y) {
    var d = Math.min(x - bounds.x0, bounds.x1 - x, y - bounds.y0, bounds.y1 - y);
    if (d <= 0) { return 0; }
    return d >= FADE_PX ? 1 : d / FADE_PX;
  }

  function update(dt) {
    for (var i = 0; i < MAX; i++) {
      if (life[i] > 0) {
        life[i] -= dt;
        px[i] += vx[i] * dt;
        py[i] += vy[i] * dt;
        vx[i] *= 0.96;
        vy[i] *= 0.96;
        if (edgeFade(px[i], py[i]) === 0) { life[i] = 0; }
      }
    }
  }

  function draw(ctx) {
    if (sprites.length === 0) {
      for (var c = 0; c < COLORS.length; c++) {
        sprites.push(getGlowSprite(COLORS[c], 32));
      }
    }
    for (var i = 0; i < MAX; i++) {
      if (life[i] > 0) {
        var t = life[i] / maxLife[i];
        drawGlow(ctx, sprites[color[i]], px[i], py[i], size[i] * (0.5 + t * 0.7), t * edgeFade(px[i], py[i]));
      }
    }
  }

  function count() {
    var n = 0;
    for (var i = 0; i < MAX; i++) {
      if (life[i] > 0) {
        n++;
      }
    }
    return n;
  }

  return { setBounds: setBounds, setCap: setCap, emit: emit, burst: burst, update: update, draw: draw, count: count };
}
