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
  var w = L.cell * 0.36;
  var x = L.gridX + L.gridW + (L.cell - w) / 2 + L.cell * 0.04;
  roundRect(ctx, x, L.gridY + 4, w, L.gridH - 8, w / 2);
  ctx.fillStyle = THEME.colors.bg;
  ctx.fill();
  ctx.strokeStyle = THEME.colors.spark;
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// Draws the whole static layer into ctx (already scaled to CSS pixels).
export function drawStaticLayer(ctx, L, machine) {
  ctx.fillStyle = THEME.colors.panel;
  ctx.fillRect(0, 0, L.width, L.height);
  drawGrid(ctx, L);
  drawTrace(ctx, L, machine.sourceRow);
  var sy = L.gridY + machine.sourceRow * L.cell + L.cell / 2;
  drawSocket(ctx, L.gridX - L.cell / 2, sy, L.cell * 0.2, THEME.colors.spark);
  drawVaultSlot(ctx, L);
  drawVignette(ctx, L);
}
