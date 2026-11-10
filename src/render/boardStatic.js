// Pre-renders the parts of the board that never move: background, grid, vignette,
// source socket and vault slot. Drawn once, then re-used as one picture.
// Owner: AI-6
import { THEME } from './theme.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export { roundRect };

function drawGrid(ctx, L) {
  ctx.strokeStyle = THEME.colors.line;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (var x = 0; x <= L.cols; x++) {
    var px = Math.round(L.gridX + x * L.cell) + 0.5;
    ctx.moveTo(px, L.gridY);
    ctx.lineTo(px, L.gridY + L.gridH);
  }
  for (var y = 0; y <= L.rows; y++) {
    var py = Math.round(L.gridY + y * L.cell) + 0.5;
    ctx.moveTo(L.gridX, py);
    ctx.lineTo(L.gridX + L.gridW, py);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawVignette(ctx, L) {
  var cx = L.width / 2;
  var cy = L.height / 2;
  var grad = ctx.createRadialGradient(cx, cy, L.height * 0.2, cx, cy, Math.max(L.width, L.height) * 0.75);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, L.width, L.height);
}

// Idle trace: the straight row from the source to the vault.
function drawTrace(ctx, L, sourceRow) {
  var y = L.gridY + sourceRow * L.cell + L.cell / 2;
  ctx.strokeStyle = THEME.colors.line;
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 6]);
  ctx.beginPath();
  ctx.moveTo(L.gridX - L.cell * 0.25, y);
  ctx.lineTo(L.gridX + L.gridW + L.cell * 0.25, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawSocket(ctx, cx, cy, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = THEME.colors.bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

function drawVaultSlot(ctx, L) {
  var w = L.cell * 0.3;
  var x = L.gridX + L.gridW + L.cell / 4 - w / 2;
  roundRect(ctx, x, L.gridY + 4, w, L.gridH - 8, w / 2);
  ctx.fillStyle = THEME.colors.bg;
  ctx.fill();
  ctx.strokeStyle = THEME.colors.spark;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawCornerMarks(ctx, L, x, y) {
  var m = L.cell * 0.12;
  var x0 = L.gridX + x * L.cell + 4;
  var y0 = L.gridY + y * L.cell + 4;
  var x1 = L.gridX + (x + 1) * L.cell - 4;
  var y1 = L.gridY + (y + 1) * L.cell - 4;
  ctx.beginPath();
  ctx.moveTo(x0, y0 + m); ctx.lineTo(x0, y0); ctx.lineTo(x0 + m, y0);
  ctx.moveTo(x1 - m, y0); ctx.lineTo(x1, y0); ctx.lineTo(x1, y0 + m);
  ctx.moveTo(x0, y1 - m); ctx.lineTo(x0, y1); ctx.lineTo(x0 + m, y1);
  ctx.moveTo(x1 - m, y1); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 - m);
  ctx.stroke();
}

// Blocked cell: dark, hatched, faint red tint, with a crack line.
function drawBlockedCell(ctx, L, x, y) {
  var x0 = L.gridX + x * L.cell + 2;
  var y0 = L.gridY + y * L.cell + 2;
  var w = L.cell - 4;
  ctx.fillStyle = THEME.colors.bg;
  ctx.fillRect(x0, y0, w, w);
  ctx.fillStyle = THEME.colors.bad;
  ctx.globalAlpha = 0.08;
  ctx.fillRect(x0, y0, w, w);
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = THEME.colors.bad;
  ctx.lineWidth = 1;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x0, y0, w, w);
  ctx.clip();
  ctx.beginPath();
  for (var d = -w; d < w * 2; d += 8) {
    ctx.moveTo(x0 + d, y0 + w);
    ctx.lineTo(x0 + d + w, y0);
  }
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x0 + w * 0.3, y0 + w * 0.15);
  ctx.lineTo(x0 + w * 0.5, y0 + w * 0.45);
  ctx.lineTo(x0 + w * 0.4, y0 + w * 0.6);
  ctx.lineTo(x0 + w * 0.7, y0 + w * 0.85);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function isIn(list, x, y) {
  for (var i = 0; i < list.length; i++) {
    if (list[i].x === x && list[i].y === y) { return true; }
  }
  return false;
}

function drawCells(ctx, L, machine) {
  var blocked = machine.blocked || [];
  var cells = machine.cells || [];
  ctx.strokeStyle = THEME.colors.line;
  ctx.lineWidth = 1.5;
  for (var y = 0; y < L.rows; y++) {
    for (var x = 0; x < L.cols; x++) {
      if (isIn(blocked, x, y)) {
        drawBlockedCell(ctx, L, x, y);
      } else if (!isIn(cells, x, y)) {
        drawCornerMarks(ctx, L, x, y);
      }
    }
  }
}

// Draws the whole static layer into ctx (already scaled to CSS pixels).
export function drawStaticLayer(ctx, L, machine) {
  ctx.fillStyle = THEME.colors.panel;
  ctx.fillRect(0, 0, L.width, L.height);
  drawGrid(ctx, L);
  drawCells(ctx, L, machine);
  drawTrace(ctx, L, machine.sourceRow);
  var sy = L.gridY + machine.sourceRow * L.cell + L.cell / 2;
  drawSocket(ctx, L.gridX - L.cell / 4, sy, L.cell * 0.15, THEME.colors.spark);
  drawVaultSlot(ctx, L);
  drawVignette(ctx, L);
}
