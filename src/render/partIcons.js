// Draws part icons in code (no image files) and caches data URLs for the DOM.
// Unknown part ids get a default icon: a rounded square with the first letter.
// Owner: AI-6
import { THEME } from './theme.js';
import { SHAPES } from './iconShapes.js';

var urlCache = {};

function drawDefaultIcon(ctx, partId, cx, cy, s) {
  var r = s * 0.14;
  var x = cx - s * 0.36;
  var y = cy - s * 0.36;
  var w = s * 0.72;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + w, r);
  ctx.arcTo(x + w, y + w, x, y + w, r);
  ctx.arcTo(x, y + w, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.stroke();
  var letter = String(partId || '?').charAt(0).toUpperCase();
  ctx.font = 'bold ' + Math.round(s * 0.42) + 'px ' + THEME.font.family;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter, cx, cy + s * 0.02);
}

// Draw the icon of partId centered in the square at (x, y) with the given size.
// x, y is the TOP-LEFT corner of the square.
export function drawPartIcon(ctx, partId, x, y, size, color) {
  var c = color || THEME.colors.text;
  var cx = x + size / 2;
  var cy = y + size / 2;
  ctx.save();
  ctx.strokeStyle = c;
  ctx.fillStyle = c;
  ctx.lineWidth = Math.max(1.5, size * 0.08);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  var shape = SHAPES[partId];
  if (shape) {
    shape(ctx, cx, cy, size);
  } else {
    drawDefaultIcon(ctx, partId, cx, cy, size);
  }
  ctx.restore();
}

// Returns a PNG data URL (cached). Returns '' when there is no document (tests).
export function getPartIconUrl(partId, size, color) {
  var key = partId + '|' + size + '|' + color;
  if (urlCache[key] !== undefined) {
    return urlCache[key];
  }
  if (typeof document === 'undefined') {
    return '';
  }
  var dpr = 2;
  var canvas = document.createElement('canvas');
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  var ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  drawPartIcon(ctx, partId, 0, 0, size, color);
  urlCache[key] = canvas.toDataURL('image/png');
  return urlCache[key];
}
