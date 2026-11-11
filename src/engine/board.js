// Small helpers for directions and for building / editing a machine.
// placePart and removePart MUTATE the machine they are given.
// Owner: AI-2

import { CONFIG } from '../data/config.js';

export const DIRS = ['right', 'down', 'left', 'up'];

// rot 0..3 -> direction name (number of clockwise quarter turns from 'right')
export function rotToDir(rot) {
  const index = ((rot % 4) + 4) % 4;
  return DIRS[index];
}

// direction name -> rot 0..3 (unknown names fall back to 0)
export function dirToRot(dir) {
  const index = DIRS.indexOf(dir);
  if (index < 0) {
    return 0;
  }
  return index;
}

// The cell one step away from (x, y) in the given direction.
export function stepFrom(x, y, dir) {
  if (dir === 'right') {
    return { x: x + 1, y: y };
  }
  if (dir === 'down') {
    return { x: x, y: y + 1 };
  }
  if (dir === 'left') {
    return { x: x - 1, y: y };
  }
  if (dir === 'up') {
    return { x: x, y: y - 1 };
  }
  return { x: x, y: y };
}

// A fresh machine with the CONFIG defaults. Overrides win over defaults.
// The lists are always new arrays so two machines never share them.
export function makeMachine(overrides) {
  const machine = {
    cols: CONFIG.cols,
    rows: CONFIG.rows,
    sourceRow: CONFIG.sourceRow,
    sparkCount: CONFIG.sparkCount,
    startValue: CONFIG.startValue,
    cells: [],
    blocked: [],
    banned: [],
    flags: {},
    seed: 1
  };
  if (overrides) {
    const keys = Object.keys(overrides);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      machine[key] = overrides[key];
    }
  }
  if (!Array.isArray(machine.cells)) {
    machine.cells = [];
  }
  if (!Array.isArray(machine.blocked)) {
    machine.blocked = [];
  }
  if (!Array.isArray(machine.banned)) {
    machine.banned = [];
  }
  if (machine.flags === null || typeof machine.flags !== 'object') {
    machine.flags = {};
  }
  return machine;
}

// Deep copy by hand. A machine is plain data, so this is enough
// and it works on very old WebViews (no structuredClone).
export function cloneMachine(machine) {
  const copy = {};
  const keys = Object.keys(machine);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    copy[key] = machine[key];
  }
  copy.cells = [];
  const cells = machine.cells || [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    copy.cells.push({ x: c.x, y: c.y, partId: c.partId, level: c.level, rot: c.rot });
  }
  copy.blocked = [];
  const blocked = machine.blocked || [];
  for (let i = 0; i < blocked.length; i++) {
    copy.blocked.push({ x: blocked[i].x, y: blocked[i].y });
  }
  copy.banned = (machine.banned || []).slice();
  if (Array.isArray(machine.bonusCells)) {
    copy.bonusCells = [];
    for (let i = 0; i < machine.bonusCells.length; i++) {
      const b = machine.bonusCells[i];
      copy.bonusCells.push({ x: b.x, y: b.y, kind: b.kind, amount: b.amount });
    }
  }
  copy.flags = copyFlags(machine.flags);
  return copy;
}

// Flags are plain data; copy one level deep (arrays and objects inside too).
function copyFlags(flags) {
  const out = {};
  if (!flags) {
    return out;
  }
  const keys = Object.keys(flags);
  for (let i = 0; i < keys.length; i++) {
    out[keys[i]] = copyPlain(flags[keys[i]]);
  }
  return out;
}

function copyPlain(value) {
  if (Array.isArray(value)) {
    const list = [];
    for (let i = 0; i < value.length; i++) {
      list.push(copyPlain(value[i]));
    }
    return list;
  }
  if (value !== null && typeof value === 'object') {
    const obj = {};
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      obj[keys[i]] = copyPlain(value[keys[i]]);
    }
    return obj;
  }
  return value;
}

// The part cell at (x, y), or null when the cell is empty.
export function getCellAt(machine, x, y) {
  const cells = machine.cells;
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].x === x && cells[i].y === y) {
      return cells[i];
    }
  }
  return null;
}

