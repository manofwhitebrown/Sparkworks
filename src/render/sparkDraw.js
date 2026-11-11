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
      white: getGlowSprite('#FFFFFF', 64),
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

// Trail: on low, a few fading glow dots (as before). On medium and high, a tapered ribbon:
// short line segments that get thinner and fainter toward the tail, plus a faint afterglow dot.
// How many trail segments one spark draws. With many sparks alive the trail is shortened (it still tapers),
// which cuts the canvas strokes per frame a lot in the worst case (docs/notes/AI-2.md, finding 1).
export function trailSegmentsFor(trailLen, sparkCount) {
  var len = Math.max(0, Math.floor(Number(trailLen) || 0));
  var many = Number(sparkCount) || 0;
  if (many > 12) { return Math.min(len, 3); }
  if (many > 6) { return Math.min(len, 4); }
  return len;
}

function drawTrail(ctx, s, L, flags, sp, sparkCount) {
  if (flags.reduceMotion || s.trailLen < 2) { return; }
  var n;
  var t;
  var a;
  var x;
  var y;
  if (flags.quality === 'low') {
    n = Math.min(s.trailLen, 3);
    for (t = 0; t < n; t++) {
      a = (1 - t / n) * 0.55 * s.fade;
      x = L.gridX + s.trail[t * 2] * L.cell + L.cell / 2;
      y = L.gridY + s.trail[t * 2 + 1] * L.cell + L.cell / 2;
      drawGlow(ctx, sp.spark, x, y, L.cell * (0.16 - t * 0.012), a);
    }
    return;
  }
  n = trailSegmentsFor(s.trailLen, sparkCount);
  if (n < 1) { return; }
  ctx.strokeStyle = THEME.colors.spark;
  ctx.lineCap = 'round';
  var px0 = L.gridX + s.x * L.cell + L.cell / 2;
  var py0 = L.gridY + s.y * L.cell + L.cell / 2;
  for (t = 0; t < n; t++) {
    var k = 1 - t / n;
    var x1 = L.gridX + s.trail[t * 2] * L.cell + L.cell / 2;
    var y1 = L.gridY + s.trail[t * 2 + 1] * L.cell + L.cell / 2;
    ctx.globalAlpha = k * k * 0.7 * s.fade;
    ctx.lineWidth = Math.max(1, L.cell * 0.17 * k);
    ctx.beginPath();
    ctx.moveTo(px0, py0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    px0 = x1;
    py0 = y1;
  }
  // faint afterglow at the tail end
  x = L.gridX + s.trail[(n - 1) * 2] * L.cell + L.cell / 2;
  y = L.gridY + s.trail[(n - 1) * 2 + 1] * L.cell + L.cell / 2;
  drawGlow(ctx, sp.spark, x, y, L.cell * 0.12, 0.25 * s.fade);
}

export function drawSparks(ctx, L, player, flags) {
  var sp = getSprites();
  var list = player.sparks;
  for (var k = 0; k < list.length; k++) {
    var s = list[k];
    if (!s.on) { continue; }
    drawTrail(ctx, s, L, flags, sp, list.length);
    var x = L.gridX + s.x * L.cell + L.cell / 2;
    var y = L.gridY + s.y * L.cell + L.cell / 2;
    var size = s.waiting ? 0.6 : 1;
    drawGlow(ctx, sp.spark, x, y, L.cell * 0.36 * size, 0.75 * s.fade);
    drawGlow(ctx, sp.hot, x, y, L.cell * 0.12 * size, 0.9 * s.fade);
    drawGlow(ctx, sp.white, x, y, L.cell * 0.055 * size, 1 * s.fade);
  }
}

export function drawFlashes(ctx, L, fx, cols, rows) {
  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      var k = y * cols + x;
      var ba = fx.bonusFlashOf(k);
      if (ba > 0.02) {
        ctx.globalAlpha = ba * 0.55;
        ctx.fillStyle = THEME.colors.sparkHot;
        ctx.fillRect(L.gridX + x * L.cell + 2, L.gridY + y * L.cell + 2, L.cell - 4, L.cell - 4);
        ctx.globalAlpha = 1;
      }
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
  var fontSet = false; // set the font only when a note is really shown (no new string per frame otherwise)
  for (var y = 0; y < rows; y++) {
    for (var x = 0; x < cols; x++) {
      var k = y * cols + x;
      var text = fx.noteOf(k);
      if (text) {
        if (!fontSet) {
          fontSet = true;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = 'bold ' + Math.round(L.cell * 0.17) + 'px ' + THEME.font.numbers;
        }
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
var vaultMemo = { px: -1, font: '', num: null, fmt: null, text: '' };

export function drawVault(ctx, L, fx, formatNumber) {
  var v = fx.vault;
  var right = L.gridX + L.gridW + L.cell * 0.4;
  var y = L.gridY + L.gridH + 4 + L.cell * 0.225;
  var swell = 1 + Math.min(1, v.pulse) * 0.18;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = v.shown > 0 ? THEME.colors.sparkHot : THEME.colors.textDim;
  // The font string and the formatted number are rebuilt only when they change, not on every drawn frame.
  var fontPx = Math.round(L.cell * 0.3 * swell);
  if (vaultMemo.px !== fontPx) { vaultMemo.px = fontPx; vaultMemo.font = 'bold ' + fontPx + 'px ' + THEME.font.numbers; }
  var shownInt = Math.round(v.shown);
  if (vaultMemo.num !== shownInt || vaultMemo.fmt !== formatNumber) {
    vaultMemo.num = shownInt;
    vaultMemo.fmt = formatNumber;
    vaultMemo.text = formatNumber(shownInt);
  }
  ctx.font = vaultMemo.font;
  ctx.fillText(vaultMemo.text, right, y, L.gridW * 0.75);
}

// Lost spark marker: a small "x" where a spark left through a side edge. It grows a little,
// then fades. Pure strokes, no glow, so it stays cheap on every quality level.
export function drawLostMarks(ctx, L, fx) {
  var list = fx.lostMarks;
  for (var k = 0; k < list.length; k++) {
    var m = list[k];
    if (!m.on) { continue; }
    var u = m.age / (THEME.timing.lostMs / 1000);
    var r = L.cell * (0.1 + 0.05 * easeOutCubic(Math.min(1, u * 3)));
    var cx = L.gridX + m.x * L.cell + L.cell / 2;
    var cy = L.gridY + m.y * L.cell + L.cell / 2;
    ctx.globalAlpha = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5;
    ctx.strokeStyle = THEME.colors.bad;
    ctx.lineWidth = Math.max(2, L.cell * 0.045);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r);
    ctx.lineTo(cx + r, cy + r);
    ctx.moveTo(cx + r, cy - r);
    ctx.lineTo(cx - r, cy + r);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

// Wires: the wire a spark just crossed keeps a fading amber glow. On medium and high three bright
// pulses also run along it (they move with the fade), so the energy visibly flows. On low: a plain line.
export function drawWires(ctx, L, fx, cols, rows, time, flags) {
  var sp = getSprites();
  var n = cols * rows;
  var rich = flags.quality !== 'low' && !flags.reduceMotion;
  ctx.strokeStyle = THEME.colors.spark;
  ctx.lineCap = 'round';
  for (var k = 0; k < n; k++) {
    var a = fx.wireOf(k);
    if (a <= 0.02) { continue; }
    var x0 = L.gridX + fx.wireGeoOf(k, 0) * L.cell + L.cell / 2;
    var y0 = L.gridY + fx.wireGeoOf(k, 1) * L.cell + L.cell / 2;
    var x1 = L.gridX + fx.wireGeoOf(k, 2) * L.cell + L.cell / 2;
    var y1 = L.gridY + fx.wireGeoOf(k, 3) * L.cell + L.cell / 2;
    ctx.globalAlpha = a * 0.4;
    ctx.lineWidth = Math.max(2, L.cell * 0.07);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    if (rich) {
      for (var j = 0; j < 3; j++) {
        var u = (time * 2.2 + j / 3) % 1;
        drawGlow(ctx, sp.hot, x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, L.cell * 0.09, a * 0.8);
      }
    }
  }
  ctx.globalAlpha = 1;
}

// Merge / level-up flourish: expanding rings (two, staggered). Pure strokes.
export function drawRings(ctx, L, fx) {
  var list = fx.rings;
  for (var k = 0; k < list.length; k++) {
    var r = list[k];
    if (!r.on) { continue; }
    var u = r.age / (THEME.timing.ringMs / 1000);
    var cx = L.gridX + r.x * L.cell + L.cell / 2;
    var cy = L.gridY + r.y * L.cell + L.cell / 2;
    for (var w = 0; w < 2; w++) {
      var v = u - w * 0.18;
      if (v <= 0 || v >= 1) { continue; }
      ctx.globalAlpha = (1 - v) * 0.9;
      ctx.strokeStyle = w === 0 ? THEME.colors.sparkHot : THEME.colors.spark;
      ctx.lineWidth = Math.max(1.5, L.cell * 0.06 * (1 - v));
      ctx.beginPath();
      ctx.arc(cx, cy, L.cell * (0.3 + easeOutCubic(v) * 0.75 * r.power), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

// The vault fills with light from the bottom while sparks bank. Drawn inside the slot, under the 'lighter' halo.
export function drawVaultFill(ctx, L, fx, quality) {
  var f = fx.vault.fill;
  if (f < 0.01) { return; }
  var w = L.cell * 0.3;
  var cx = L.gridX + L.gridW + L.cell / 4;
  var top = L.gridY + 4;
  var h = L.gridH - 8;
  var fh = (h - 4) * f;
  var x = cx - w / 2 + 2;
  var y = top + h - 2 - fh;
  var grad = ctx.createLinearGradient(0, y, 0, y + fh);
  grad.addColorStop(0, THEME.colors.sparkHot);
  grad.addColorStop(1, THEME.colors.spark);
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w - 4, fh);
  if (quality !== 'low') {
    drawGlow(ctx, getSprites().spark, cx, y, L.cell * 0.5, 0.35 * f);
  }
  ctx.globalAlpha = 1;
}
