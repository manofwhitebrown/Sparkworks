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

// Tag shape language: every tag has its own plate shape behind the icon, so tags read without color.
// add = circle, mult = diamond, route = hexagon, split = triangle, state = octagon,
// boost = shield, risk = warning triangle, economy = double ring.
function ngon(ctx, cx, cy, r, n, rot) {
  ctx.beginPath();
  for (var i = 0; i < n; i++) {
    var a = rot + i * Math.PI * 2 / n;
    var px = cx + Math.cos(a) * r;
    var py = cy + Math.sin(a) * r;
    if (i === 0) { ctx.moveTo(px, py); } else { ctx.lineTo(px, py); }
  }
  ctx.closePath();
}

function plateShape(ctx, tag, cx, cy, r) {
  if (tag === 'mult') { ngon(ctx, cx, cy, r * 1.05, 4, 0); }
  else if (tag === 'route') { ngon(ctx, cx, cy, r, 6, 0); }
  else if (tag === 'split') { ngon(ctx, cx, cy + r * 0.12, r * 1.1, 3, Math.PI / 2); }
  else if (tag === 'state') { ngon(ctx, cx, cy, r, 8, Math.PI / 8); }
  else if (tag === 'boost') { ngon(ctx, cx, cy, r, 5, -Math.PI / 2); }
  else if (tag === 'risk') { ngon(ctx, cx, cy + r * 0.1, r * 1.1, 3, -Math.PI / 2); }
  else { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); }
}

function drawTagPlate(ctx, tag, cx, cy, r, color) {
  plateShape(ctx, tag, cx, cy, r);
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  if (tag === 'economy') {
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.82, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// The tile "material": a soft top-lit enamel. Light edge on top, dark edge below, a faint tag tint at the
// bottom. All static, drawn once into the sprite cache.
function drawMaterial(ctx, x, y, w, r, tagColor) {
  var g = ctx.createLinearGradient(0, y, 0, y + w);
  g.addColorStop(0, '#26314A');
  g.addColorStop(0.55, THEME.colors.panel2);
  g.addColorStop(1, '#161D2A');
  roundRect(ctx, x, y, w, w, r);
  ctx.fillStyle = g;
  ctx.fill();
  var t = ctx.createLinearGradient(0, y + w * 0.5, 0, y + w);
  t.addColorStop(0, 'rgba(0,0,0,0)');
  t.addColorStop(1, tagColor);
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = t;
  roundRect(ctx, x, y, w, w, r);
  ctx.fill();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + r, y + 1.5);
  ctx.lineTo(x + w - r, y + 1.5);
  ctx.stroke();
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(x + r, y + w - 1.5);
  ctx.lineTo(x + w - r, y + w - 1.5);
  ctx.stroke();
  ctx.globalAlpha = 1;
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
  ctx.globalAlpha = alpha;
  var tagColor = THEME.tagColors[meta.tag] || THEME.colors.text;
  drawMaterial(ctx, x, y, w, w * 0.16, tagColor);
  ctx.globalAlpha = alpha; // the material helper resets alpha to 1
  roundRect(ctx, x, y, w, w, w * 0.16);
  if (state.glow > 0.02) {
    ctx.fillStyle = THEME.colors.spark;
    ctx.globalAlpha = alpha * state.glow * 0.18;
    ctx.fill();
    ctx.globalAlpha = alpha;
  }
  rarityBorder(ctx, x, y, w, w * 0.16, meta.rarity);
  var color = tagColor;
  if (state.banned) { color = THEME.colors.textDim; }
  drawTagPlate(ctx, meta.tag, 0, y + w * 0.46, w * 0.37, color);
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

// Part tiles are drawn once into a small picture and then re-used every frame (much cheaper
// than redrawing paths). A "slot" belongs to one cell and is redrawn only when its look changes.
export function drawTileCached(ctx, L, cellData, px, py, state, lookup, slot, dpr) {
  var w = L.cell * 0.84;
  var box = w + 6;
  var pixels = Math.round(box * dpr);
  var level = cellData.level || 1;
  var rot = cellData.rot || 0;
  var banned = !!state.banned;
  if (!slot.canvas || slot.partId !== cellData.partId || slot.level !== level || slot.rot !== rot ||
      slot.banned !== banned || slot.pixels !== pixels) {
    if (!slot.canvas) { slot.canvas = document.createElement('canvas'); }
    slot.canvas.width = pixels;
    slot.canvas.height = pixels;
    var sctx = slot.canvas.getContext('2d');
    sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawPartTile(sctx, L, cellData, box / 2, box / 2, { scale: 1, glow: 0, dim: 0, banned: banned }, lookup);
    slot.partId = cellData.partId; slot.level = level; slot.rot = rot; slot.banned = banned;
    slot.pixels = pixels;
  }
  var scale = state.scale || 1;
  ctx.globalAlpha = banned ? 0.4 : 1 - (state.dim || 0) * 0.6;
  ctx.drawImage(slot.canvas, px - box * scale / 2, py - box * scale / 2, box * scale, box * scale);
  ctx.globalAlpha = 1;
}