// Put a part on a cell. An occupied cell gets its part replaced.
export function placePart(machine, x, y, partId, level, rot) {
  const cell = {
    x: x,
    y: y,
    partId: partId,
    level: level === undefined ? 1 : level,
    rot: rot === undefined ? 0 : rot
  };
  for (let i = 0; i < machine.cells.length; i++) {
    if (machine.cells[i].x === x && machine.cells[i].y === y) {
      machine.cells[i] = cell;
      return;
    }
  }
  machine.cells.push(cell);
}

// Take the part off a cell (does nothing when the cell is empty).
export function removePart(machine, x, y) {
  for (let i = 0; i < machine.cells.length; i++) {
    if (machine.cells[i].x === x && machine.cells[i].y === y) {
      machine.cells.splice(i, 1);
      return;
    }
  }
}

function isPositiveInt(n) {
  return Number.isInteger(n) && n > 0;
}

// Returns a list of plain-English problems. Empty list = machine is fine.
export function validateMachine(machine) {
  const problems = [];
  if (!machine || typeof machine !== 'object') {
    problems.push('The machine is missing.');
    return problems;
  }
  if (!isPositiveInt(machine.cols)) {
    problems.push('cols must be a positive whole number.');
  }
  if (!isPositiveInt(machine.rows)) {
    problems.push('rows must be a positive whole number.');
  }
  if (!Number.isInteger(machine.sourceRow) || machine.sourceRow < 0 || machine.sourceRow >= machine.rows) {
    problems.push('sourceRow must be a row inside the board.');
  }
  if (!Number.isInteger(machine.sparkCount) || machine.sparkCount < 1) {
    problems.push('sparkCount must be at least 1.');
  }
  const cells = Array.isArray(machine.cells) ? machine.cells : [];
  const seen = {};
  for (let i = 0; i < cells.length; i++) {
    checkCell(machine, cells[i], i, seen, problems);
  }
  if (machine.bonusCells !== undefined) {
    checkBonusCells(machine, problems);
  }
  return problems;
}

// bonusCells is optional. Each entry needs a cell inside the board, a kind
// ('add' or 'mult') and an amount that is a finite number.
function checkBonusCells(machine, problems) {
  if (!Array.isArray(machine.bonusCells)) {
    problems.push('bonusCells must be a list.');
    return;
  }
  const seen = {};
  for (let i = 0; i < machine.bonusCells.length; i++) {
    const b = machine.bonusCells[i];
    const name = 'Bonus tile ' + (i + 1);
    const inside = b !== null && typeof b === 'object' &&
      Number.isInteger(b.x) && Number.isInteger(b.y) &&
      b.x >= 0 && b.x < machine.cols && b.y >= 0 && b.y < machine.rows;
    if (!inside) {
      problems.push(name + ' is outside the board.');
      continue;
    }
    if (seen[b.x + ',' + b.y]) {
      problems.push('Two bonus tiles share the cell ' + b.x + ',' + b.y + '.');
    }
    seen[b.x + ',' + b.y] = true;
    if (b.kind !== 'add' && b.kind !== 'mult') {
      problems.push(name + ' has a kind that is not add or mult.');
    }
    if (typeof b.amount !== 'number' || !Number.isFinite(b.amount)) {
      problems.push(name + ' has an amount that is not a number.');
    }
  }
}

function checkCell(machine, cell, index, seen, problems) {
  const name = 'Part ' + (index + 1);
  const inside = Number.isInteger(cell.x) && Number.isInteger(cell.y) &&
    cell.x >= 0 && cell.x < machine.cols && cell.y >= 0 && cell.y < machine.rows;
  if (!inside) {
    problems.push(name + ' is outside the board.');
  } else {
    const key = cell.x + ',' + cell.y;
    if (seen[key]) {
      problems.push('Two parts share the cell ' + key + '.');
    }
    seen[key] = true;
  }
  if (!Number.isInteger(cell.rot) || cell.rot < 0 || cell.rot > 3) {
    problems.push(name + ' has a rot that is not 0, 1, 2 or 3.');
  }
  if (!Number.isInteger(cell.level) || cell.level < 1 || cell.level > 3) {
    problems.push(name + ' has a level that is not 1, 2 or 3.');
  }
  if (typeof cell.partId !== 'string') {
    problems.push(name + ' has a partId that is not a string.');
  }
}
