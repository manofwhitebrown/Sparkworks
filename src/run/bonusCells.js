// Makes the bonus tiles (floor tiles that give +N or xN) for one shift.
// Tiles go on EMPTY cells that are not on the source row, so the player must steer
// the spark to get them. The same run seed gives the same tiles.
// Owner: AI-4

import { BONUS_CELL_RULES } from '../data/shifts.js';
import { nextRng } from './runRng.js';

// How many tiles a shift gets.
export function bonusCellCount(shift) {
  if (shift < BONUS_CELL_RULES.firstShift) {
    return 0;
  }
  if (shift >= BONUS_CELL_RULES.secondTileShift) {
    return 2;
  }
  return 1;
}

function isBlocked(machine, x, y) {
  const blocked = machine.blocked || [];
  for (let i = 0; i < blocked.length; i++) {
    if (blocked[i].x === x && blocked[i].y === y) {
      return true;
    }
  }
  return false;
}

function hasPart(machine, x, y) {
  for (let i = 0; i < machine.cells.length; i++) {
    if (machine.cells[i].x === x && machine.cells[i].y === y) {
      return true;
    }
  }
  return false;
}

// Empty, not blocked, not on the source row. Always in the same order (row by row).
function freeCells(machine) {
  const list = [];
  for (let y = 0; y < machine.rows; y++) {
    for (let x = 0; x < machine.cols; x++) {
      if (y !== machine.sourceRow && !isBlocked(machine, x, y) && !hasPart(machine, x, y)) {
        list.push({ x: x, y: y });
      }
    }
  }
  return list;
}

// One tile. Both random numbers are always drawn, so the order of draws never changes.
function makeTile(cell, shift, rng) {
  const kindRoll = rng();
  const amountRoll = rng();
  const later = shift >= BONUS_CELL_RULES.laterShift;
  if (later && kindRoll < BONUS_CELL_RULES.multChance) {
    return { x: cell.x, y: cell.y, kind: 'mult', amount: BONUS_CELL_RULES.multAmount };
  }
  const min = later ? BONUS_CELL_RULES.laterAddMin : BONUS_CELL_RULES.addMin;
  const max = later ? BONUS_CELL_RULES.laterAddMax : BONUS_CELL_RULES.addMax;
  const amount = min + Math.floor(amountRoll * (max - min + 1));
  return { x: cell.x, y: cell.y, kind: 'add', amount: amount };
}

// The tiles for the current shift of `run`. Uses one step of the run rng only when there are tiles.
export function makeBonusCells(run) {
  const count = bonusCellCount(run.shift);
  if (count === 0) {
    return [];
  }
  const rng = nextRng(run);
  const free = freeCells(run.machine);
  const tiles = [];
  for (let t = 0; t < count && free.length > 0; t++) {
    const index = Math.floor(rng() * free.length);
    const cell = free.splice(index, 1)[0];
    tiles.push(makeTile(cell, run.shift, rng));
  }
  return tiles;
}
