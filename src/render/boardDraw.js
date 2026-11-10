// Draws one frame of the board from the view state S. Draw order (back to front):
// static layer, highlights/selection, part tiles, dim, cell light, flashes, sparks,
// particles, popups, notes, vault total, drag ghost.
// Owner: AI-6
import { THEME } from './theme.js';
import { drawPartTile, drawTileCached } from './partTile.js';
import { popCurve } from './juice.js';
import { drawCellLight, drawFlashes, drawSparks, drawPopups, drawNotes, drawVault, drawVaultGlow } from './sparkDraw.js';

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
    var state = { scale: scale, dim: dim, banned: banned.indexOf(c.partId) >= 0 };
    if (!S.tileSlots[k]) { S.tileSlots[k] = {}; }
    drawTileCached(ctx, L, c, L.gridX + c.x * L.cell + L.cell / 2, L.gridY + c.y * L.cell + L.cell / 2,
      state, S.getPart, S.tileSlots[k], S.dpr);
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
  drawVault(ctx, L, fx, S.formatNumber);
  drawGhost(ctx, S);
  ctx.restore();
}
