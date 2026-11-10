// Board actions: place, move, rotate, return to bench. They only work in the 'build' phase.
// Each one changes the run and returns { ok: true } or { ok: false, reason }.
// Owner: AI-4

import { getCellAt, placePart, removePart } from '../engine/board.js';

function insideBoard(machine, x, y) {
  return Number.isInteger(x) && Number.isInteger(y) &&
    x >= 0 && y >= 0 && x < machine.cols && y < machine.rows;
}

function isBlockedCell(machine, x, y) {
  for (let i = 0; i < machine.blocked.length; i++) {
    if (machine.blocked[i].x === x && machine.blocked[i].y === y) {
      return true;
    }
  }
  return false;
}

// Keeps a rotation in 0..3 (a missing rotation means 0).
function cleanRot(rot) {
  const n = rot === undefined || rot === null ? 0 : rot;
  return ((n % 4) + 4) % 4;
}

// Checks that a cell can be used. Returns a reason text, or null when it is fine.
function cellProblem(machine, x, y) {
  if (!insideBoard(machine, x, y)) {
    return 'outside_board';
  }
  if (isBlockedCell(machine, x, y)) {
    return 'blocked_cell';
  }
  return null;
}

export function placeFromBench(run, benchIndex, x, y, rot) {
  if (run.phase !== 'build') {
    return { ok: false, reason: 'wrong_phase' };
  }
  const item = run.bench[benchIndex];
  if (!item) {
    return { ok: false, reason: 'no_such_bench_part' };
  }
  const problem = cellProblem(run.machine, x, y);
  if (problem) {
    return { ok: false, reason: problem };
  }
  if (getCellAt(run.machine, x, y)) {
    return { ok: false, reason: 'cell_occupied' };
  }
  run.bench.splice(benchIndex, 1);
  placePart(run.machine, x, y, item.partId, item.level, cleanRot(rot));
  return { ok: true };
}

export function moveOnBoard(run, fromX, fromY, toX, toY) {
  if (run.phase !== 'build') {
    return { ok: false, reason: 'wrong_phase' };
  }
  const from = getCellAt(run.machine, fromX, fromY);
  if (!from) {
    return { ok: false, reason: 'no_part_there' };
  }
  const problem = cellProblem(run.machine, toX, toY);
  if (problem) {
    return { ok: false, reason: problem };
  }
  if (fromX === toX && fromY === toY) {
    return { ok: true };
  }
  const target = getCellAt(run.machine, toX, toY);
  // Copy first, because placePart replaces the cell objects.
  const moving = { partId: from.partId, level: from.level, rot: from.rot };
  if (target) {
    const other = { partId: target.partId, level: target.level, rot: target.rot };
    placePart(run.machine, fromX, fromY, other.partId, other.level, other.rot);
  } else {
    removePart(run.machine, fromX, fromY);
  }
  placePart(run.machine, toX, toY, moving.partId, moving.level, moving.rot);
  return { ok: true };
}

export function rotatePart(run, x, y) {
  if (run.phase !== 'build') {
    return { ok: false, reason: 'wrong_phase' };
  }
  const cell = getCellAt(run.machine, x, y);
  if (!cell) {
    return { ok: false, reason: 'no_part_there' };
  }
  cell.rot = cleanRot(cell.rot + 1);
  return { ok: true };
}

// benchSize is passed in by runState so this file does not need the run rules.
export function returnToBench(run, x, y, benchSize) {
  if (run.phase !== 'build') {
    return { ok: false, reason: 'wrong_phase' };
  }
  const cell = getCellAt(run.machine, x, y);
  if (!cell) {
    return { ok: false, reason: 'no_part_there' };
  }
  if (run.bench.length >= benchSize) {
    return { ok: false, reason: 'bench_full' };
  }
  run.bench.push({ partId: cell.partId, level: cell.level });
  removePart(run.machine, x, y);
  return { ok: true };
}
