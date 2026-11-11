// Shop animations: a card flies to the bench or to the coins, coins count, offers deal in.
// All numbers (timings, delays) come from src/run/celebration.js.
// Owner: AI-4 (covering AI-7 for the shop screen)

import { el, injectStyle, animateEl } from './fxBase.js';
import { flightMs, staggerDelays, tickValue } from '../../run/celebration.js';
import { formatNumber } from '../../core/format.js';

const STYLE = '.fxFly{position:fixed;left:0;top:0;margin:0;z-index:60;pointer-events:none;transform-origin:0 0;}' +
  '.fxFloat{position:fixed;z-index:60;pointer-events:none;font-weight:700;color:var(--coin,#FFD166);}';

// A copy of a card, kept before the screen redraws, so it can fly after the redraw.
export function makeGhost(node) {
  if (!node || !node.isConnected) return null;
  const rect = node.getBoundingClientRect();
  if (rect.width === 0) return null;
  const copy = node.cloneNode(true);
  copy.classList.remove('isSold', 'isSelected');
  return { node: copy, rect: rect };
}

// Flies the ghost to the middle of `target`, shrinking and fading. 'none' skips it.
export function flyGhost(ghost, target, tier) {
  if (!ghost || !target || tier === 'none') return Promise.resolve();
  injectStyle('fxShopStyle', STYLE);
  const from = ghost.rect;
  const to = target.getBoundingClientRect();
  const scale = Math.max(0.3, Math.min(1, to.width / from.width));
  const dx = to.left + to.width / 2 - (from.width * scale) / 2 - from.left;
  const dy = to.top + to.height / 2 - (from.height * scale) / 2 - from.top;
  const copy = ghost.node;
  copy.classList.add('fxFly');
  copy.style.width = from.width + 'px';
  copy.style.height = from.height + 'px';
  copy.style.transform = 'translate(' + from.left + 'px,' + from.top + 'px)';
  document.body.appendChild(copy);
  const ms = flightMs(Math.sqrt(dx * dx + dy * dy));
  const start = 'translate(' + from.left + 'px,' + from.top + 'px) scale(1)';
  const end = 'translate(' + (from.left + dx) + 'px,' + (from.top + dy) + 'px) scale(' + scale + ')';
  return animateEl(copy, [
    { transform: start, opacity: 1 },
    { transform: end, opacity: 0.35 }
  ], { duration: ms, easing: 'cubic-bezier(0.22, 0.8, 0.3, 1)', fill: 'forwards' }).then(function () {
    copy.remove();
  });
}

// The new offers appear one after another (a short fade when quality is low).
export function dealOffers(container, tier) {
  if (tier === 'none') return;
  const cards = container.children;
  const delays = staggerDelays(cards.length);
  for (let i = 0; i < cards.length; i++) {
    const full = tier === 'full';
    animateEl(cards[i], [
      { opacity: 0, transform: full ? 'translateY(12px)' : 'none' },
      { opacity: 1, transform: 'none' }
    ], { duration: 260, delay: full ? delays[i] : 0, easing: 'ease-out', fill: 'backwards' });
  }
}

// A card that was just bought dims slowly instead of jumping to the dim look.
export function dimSold(card, tier) {
  if (!card || tier === 'none') return;
  animateEl(card, [{ opacity: 1 }, { opacity: 0.3 }], { duration: 300, easing: 'ease-out' });
}

// A short size pulse on a pill (the coin count).
export function pulse(node, tier) {
  if (!node || tier === 'none') return;
  animateEl(node, [{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }],
    { duration: 260, easing: 'ease-out' });
}

// "+3" floats up from an element and fades. Only on the full tier.
export function floatLabel(anchor, text, tier) {
  if (!anchor || tier !== 'full') return;
  injectStyle('fxShopStyle', STYLE);
  const rect = anchor.getBoundingClientRect();
  const label = el('div', 'fxFloat', text);
  label.style.left = (rect.left + rect.width / 2 - 12) + 'px';
  label.style.top = rect.top + 'px';
  document.body.appendChild(label);
  animateEl(label, [
    { transform: 'translateY(0)', opacity: 1 },
    { transform: 'translateY(-28px)', opacity: 0 }
  ], { duration: 750, easing: 'ease-out' }).then(function () { label.remove(); });
}

// Counts the coin text from one number to another: "12 coins" -> "9 coins".
export function tickCoins(node, from, to, tier) {
  const suffix = ' coins';
  if (!node || tier === 'none' || from === to) {
    if (node) node.textContent = formatNumber(to) + suffix;
    return;
  }
  const ms = 380;
  const start = performance.now();
  node.textContent = formatNumber(from) + suffix;
  function frame(now) {
    if (!node.isConnected) return;
    const t = Math.min(1, (now - start) / ms);
    node.textContent = formatNumber(tickValue(from, to, t)) + suffix;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
