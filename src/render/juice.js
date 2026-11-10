// Pure math for "juice": pops, shakes, easing. Never returns NaN or Infinity.
// Owner: AI-6
import { THEME } from './theme.js';

function safeNumber(n, fallback) {
  if (typeof n !== 'number' || n !== n) {
    return fallback;
  }
  if (n === Infinity) {
    return 1e300;
  }
  if (n === -Infinity) {
    return -1e300;
  }
  return n;
}

export function clamp(n, lo, hi) {
  var v = safeNumber(n, lo);
  if (v < lo) {
    return lo;
  }
  if (v > hi) {
    return hi;
  }
  return v;
}

// How big was the jump from `before` to `after`, in orders of magnitude (0 when it went down).
export function jumpSize(before, after) {
  var b = Math.max(safeNumber(before, 1), 1);
  var a = safeNumber(after, 1);
  if (a <= b) {
    return 0;
  }
  return clamp(Math.log10(a / b), 0, 300);
}

// Scale of the squash-and-pop of a tile (1 = no pop). Capped so giant numbers stay readable.
export function popScale(before, after) {
  var j = Math.min(jumpSize(before, after), 4);
  return 1.08 + j * 0.07;
}

// Scale of the floating number above a part.
export function numberScale(before, after) {
  var j = Math.min(jumpSize(before, after), 4);
  return 1 + j * 0.12;
}

// Screen shake in pixels for a banked value. 0 for tiny values.
export function shakePixels(value) {
  var v = safeNumber(value, 0);
  if (v < 10) {
    return 0;
  }
  var px = Math.log10(v) * 1.4;
  return clamp(px, 0, THEME.maxShakePx);
}

export function easeOutCubic(t) {
  var u = 1 - clamp(t, 0, 1);
  return 1 - u * u * u;
}

export function easeOutBack(t) {
  var u = clamp(t, 0, 1) - 1;
  return 1 + 2.70158 * u * u * u + 1.70158 * u * u;
}

// A squash-and-pop curve: 0 at start, peaks near 1 early, back to 0 at the end.
export function popCurve(t) {
  var u = clamp(t, 0, 1);
  if (u < 0.3) {
    return easeOutCubic(u / 0.3);
  }
  return 1 - easeOutCubic((u - 0.3) / 0.7);
}
