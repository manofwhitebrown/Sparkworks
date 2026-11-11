// Plain numbers for the shop and results celebrations: stars, medal, light burst, timings.
// No DOM here, so node:test can check it. The screens only draw what this returns.
// Owner: AI-4

import { CELEBRATION_RULES } from '../data/shifts.js';
import { makeRng } from '../core/rng.js';

// 0 to 3 stars for one shift. 0 means the target was not reached.
export function starsForShift(total, target) {
  if (!(target > 0) || !(total >= target)) return 0;
  const ratio = total / target;
  const ratios = CELEBRATION_RULES.starRatios;
  let stars = 0;
  for (let i = 0; i < ratios.length; i++) {
    if (ratio >= ratios[i]) stars = i + 1;
  }
  return stars;
}

// Stars of every shift in a run history ({ shift, total, target } entries).
export function starsFromHistory(history) {
  const list = Array.isArray(history) ? history : [];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    out.push(starsForShift(list[i].total, list[i].target));
  }
  return out;
}

// What the results screen shows: stars earned, stars possible, the medal ('none', 'bronze',
// 'silver', 'gold') and how many shifts were cleared. A lost run gets no medal.
export function runRating(history, won) {
  const stars = starsFromHistory(history);
  let earned = 0;
  let cleared = 0;
  for (let i = 0; i < stars.length; i++) {
    earned += stars[i];
    if (stars[i] > 0) cleared += 1;
  }
  const possible = stars.length * 3;
  let medal = 'none';
  if (won) {
    const share = possible > 0 ? earned / possible : 0;
    medal = 'bronze';
    if (share >= CELEBRATION_RULES.silverShare) medal = 'silver';
    if (share >= CELEBRATION_RULES.goldShare) medal = 'gold';
  }
  return { stars: stars, earned: earned, possible: possible, cleared: cleared, medal: medal };
}

export const MEDAL_NAMES = { bronze: 'Bronze medal', silver: 'Silver medal', gold: 'Gold medal' };

// How the screens treat motion: 'none' (reduce motion), 'low' (few extras) or 'full'.
export function fxTier(settings) {
  const s = settings || {};
  if (s.reduceMotion) return 'none';
  if (s.quality === 'low') return 'low';
  return 'full';
}

// How many light pieces to throw. Always under the particle caps (30 / 80 / 150).
export function burstCount(settings) {
  if (fxTier(settings) === 'none') return 0;
  const s = settings || {};
  const tier = s.quality === 'low' || s.quality === 'high' ? s.quality : 'medium';
  return CELEBRATION_RULES.burstPieces[tier];
}

// Light pieces for a burst: angle (radians, mostly upward), distance in px, delay and size.
// The same seed gives the same burst.
export function burstPieces(count, seed) {
  const rng = makeRng((seed >>> 0) + 7);
  const pieces = [];
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (rng() - 0.5) * Math.PI * 1.4;
    pieces.push({
      angle: angle,
      distance: 70 + rng() * 150,
      delay: Math.round(rng() * 220),
      size: 3 + Math.round(rng() * 3)
    });
  }
  return pieces;
}

// Flight time for a card moving `distance` px: longer trips take a bit longer, within limits.
export function flightMs(distance) {
  const d = Number.isFinite(distance) ? Math.abs(distance) : 0;
  const ms = CELEBRATION_RULES.flightMsMin + d * 0.4;
  return Math.round(Math.min(CELEBRATION_RULES.flightMsMax, ms));
}

// Start delays for a row of items that appear one after another. No row is slower than the max.
export function staggerDelays(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(Math.min(CELEBRATION_RULES.staggerMaxMs, i * CELEBRATION_RULES.staggerStepMs));
  }
  return out;
}

// The number on screen while a count runs: whole numbers between `from` and `to`.
// t is 0..1. Never gives NaN, and gives `to` exactly at t = 1.
export function tickValue(from, to, t) {
  const a = Number.isFinite(from) ? from : 0;
  const b = Number.isFinite(to) ? to : 0;
  const k = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 1;
  if (k >= 1) return b;
  const eased = 1 - (1 - k) * (1 - k) * (1 - k);
  return Math.round(a + (b - a) * eased);
}

// Words for the shift cleared strip and the results. Plain, short, never blaming.
export function clearedTitle(shift) {
  return 'Shift ' + shift + ' cleared';
}

export function starsLabel(stars) {
  return stars + ' of 3 stars';
}

export function lostLine(cleared) {
  if (cleared <= 0) return 'Not this time. Try a new run.';
  return 'Not this time. You cleared ' + cleared + (cleared === 1 ? ' shift.' : ' shifts.');
}
