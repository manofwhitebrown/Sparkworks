// Counts a number from one value to another inside an element.
// Uses the shared loop-free approach: one short rAF run per ticker.
// Owner: AI-7

import { formatNumber } from '../../core/format.js';

function easeOut(t) { return 1 - (1 - t) * (1 - t) * (1 - t); }

export function tickNumber(element, from, to, ms) {
  const reduce = document.documentElement.classList.contains('reduceMotion');
  if (reduce || !ms || from === to) {
    element.textContent = formatNumber(to);
    return;
  }
  const start = performance.now();
  function frame(now) {
    if (!element.isConnected) return;
    const t = Math.min(1, (now - start) / ms);
    element.textContent = formatNumber(from + (to - from) * easeOut(t));
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
