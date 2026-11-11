// Small shared helpers for the shop and results animations: motion tier, style tag, safe animate.
// Everything moves with transform and opacity only (Web Animations), no shadows, no filters.
// Owner: AI-4 (covering AI-7 for the shop and results screens)

import { getMeta } from '../ui.js';
import { fxTier } from '../../run/celebration.js';

export function settingsNow() {
  const meta = getMeta();
  return meta && meta.settings ? meta.settings : {};
}

// 'none' (reduce motion), 'low' or 'full'.
export function currentTier() {
  return fxTier(settingsNow());
}

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Adds a <style> tag once. Colors come from the shared tokens, with the palette as fallback.
export function injectStyle(id, css) {
  if (document.getElementById(id)) return;
  const tag = document.createElement('style');
  tag.id = id;
  tag.textContent = css;
  document.head.appendChild(tag);
}

// Runs a Web Animation and gives back a Promise that always ends (even when animate is missing).
export function animateEl(node, frames, options) {
  return new Promise(function (resolve) {
    if (!node || typeof node.animate !== 'function') { resolve(); return; }
    try {
      const anim = node.animate(frames, options);
      anim.onfinish = function () { resolve(); };
      anim.oncancel = function () { resolve(); };
    } catch (err) {
      resolve();
    }
  });
}
