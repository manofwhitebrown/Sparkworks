// Draws the light show: cell light, sparks with trails, floating numbers, notes, flashes.
// Reads state from effects.js and sparkPlayer.js. Glow = pre-rendered sprite + 'lighter'.
// Owner: AI-6
import { THEME } from './theme.js';
import { getGlowSprite, drawGlow } from './glow.js';
import { easeOutCubic } from './juice.js';

var sprites = null;

function getSprites() {
  if (!sprites) {
    sprites = {
      spark: getGlowSprite(THEME.colors.spark, 64),
      hot: getGlowSprite(THEME.colors.sparkHot, 64),
      bad: getGlowSprite(THEME.colors.bad, 64),
      accent: getGlowSprite(THEME.colors.accent, 64)
    };
  }
  return sprites;
}

// Parts next to the spark glow a little too.
function neighborLight(fx, x, y, cols, rows) {
  var best = 0;
  if (x > 0) { best = Math.max(best, fx.light(y * cols + x - 1)); }
  if (x < cols - 1) { best = Math.max(best, fx.light(y * cols + x + 1)); }
  if (y > 0) { best = Math.max(best, fx.light((y - 1) * cols + x)); }
  if (y < rows - 1) { best = Math.max(best, fx.light((y + 1) * cols + x)); }
  return best * 0.4;
}

// Soft light on cells the spark has just passed.
export function drawCellLight(ctx, L, fx, cols, rows) {
  var sp = getSprites();
  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      var k = y * cols + x;
      var a = Math.max(fx.light(k), neighborLight(fx, x, y, cols, rows));
      if (a > 0.02) {
        var cx = L.gridX + x * L.cell + L.cell / 2;
        var cy = L.gridY + y * L.cell + L.cell / 2;
        drawGlow(ctx, sp.spark, cx, cy, L.cell * 0.75, a * 0.45);
      }
    }
  }
}

function drawTrail(ctx, s, L, flags, sp) {
  if (flags.reduceMotion || s.trailLen < 2) { return; }
  var simple = flags.quality === 'low';
  var n = simple ? Math.min(s.trailLen, 3) : s.trailLen;
  for (var t = 0; t < n; t++) {
    var a = (1 - t / n) * 0.55 * s.fade;
    var x = L.gridX + s.trail[t * 2] * L.cell + L.cell / 2;
    var y = L.gridY + s.trail[t * 2 + 1] * L.cell + L.cell / 2;
    drawGlow(ctx, sp.spark, x, y, L.cell * (0.16 - t * 0.012), a);
  }
}

export function drawSparks(ctx, L, player, flags) {
  var sp = getSprites();
  var list = player.sparks;
  for (var k = 0; k < list.length; k++) {
    var s = list[k];
    if (!s.on) { continue; }
    drawTrail(ctx, s, L, flags, sp);
    var x = L.gridX + s.x * L.cell + L.cell / 2;
    var y = L.gridY + s.y * L.cell + L.cell / 2;
    var size = s.waiting ? 0.6 : 1;
    drawGlow(ctx, sp.spark, x, y, L.cell * 0.36 * size, 0.75 * s.fade);
    drawGlow(ctx, sp.hot, x, y, L.cell * 0.11 * size, 0.9 * s.fade);
  }
}

export function drawFlashes(ctx, L, fx, cols, rows) {
  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      var k = y * cols + x;
      var a = fx.flashOf(k);
      if (a > 0.02) {
        ctx.globalAlpha = a * 0.5;
        ctx.fillStyle = THEME.colors.bad;
        ctx.fillRect(L.gridX + x * L.cell + 2, L.gridY + y * L.cell + 2, L.cell - 4, L.cell - 4);
        ctx.globalAlpha = 1;
      }
    }
  }
}

export function drawNotes(ctx, L, fx, cols, rows) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold ' + Math.round(L.cell * 0.17) + 'px ' + THEME.font.numbers;
  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      var k = y * cols + x;
      var text = fx.noteOf(k);
      if (text) {
        ctx.globalAlpha = Math.min(1, 2 - fx.noteAge(k));
        ctx.fillStyle = THEME.colors.legendary;
        ctx.fillText(text, L.gridX + x * L.cell + L.cell / 2, L.gridY + y * L.cell + L.cell * 0.1);
        ctx.globalAlpha = 1;
      }
    }
  }
}

// Numbers that pop above parts and float up while fading.
export function drawPopups(ctx, L, fx) {
  var list = fx.popups;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (var k = 0; k < list.length; k++) {
    var p = list[k];
    if (!p.on) { continue; }
    var u = p.age / p.life;
    var rise = easeOutCubic(u) * L.cell * 0.45;
    var pop = u < 0.15 ? 0.6 + (u / 0.15) * 0.6 : 1.2 - Math.min(0.2, (u - 0.15) * 0.3);
    ctx.globalAlpha = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
    ctx.fillStyle = p.color;
    ctx.font = 'bold ' + Math.round(L.cell * 0.26 * p.scale * pop) + 'px ' + THEME.font.numbers;
    ctx.fillText(p.text, p.x, p.y - rise);
    if (p.sub) {
      ctx.fillStyle = THEME.colors.textDim;
      ctx.font = Math.round(L.cell * 0.15) + 'px ' + THEME.font.numbers;
      ctx.fillText(p.sub, p.x, p.y - rise + L.cell * 0.22);
    }
    ctx.globalAlpha = 1;
  }
}

// Part of the 'lighter' batch.
export function drawVaultGlow(ctx, L, fx) {
  var v = fx.vault;
  if (v.pulse > 0.02) {
    var cx = L.gridX + L.gridW + L.cell / 4;
    drawGlow(ctx, getSprites().spark, cx, L.gridY + L.gridH / 2, L.cell * (0.9 + v.pulse * 0.6), v.pulse * 0.7);
  }
}

// The running total sits in the footer, right under the vault slot, big and clear.
// It swells a little when a spark banks.
export function drawVault(ctx, L, fx, formatNumber) {
  var v = fx.vault;
  var right = L.gridX + L.gridW + L.cell * 0.4;
  var y = L.gridY + L.gridH + 4 + L.cell * 0.225;
  var swell = 1 + Math.min(1, v.pulse) * 0.18;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = v.shown > 0 ? THEME.colors.sparkHot : THEME.colors.textDim;
  ctx.font = 'bold ' + Math.round(L.cell * 0.3 * swell) + 'px ' + THEME.font.numbers;
  ctx.fillText(formatNumber(Math.round(v.shown)), right, y, L.gridW * 0.75);
}
