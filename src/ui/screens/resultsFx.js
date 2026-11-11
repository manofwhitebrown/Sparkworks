// Celebration pieces: star rows, the "shift cleared" strip, the medal, the light burst.
// Numbers and words come from src/run/celebration.js. Only transform and opacity move.
// Owner: AI-4 (covering AI-7 for the shop and results screens)

import { el, injectStyle, animateEl } from './fxBase.js';
import { starsLabel, clearedTitle, burstPieces, staggerDelays, MEDAL_NAMES } from '../../run/celebration.js';
import { tickNumber } from '../components/numberTicker.js';
import { formatNumber } from '../../core/format.js';
import { playPass } from '../../audio/sfx.js';

const STYLE = '.starRow{display:flex;justify-content:center;gap:var(--s2,8px);font-size:28px;line-height:1;}' +
  '.starRow .star{color:var(--spark,#FFC857);}.starRow .star.off{color:var(--textDim,#8A97AD);}' +
  '.clearStrip{display:flex;flex-direction:column;align-items:center;gap:var(--s2,8px);text-align:center;}' +
  '.clearStrip .clearScore{font-size:var(--fs-big,32px);font-weight:700;color:var(--sparkHot,#FFF1C2);}' +
  '.medalBox{display:flex;flex-direction:column;align-items:center;gap:var(--s2,8px);position:relative;}' +
  '.medal{width:96px;height:96px;border-radius:50%;border:4px solid var(--spark,#FFC857);display:flex;' +
  'flex-direction:column;align-items:center;justify-content:center;background:var(--panel2,#1C2432);}' +
  '.medal.silver{border-color:var(--common,#9FB3C8);}.medal.bronze{border-color:var(--spark,#FFC857);border-style:dashed;}' +
  '.medal .medalNum{font-size:24px;font-weight:700;}' +
  '.calmBox{display:flex;flex-direction:column;align-items:center;gap:var(--s2,8px);text-align:center;}' +
  '.shiftPips{display:flex;gap:var(--s1,4px);}.shiftPips .pipDot{width:12px;height:12px;border-radius:50%;' +
  'border:2px solid var(--textDim,#8A97AD);}.shiftPips .pipDot.on{background:var(--spark,#FFC857);border-color:var(--spark,#FFC857);}' +
  '.burstPiece{position:absolute;left:50%;top:50%;border-radius:50%;background:var(--sparkHot,#FFF1C2);pointer-events:none;}';

// Three stars: a filled star is lit, an outline star is not (shape, not only color).
export function makeStarRow(stars) {
  injectStyle('fxResultsStyle', STYLE);
  const row = el('div', 'starRow');
  row.setAttribute('role', 'img');
  row.setAttribute('aria-label', starsLabel(stars));
  for (let i = 0; i < 3; i++) {
    row.appendChild(el('span', i < stars ? 'star' : 'star off', i < stars ? '\u2605' : '\u2606'));
  }
  return row;
}

// The stars pop in one after another with a rising note. 'none' shows them at once.
export function revealStars(row, stars, tier) {
  if (tier === 'none') return;
  const nodes = row.children;
  const delays = staggerDelays(3);
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].style.opacity = '0';
    const lit = i < stars;
    animateEl(nodes[i], [
      { transform: 'scale(0.3)', opacity: 0 },
      { transform: 'scale(1.25)', opacity: 1, offset: 0.65 },
      { transform: 'scale(1)', opacity: 1 }
    ], { duration: 380, delay: 250 + delays[i] * 2, easing: 'ease-out', fill: 'forwards' });
    if (lit) setTimeout(function () { playPass(i); }, 250 + delays[i] * 2);
  }
}

// The strip at the top of the shop: "Shift 3 cleared", the score counting up, stars, coins.
export function makeClearedStrip(entry, stars, coinsEarned, tier) {
  injectStyle('fxResultsStyle', STYLE);
  const strip = el('div', 'panel clearStrip');
  strip.appendChild(el('div', 'dim', clearedTitle(entry.shift)));
  const score = el('div', 'num clearScore', '0');
  strip.appendChild(score);
  strip.appendChild(el('div', 'dim', 'Target ' + formatNumber(entry.target)));
  const row = makeStarRow(stars);
  strip.appendChild(row);
  if (coinsEarned > 0) strip.appendChild(el('div', 'pill coin', '+' + formatNumber(coinsEarned) + ' coins'));
  tickNumber(score, 0, entry.total, 900);
  revealStars(row, stars, tier);
  return strip;
}

// The medal of a won run: a disc with stars earned, its name under it.
export function makeMedal(rating) {
  injectStyle('fxResultsStyle', STYLE);
  const box = el('div', 'medalBox');
  const disc = el('div', 'medal ' + rating.medal);
  disc.append(el('div', 'medalNum num', '\u2605 ' + rating.earned), el('div', 'dim', 'of ' + rating.possible));
  box.append(disc, el('div', '', MEDAL_NAMES[rating.medal] || ''));
  return box;
}

// The calm look after a loss: one dot per shift, lit for cleared shifts. No motion at all.
export function makeShiftPips(history) {
  injectStyle('fxResultsStyle', STYLE);
  const pips = el('div', 'shiftPips');
  for (let i = 0; i < 8; i++) {
    const entry = history[i];
    const cleared = !!entry && entry.total >= entry.target;
    pips.appendChild(el('span', cleared ? 'pipDot on' : 'pipDot'));
  }
  return pips;
}

// Pieces of light fly out of `anchor` and fade. The pieces live inside `anchor` (position: relative).
export function burstFrom(anchor, count, seed) {
  if (!anchor || count <= 0) return;
  injectStyle('fxResultsStyle', STYLE);
  const pieces = burstPieces(count, seed);
  pieces.forEach(function (p) {
    const dot = el('span', 'burstPiece');
    dot.style.width = p.size + 'px';
    dot.style.height = p.size + 'px';
    anchor.appendChild(dot);
    const dx = Math.cos(p.angle) * p.distance;
    const dy = Math.sin(p.angle) * p.distance;
    animateEl(dot, [
      { transform: 'translate(0, 0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(0.4)', opacity: 0 }
    ], { duration: 1100, delay: p.delay, easing: 'cubic-bezier(0.15, 0.7, 0.3, 1)', fill: 'backwards' })
      .then(function () { dot.remove(); });
  });
}
