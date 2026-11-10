// Draws one part tile: rounded tile, icon, level pips, rarity border, rotation arrow.
// Owner: AI-6
import { THEME } from './theme.js';
import { roundRect } from './boardStatic.js';
import { drawPartIcon } from './partIcons.js';
import { partMeta } from './partMeta.js';

function rarityBorder(ctx, x, y, w, r, rarity) {
  var col = THEME.colors[rarity] || THEME.colors.common;
  ctx.strokeStyle = col;
  ctx.lineWidth = rarity === 'legendary' ? 2.5 : 1.5;
  roundRect(ctx, x, y, w, w, r);
  ctx.stroke();
  if (rarity === 'rare' || rarity === 'legendary') {
    // the second line makes rare/legendary readable without color
    roundRect(ctx, x + 4, y + 4, w - 8, w - 8, Math.max(2, r - 3));
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

function drawPips(ctx, x, y, w, level, color) {
  var r = Math.max(2, w * 0.035);
  var startX = x + w / 2 - ((level - 1) * r * 3);
  ctx.fillStyle = color;
  for (var i = 0; i < level; i++) {
    ctx.beginPath();
    ctx.arc(startX + i * r * 6, y + w - r * 3, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawArrow(ctx, cx, cy, w, rot, color) {
  var a = rot * Math.PI / 2;
  var d = w * 0.42;
  var px = cx + Math.cos(a) * d;
  var py = cy + Math.sin(a) * d;
  var s = w * 0.07;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(px + Math.cos(a) * s, py + Math.sin(a) * s);
  ctx.lineTo(px - Math.cos(a) * s - Math.sin(a) * s, py - Math.sin(a) * s + Math.cos(a) * s);
  ctx.lineTo(px - Math.cos(a) * s + Math.sin(a) * s, py - Math.sin(a) * s - Math.cos(a) * s);
  ctx.closePath();
  ctx.fill();
}

// state: { scale, glow (0..1), dim (0..1), banned, disabled }
export function drawPartTile(ctx, L, cellData, px, py, state, lookup) {
  var meta = partMeta(cellData.partId, lookup);
  var w = L.cell * 0.84;
  var cx = px;
  var cy = py;
  var scale = state.scale || 1;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);
  var x = -w / 2;
  var y = -w / 2;
  var alpha = 1 - (state.dim || 0) * 0.6;
  if (state.banned) { alpha = 0.4; }
  ctx.globalAlpha = alpha;
  roundRect(ctx, x, y, w, w, w * 0.16);
  ctx.fillStyle = THEME.colors.panel2;
  ctx.fill();
  if (state.glow > 0.02) {
    ctx.fillStyle = THEME.colors.spark;
    ctx.globalAlpha = alpha * state.glow * 0.18;
    ctx.fill();
    ctx.globalAlpha = alpha;
  }
  rarityBorder(ctx, x, y, w, w * 0.16, meta.rarity);
  var color = THEME.tagColors[meta.tag] || THEME.colors.text;
  if (state.banned) { color = THEME.colors.textDim; }
  drawPartIcon(ctx, cellData.partId, x + w * 0.14, y + w * 0.1, w * 0.72, color);
  drawPips(ctx, x, y, w, cellData.level || 1, THEME.colors.textDim);
  if (meta.directional) {
    drawArrow(ctx, 0, 0, w, cellData.rot || 0, THEME.colors.text);
  }
  if (state.banned) {
    ctx.strokeStyle = THEME.colors.bad;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.2, y + w * 0.2);
    ctx.lineTo(x + w * 0.8, y + w * 0.8);
    ctx.moveTo(x + w * 0.8, y + w * 0.2);
    ctx.lineTo(x + w * 0.2, y + w * 0.8);
    ctx.stroke();
  }
  ctx.restore();
}
