// Legendary shimmer: a slow diagonal light band that sweeps over legendary part tiles, then rests.
// Only on medium and high, never with reduce motion. The band is one small picture made once.
// Owner: AI-6
import { roundRect } from './boardStatic.js';

var SWEEP_SECONDS = 3.2;
var ACTIVE_PART = 0.4; // the band moves during the first 40% of each period, then the tile rests
var band = null;

function getBand() {
  if (band || typeof document === 'undefined') { return band; }
  band = document.createElement('canvas');
  band.width = 64;
  band.height = 64;
  var c = band.getContext('2d');
  var g = c.createLinearGradient(0, 0, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(255,241,194,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 64, 64);
  return band;
}

// Pure: where is the band (-1 = off the left side, 1 = off the right side, null = resting)?
export function shimmerPhase(time, offset) {
  var t = ((time + (offset || 0)) % SWEEP_SECONDS) / SWEEP_SECONDS;
  if (!(t >= 0) || t > ACTIVE_PART) { return null; }
  return -1 + 2 * (t / ACTIVE_PART);
}

export function shimmerOn(flags) {
  return flags.quality !== 'low' && !flags.reduceMotion;
}

export function drawShimmer(ctx, S) {
  var list = S.legendCells;
  if (!list || list.length === 0 || !shimmerOn(S.flags)) { return; }
  var img = getBand();
  if (!img) { return; }
  var L = S.L;
  var w = L.cell * 0.84;
  for (var i = 0; i < list.length; i++) {
    var ph = shimmerPhase(S.time, i * 0.7);
    if (ph === null) { continue; }
    var cx = L.gridX + list[i].x * L.cell + L.cell / 2;
    var cy = L.gridY + list[i].y * L.cell + L.cell / 2;
    ctx.save();
    roundRect(ctx, cx - w / 2, cy - w / 2, w, w, w * 0.16);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.55;
    ctx.drawImage(img, cx - w * 0.5 + ph * w * 0.9, cy - w * 0.7, w, w * 1.4);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
