// Draws one frame of the board from the view state S. Draw order (back to front):
// static layer, highlights/selection, part tiles, dim, cell light, flashes, sparks,
// particles, popups, notes, vault total, drag ghost.
// Owner: AI-6
import { THEME } from './theme.js';
import { drawPartTile, drawTileCached } from './partTile.js';
import { popCurve } from './juice.js';
import { bonusLabel } from './bonusTiles.js';
import { bonusColor, roundRect } from './boardStatic.js';
import { drawCellLight, drawFlashes, drawSparks, drawPopups, drawNotes, drawVault, drawVaultGlow, drawLostMarks } from './sparkDraw.js';

var shakeOut = { x: 0, y: 0 };

function cellRect(ctx, L, x, y, color, alpha, width) {
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.strokeRect(L.gridX + x * L.cell + 2, L.gridY + y * L.cell + 2, L.cell - 4, L.cell - 4);
  ctx.globalAlpha = 1;
}

function drawMarks(ctx, S) {
  var L = S.L;
  var pulse = 0.35 + 0.25 * Math.sin(S.time * 5);
  for (var i = 0; i < S.highlights.length; i++) {
    var h = S.highlights[i];
    ctx.globalAlpha = pulse * 0.5;
    ctx.fillStyle = THEME.colors.accent;
    ctx.fillRect(L.gridX + h.x * L.cell + 2, L.gridY + h.y * L.cell + 2, L.cell - 4, L.cell - 4);
    ctx.globalAlpha = 1;
    cellRect(ctx, L, h.x, h.y, THEME.colors.accent, pulse + 0.3, 1.5);
  }
  if (S.selected) {
    cellRect(ctx, L, S.selected.x, S.selected.y, THEME.colors.accent, 1, 3);
  }
  if (S.drag && S.drag.target) {
    cellRect(ctx, L, S.drag.target.x, S.drag.target.y, THEME.colors.spark, 1, 3);
  }
}

function drawParts(ctx, S) {
  var L = S.L;
  var fx = S.effects;
  var cells = S.machine.cells || [];
  var banned = S.machine.banned || [];
  for (var i = 0; i < cells.length; i++) {
    var c = cells[i];
    var k = c.y * S.machine.cols + c.x;
    var p = fx.popProgress(k);
    var scale = p < 1 ? 1 + fx.popAmp(k) * popCurve(p) : 1;
    var dim = 0;
    if (fx.isDisabled(k)) { dim = 1; }
    if (fx.flickerOf(k) > 0 && Math.sin(S.time * 60) > 0) { dim = 1; }
    if (S.drag && S.drag.fromX === c.x && S.drag.fromY === c.y) { dim = 1; }
    var untouched = S.dimKeys !== null && S.dimKeys[c.x + ',' + c.y] === true;
    if (untouched) { dim = Math.max(dim, 0.75); }
    var state = { scale: scale, dim: dim, banned: banned.indexOf(c.partId) >= 0 };
    if (!S.tileSlots[k]) { S.tileSlots[k] = {}; }
    drawTileCached(ctx, L, c, L.gridX + c.x * L.cell + L.cell / 2, L.gridY + c.y * L.cell + L.cell / 2,
      state, S.getPart, S.tileSlots[k], S.dpr);
    if (untouched) { drawQuestionMark(ctx, L, c.x, c.y); }
  }
}

// Small "?" badge on a part the last Fire never touched (dim parts).
function drawQuestionMark(ctx, L, x, y) {
  var r = Math.max(6, L.cell * 0.13);
  var cx = L.gridX + (x + 1) * L.cell - L.cell * 0.2;
  var cy = L.gridY + y * L.cell + L.cell * 0.2;
  ctx.fillStyle = THEME.colors.bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = THEME.colors.textDim;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = THEME.colors.text;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold ' + Math.round(r * 1.4) + 'px ' + THEME.font.family;
  ctx.fillText('?', cx, cy + 0.5);
}

// A bonus tile under a part is covered by the part, so its label becomes a small badge in the
// top-left corner, drawn above the part (text, so it works without color).
function drawBonusBadges(ctx, S) {
  var list = S.machine.bonusCells;
  if (!Array.isArray(list) || list.length === 0) { return; }
  var L = S.L;
  var cells = S.machine.cells || [];
  var fs = Math.max(8, Math.round(L.cell * 0.17));
  ctx.font = 'bold ' + fs + 'px ' + THEME.font.numbers;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (var i = 0; i < list.length; i++) {
    var b = list[i];
    var has = false;
    for (var c = 0; c < cells.length; c++) {
      if (cells[c].x === b.x && cells[c].y === b.y) { has = true; }
    }
    if (!has) { continue; }
    var text = bonusLabel(b);
    var w = ctx.measureText(text).width + fs * 0.7;
    var h = fs * 1.3;
    var x0 = L.gridX + b.x * L.cell + 3;
    var y0 = L.gridY + b.y * L.cell + 3;
    roundRect(ctx, x0, y0, w, h, h / 2);
    ctx.fillStyle = THEME.colors.bg;
    ctx.fill();
    ctx.strokeStyle = bonusColor(b);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = bonusColor(b);
    ctx.fillText(text, x0 + w / 2, y0 + h / 2 + 0.5);
  }
}

function drawGhost(ctx, S) {
  if (!S.drag) { return; }
  var cells = S.machine.cells || [];
  for (var i = 0; i < cells.length; i++) {
    if (cells[i].x === S.drag.fromX && cells[i].y === S.drag.fromY) {
      ctx.globalAlpha = 0.85;
      drawPartTile(ctx, S.L, cells[i], S.drag.px, S.drag.py, { scale: 1.12, glow: 0.5, dim: 0 }, S.getPart);
      ctx.globalAlpha = 1;
    }
  }
}

export function drawFrame(ctx, S) {
  var L = S.L;
  var fx = S.effects;
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.clearRect(0, 0, L.width, L.height);
  ctx.save();
  if (S.flags.quality !== 'low' && !S.flags.reduceMotion) {
    fx.shakeOffset(shakeOut);
    ctx.translate(shakeOut.x, shakeOut.y);
  }
  ctx.drawImage(S.staticCanvas, 0, 0, L.width, L.height);
  drawMarks(ctx, S);
  drawParts(ctx, S);
  drawBonusBadges(ctx, S);
  if (S.previewSegments.length > 0 && !S.player.isPlaying()) {
    ctx.drawImage(S.previewCanvas, 0, 0, L.width, L.height);
  }
  var dim = fx.dimAmount() * THEME.dimWhilePlaying;
  if (dim > 0.005) {
    ctx.globalAlpha = dim;
    ctx.fillStyle = '#000';
    ctx.fillRect(L.gridX, L.gridY, L.gridW, L.gridH);
    ctx.globalAlpha = 1;
  }
  drawFlashes(ctx, L, fx, S.machine.cols, S.machine.rows);
  // all glows in one batch: 'lighter' is switched on once, not per stamp
  ctx.globalCompositeOperation = 'lighter';
  drawCellLight(ctx, L, fx, S.machine.cols, S.machine.rows);
  drawSparks(ctx, L, S.player, S.flags);
  S.particles.draw(ctx);
  drawVaultGlow(ctx, L, fx);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;
  drawPopups(ctx, L, fx);
  drawNotes(ctx, L, fx, S.machine.cols, S.machine.rows);
  drawLostMarks(ctx, L, fx);
  drawVault(ctx, L, fx, S.formatNumber);
  drawGhost(ctx, S);
  ctx.restore();
}
