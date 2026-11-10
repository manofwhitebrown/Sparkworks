// Glow without any blur effect: draw one small radial-gradient picture once,
// then stamp it many times with 'lighter' blending.
// Owner: AI-6

var sprites = {};

function makeCanvas(size) {
  if (typeof document === 'undefined') {
    return null;
  }
  var canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

// A glow sprite is a square picture, `size` px wide, soft at the edges.
export function getGlowSprite(color, size) {
  var key = color + '|' + size;
  if (sprites[key]) {
    return sprites[key];
  }
  var canvas = makeCanvas(size);
  if (!canvas) {
    return null;
  }
  var ctx = canvas.getContext('2d');
  var r = size / 2;
  var grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, color);
  grad.addColorStop(0.25, color);
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 1;
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  sprites[key] = canvas;
  return canvas;
}

// Stamp a glow centered at (x, y). Leaves globalAlpha changed: reset it after the batch. `radius` is the drawn radius in CSS pixels.
export function drawGlow(ctx, sprite, x, y, radius, alpha) {
  if (!sprite || alpha <= 0.01) {
    return;
  }
  // the caller sets globalCompositeOperation = 'lighter' once for a whole batch of glows
  ctx.globalAlpha = alpha > 1 ? 1 : alpha;
  ctx.drawImage(sprite, x - radius, y - radius, radius * 2, radius * 2);
}
