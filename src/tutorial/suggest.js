// Hint helper: tries every bench part on every empty cell (and every rotation for parts that
// point somewhere) and returns the placement that gives the biggest Fire total.
// Pure: it works on a copy of the machine and never changes the run.
// Owner: AI-8

import { cloneMachine, placePart, removePart, getCellAt } from '../engine/board.js';
import { simulate as realSimulate } from '../engine/simulate.js';
import { getPart as realGetPart } from '../engine/parts/index.js';

function isBlocked(machine, x, y) {
  for (let i = 0; i < machine.blocked.length; i++) {
    if (machine.blocked[i].x === x && machine.blocked[i].y === y) {
      return true;
    }
  }
  return false;
}

// Empty cells, the ones on the source row first, then the rest by distance to the source row.
// Looking at the likely cells first means ties are won by the most natural placement.
function emptyCells(machine) {
  const list = [];
  for (let y = 0; y < machine.rows; y++) {
    for (let x = 0; x < machine.cols; x++) {
      if (!getCellAt(machine, x, y) && !isBlocked(machine, x, y)) {
        list.push({ x: x, y: y, far: Math.abs(y - machine.sourceRow) });
      }
    }
  }
  list.sort(function byRow(a, b) {
    return a.far !== b.far ? a.far - b.far : a.x - b.x;
  });
  return list;
}

function totalOf(machine, simulate) {
  const result = simulate(machine, { recordEvents: false });
  return result && typeof result.total === 'number' ? result.total : 0;
}

// Returns { partIndex, x, y, rot } or null. deps (for tests): { simulate, getPart }.
export function suggestPlacement(run, deps) {
  const d = deps || {};
  const simulate = d.simulate || realSimulate;
  const getPart = d.getPart || realGetPart;
  if (!run || !run.machine || !run.bench || run.bench.length === 0) {
    return null;
  }
  const machine = cloneMachine(run.machine);
  const startTotal = totalOf(machine, simulate);
  const cells = emptyCells(machine);
  let best = null;
  let bestTotal = startTotal;
  for (let i = 0; i < run.bench.length; i++) {
    const item = run.bench[i];
    const part = getPart(item.partId);
    const turns = part && part.directional ? 4 : 1;
    for (let c = 0; c < cells.length; c++) {
      for (let rot = 0; rot < turns; rot++) {
        placePart(machine, cells[c].x, cells[c].y, item.partId, item.level, rot);
        const total = totalOf(machine, simulate);
        removePart(machine, cells[c].x, cells[c].y);
        // Strictly better only: the first of equal answers (closest to the line) wins.
        if (total > bestTotal || (best === null && total >= startTotal && total > 0)) {
          best = { partIndex: i, x: cells[c].x, y: cells[c].y, rot: rot };
          bestTotal = total;
        }
      }
    }
  }
  return best;
}
