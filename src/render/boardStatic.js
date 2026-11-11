// Pre-renders the parts of the board that never move: background, grid, vignette,
// source socket and vault slot. Drawn once, then re-used as one picture.
// Owner: AI-6
import { THEME } from './theme.js';
import { bonusLabel } from './bonusTiles.js';
import { dirVector } from './previewPath.js';

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

// A soft halo made with a radial gradient (no blur effects), drawn once into the static picture.
function drawHalo(ctx, cx, cy, r, color, alpha) {
  var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = grad;
  ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  ctx.globalAlpha = 1;
}

// Source: a glowing socket with a hot core and a small arrow showing where the spark goes.
function drawSocket(ctx, cx, cy, r, color) {
  drawHalo(ctx, cx, cy, r * 3.2, color, 0.35);
  ctx.fillStyle = THEME.colors.bg;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  drawHalo(ctx, cx, cy, r * 1.1, THEME.colors.sparkHot, 0.9);
  ctx.fillStyle = THEME.colors.sparkHot;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
  ctx.fill();
  // small chevron on the right side of the socket
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + r * 1.9, cy - r * 0.45);
  ctx.lineTo(cx + r * 2.5, cy);
  ctx.lineTo(cx + r * 1.9, cy + r * 0.45);
  ctx.stroke();
}

// Vault: a dark slot with an amber inner gradient, level ticks and a faint halo.
function drawVaultSlot(ctx, L) {
  var w = L.cell * 0.3;
  var cx = L.gridX + L.gridW + L.cell / 4;
  var x = cx - w / 2;
  var y = L.gridY + 4;
  var h = L.gridH - 8;
  drawHalo(ctx, cx, y + h / 2, h * 0.6, THEME.colors.spark, 0.12);
  roundRect(ctx, x, y, w, h, w / 2);
  var grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, THEME.colors.bg);
  grad.addColorStop(1, '#2A2110');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = THEME.colors.spark;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (var t = 1; t < 8; t++) {
    var ty = y + (h * t) / 8;
    ctx.moveTo(x + w * 0.28, ty);
    ctx.lineTo(x + w * 0.72, ty);
  }
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


// Bonus floor tile (contract 23): a glowing floor plate with a dashed inner frame and a label.
// "add" tiles use the add color (amber), "mult" tiles the mult color (teal). The label is text,
// so colorblind players can read it. If a part sits on the tile, only a ring and a small corner
// badge stay visible around the part tile.
export function bonusColor(bonus) {
  return bonus && bonus.kind === 'mult' ? THEME.tagColors.mult : THEME.tagColors.add;
}

