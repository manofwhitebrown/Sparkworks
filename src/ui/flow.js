// Small pure helpers for the UI: HUD texts, progress ratio, what comes next.
// No DOM here, so node:test can check them.
// Owner: AI-7

import { formatNumber } from '../core/format.js';

// 0..1 for the shift progress bar. Safe for a zero or missing target.
export function progressRatio(shiftTotal, target) {
  if (!target || target <= 0) return 0;
  const ratio = shiftTotal / target;
  if (!(ratio > 0)) return 0;
  return ratio > 1 ? 1 : ratio;
}

// "Shift 3 of 8"
export function shiftText(shift, totalShifts) {
  return 'Shift ' + shift + ' of ' + totalShifts;
}

// "120 / 300"
export function totalText(shiftTotal, target) {
  return formatNumber(shiftTotal) + ' / ' + formatNumber(target);
}

// "2 Fires left" / "1 Fire left"
export function firesLeftText(firesLeft) {
  return firesLeft + (firesLeft === 1 ? ' Fire left' : ' Fires left');
}

// Which screen comes after a Fire finished. `run.phase` is set by AI-4's fire().
export function nextScreenAfterFire(run) {
  if (run.phase === 'won' || run.phase === 'lost') return 'results';
  if (run.phase === 'shop') return 'shop';
  return 'run'; // still building: stay on the run screen
}

// Text of the banner shown after a Fire.
export function fireBannerText(run) {
  const last = run.lastFire;
  if (!last) return '';
  if (run.phase === 'won') return 'Run complete!';
  if (run.phase === 'lost') return 'Out of Fires';
  if (last.passed) return 'Shift cleared!';
  return 'Not enough. ' + firesLeftText(run.firesLeft);
}

// What the Back button does on each screen: 'confirm', 'home' or 'stay'.
export function backAction(screenName) {
  if (screenName === 'run' || screenName === 'shop') return 'confirm';
  if (screenName === 'home') return 'stay';
  return 'home';
}

// Plain-English text for the reason codes AI-4 returns when an action is refused.
const REASONS = {
  outside_board: 'That is outside the board.',
  blocked_cell: 'That cell is blocked this shift.',
  cell_occupied: 'That cell is taken.',
  bench_full: 'Bench is full. Sell or place a part.',
  wrong_phase: 'You cannot do that right now.',
  not_shop_phase: 'The shop is closed.',
  no_fires_left: 'No Fires left.',
  not_enough_coins: 'Not enough coins.',
  already_sold: 'That one is already sold.',
  no_part_there: 'There is no part there.',
  no_such_bench_part: 'That part is gone.',
  no_such_offer: 'That offer is gone.',
  no_such_part: 'That part is gone.'
};

export function reasonText(reason) {
  return REASONS[reason] || 'That did not work.';
}

// The shift total to show while a Fire plays: the total before the Fire
// plus what this Fire has banked so far (`runningTotal` from the bank event).
export function shownTotalDuring(totalBefore, runningTotal) {
  return totalBefore + runningTotal;
}

// Which screen shows a run in this phase. Used when a cheat changes the run.
export function screenForPhase(phase) {
  if (phase === 'won' || phase === 'lost') return 'results';
  if (phase === 'shop') return 'shop';
  return 'run';
}

// Fire animation speed from the cheat menu: 0.25, 1, 2, 4 or 'instant'.
// Anything else falls back to normal speed. `instant` means: play, then skip at once.
export function fireSpeedFrom(value) {
  if (value === 'instant') return { speed: 1, instant: true };
  if (typeof value === 'number' && value > 0 && value <= 16) return { speed: value, instant: false };
  return { speed: 1, instant: false };
}

// The line shown on the results screen for a cheated run.
export const CHEATED_TEXT = 'Cheated run: no rewards';

// The scripted tutorial run is marked `tutorial: true`. It must never count as a real run.
export function isTutorialRun(run) {
  return !!run && run.tutorial === true;
}

// The saved run that Home may offer as "Continue": a real run that is still going.
export function continuableRun(run) {
  if (!run || isTutorialRun(run)) return null;
  if (run.phase === 'build' || run.phase === 'shop') return run;
  return null;
}

// Biggest board box (cols:rows ratio) that fits inside a slot. Whole pixels, never negative.
export function fitBoardSize(slotWidth, slotHeight, cols, rows) {
  const w = slotWidth > 0 ? slotWidth : 0;
  const h = slotHeight > 0 ? slotHeight : 0;
  if (!(cols > 0) || !(rows > 0)) return { width: 0, height: 0 };
  const ratio = cols / rows;
  let width = w;
  let height = width / ratio;
  if (height > h) { height = h; width = height * ratio; }
  return { width: Math.floor(width), height: Math.floor(height) };
}

// Empty, not blocked cells of a machine: where a part could be dropped.
export function validDropCells(machine) {
  const taken = {};
  machine.cells.forEach(function (c) { taken[c.x + ',' + c.y] = true; });
  machine.blocked.forEach(function (c) { taken[c.x + ',' + c.y] = true; });
  const list = [];
  for (let y = 0; y < machine.rows; y++) {
    for (let x = 0; x < machine.cols; x++) {
      if (!taken[x + ',' + y]) list.push({ x: x, y: y });
    }
  }
  return list;
}