function drawBonusTile(ctx, L, bonus, hasPart) {
  var color = bonusColor(bonus);
  var x0 = L.gridX + bonus.x * L.cell + 3;
  var y0 = L.gridY + bonus.y * L.cell + 3;
  var w = L.cell - 6;
  var cx = x0 + w / 2;
  var cy = y0 + w / 2;
  drawHalo(ctx, cx, cy, L.cell * 0.62, color, hasPart ? 0.18 : 0.3);
  roundRect(ctx, x0, y0, w, w, w * 0.14);
  ctx.fillStyle = color;
  ctx.globalAlpha = hasPart ? 0.1 : 0.16;
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (!hasPart) {
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    roundRect(ctx, x0 + w * 0.12, y0 + w * 0.12, w * 0.76, w * 0.76, w * 0.1);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (!hasPart) { // with a part on it, the label is a small badge drawn above the part (boardDraw)
    ctx.font = 'bold ' + Math.max(9, Math.round(L.cell * 0.34)) + 'px ' + THEME.font.numbers;
    ctx.fillText(bonusLabel(bonus), cx, cy);
  }
}

function drawBonusTiles(ctx, L, machine) {
  var list = Array.isArray(machine.bonusCells) ? machine.bonusCells : [];
  var cells = machine.cells || [];
  for (var i = 0; i < list.length; i++) {
    var b = list[i];
    if (!b || b.x < 0 || b.y < 0 || b.x >= L.cols || b.y >= L.rows) { continue; }
    if (isIn(machine.blocked || [], b.x, b.y)) { continue; }
    drawBonusTile(ctx, L, b, isIn(cells, b.x, b.y));
  }
}

// The path preview (contract 25): a thin amber line through the cells the sparks will enter, and
// a small arrow on every step. It is drawn into its OWN picture, only when the list changes, and
// drawn above the parts. The line stops at the edge of a part tile and the arrows sit on the cell
// borders, so no part icon is covered. Shows the road only, never numbers.
export function drawPreviewLayer(ctx, L, segments, machine) {
  ctx.clearRect(0, 0, L.width, L.height);
  var cells = machine.cells || [];
  var tileHalf = L.cell * 0.42;
  ctx.lineCap = 'round';
  ctx.lineWidth = Math.max(1.5, L.cell * 0.035);
  ctx.strokeStyle = THEME.colors.spark;
  ctx.fillStyle = THEME.colors.spark;
  for (var i = 0; i < segments.length; i++) {
    var sg = segments[i];
    var v = dirVector(sg.dir);
    var ax = L.gridX + sg.x1 * L.cell + L.cell / 2;
    var ay = L.gridY + sg.y1 * L.cell + L.cell / 2;
    var bx = L.gridX + sg.x2 * L.cell + L.cell / 2;
    var by = L.gridY + sg.y2 * L.cell + L.cell / 2;
    var inA = isIn(cells, sg.x1, sg.y1) ? tileHalf : 0;
    var inB = isIn(cells, sg.x2, sg.y2) ? tileHalf : 0;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(ax + v[0] * inA, ay + v[1] * inA);
    ctx.lineTo(bx - v[0] * inB, by - v[1] * inB);
    ctx.stroke();
    // arrow on the border between the two cells
    var mx = (ax + bx) / 2;
    var my = (ay + by) / 2;
    var s = Math.max(3, L.cell * 0.075);
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(mx + v[0] * s, my + v[1] * s);
    ctx.lineTo(mx - v[0] * s - v[1] * s, my - v[1] * s + v[0] * s);
    ctx.lineTo(mx - v[0] * s + v[1] * s, my - v[1] * s - v[0] * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// The footer under the grid: a thin divider and the "VAULT" label. The running total is drawn live on top.
function drawFooter(ctx, L) {
  var y = L.gridY + L.gridH;
  var h = L.cell * 0.45;
  ctx.strokeStyle = THEME.colors.line;
  ctx.globalAlpha = 0.8;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(L.gridX, Math.round(y + 4) + 0.5);
  ctx.lineTo(L.gridX + L.gridW, Math.round(y + 4) + 0.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = THEME.colors.textDim;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold ' + Math.max(8, Math.round(L.cell * 0.15)) + 'px ' + THEME.font.family;
  ctx.fillText('VAULT', L.gridX + 2, y + 4 + h / 2);
}

// The framed panel: a dark rounded rectangle with a thin border. Outside it the canvas stays
// transparent, so the corners blend into the page instead of showing a lighter rectangle.
export function panelPath(ctx, L) {
  roundRect(ctx, 0.5, 0.5, L.width - 1, L.height - 1, Math.max(8, L.cell * 0.28));
}

// Draws the whole static layer into ctx (already scaled to CSS pixels).
export function drawStaticLayer(ctx, L, machine) {
  ctx.clearRect(0, 0, L.width, L.height);
  ctx.save();
  panelPath(ctx, L);
  ctx.clip();
  ctx.fillStyle = THEME.colors.panel;
  ctx.fillRect(0, 0, L.width, L.height);
  drawGrid(ctx, L);
  drawCells(ctx, L, machine);
  drawTrace(ctx, L, machine.sourceRow);
  drawBonusTiles(ctx, L, machine);
  var sy = L.gridY + machine.sourceRow * L.cell + L.cell / 2;
  drawSocket(ctx, L.gridX - L.cell / 4, sy, L.cell * 0.13, THEME.colors.spark);
  drawVaultSlot(ctx, L);
  drawFooter(ctx, L);
  drawVignette(ctx, L);
  ctx.restore();
  panelPath(ctx, L);
  ctx.strokeStyle = THEME.colors.line;
  ctx.lineWidth = 1;
  ctx.stroke();
}
