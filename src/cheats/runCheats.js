// Cheats that change the live run. Each function changes the run it is given and returns
// { ok, msg }. A cheat that works marks the run as cheated (a cheated run earns no rewards).
// A refused cheat changes nothing. No DOM in this file, so tests can run it.
// Owner: AI-2

import { allPartIds, getPart } from '../engine/parts/index.js';
import { removePart } from '../engine/board.js';
import { startNextShift } from '../run/runState.js';
import { applyMerges } from '../run/merge.js';
import { benchSizeOf, firesPerShiftOf, cleanBonuses } from '../run/runRules.js';
import { SHIFT_RULES } from '../data/shifts.js';

const MIN_BOARD = 3;
const MAX_BOARD = 8;
const MAX_BENCH = 12;
const MAX_SPARKS = 8;
const MAX_COINS = 1e9;

function done(run, msg) {
  run.cheated = true;
  return { ok: true, msg: msg || 'Done' };
}

function refuse(msg) {
  return { ok: false, msg: msg };
}

function clamp(n, low, high) {
  return Math.min(high, Math.max(low, n));
}

function isGoodNumber(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

// Makes sure the bench is big enough for what is on it (raises the bench bonus when not).
function makeBenchFit(run) {
  run.bonuses = cleanBonuses(run.bonuses);
  const missing = run.bench.length - benchSizeOf(run);
  if (missing > 0) {
    run.bonuses.benchSize += missing;
  }
}

// ---------- coins and fires ----------

export function addCoins(run, amount) {
  if (!isGoodNumber(amount)) {
    return refuse('Not a number');
  }
  run.coins = clamp(Math.floor(run.coins + amount), 0, MAX_COINS);
  return done(run);
}

export function setCoins(run, amount) {
  if (!isGoodNumber(amount) || amount < 0) {
    return refuse('Not a good number');
  }
  run.coins = Math.floor(amount);
  return done(run);
}

export function refillFires(run) {
  if (run.phase !== 'build') {
    return refuse('Only while building');
  }
  run.firesLeft = firesPerShiftOf(run);
  return done(run);
}

export function extraFire(run) {
  if (run.phase !== 'build') {
    return refuse('Only while building');
  }
  run.firesLeft = run.firesLeft + 1;
  return done(run);
}

// ---------- target, shifts, ending the run ----------

export function setTargetMultiplier(run, multiplier) {
  if (!isGoodNumber(multiplier) || multiplier <= 0) {
    return refuse('Not a good number');
  }
  run.targetMultiplier = multiplier;
  return done(run);
}

// Goes through the real shift start, so twists, offers and counters are set up properly.
export function skipToShift(run, shift) {
  if (!Number.isInteger(shift) || shift < 1 || shift > SHIFT_RULES.shiftsPerRun) {
    return refuse('Shift must be 1 to ' + SHIFT_RULES.shiftsPerRun);
  }
  run.phase = 'shop';
  run.shift = shift - 1;
  const out = startNextShift(run);
  if (!out.ok) {
    return refuse('Could not start the shift');
  }
  return done(run, 'Now on shift ' + shift);
}

export function winRun(run) {
  run.phase = 'won';
  return done(run, 'Run won');
}

export function loseRun(run) {
  run.phase = 'lost';
  return done(run, 'Run lost');
}

// ---------- the board ----------

function isInside(machine, x, y) {
  return x < machine.cols && y < machine.rows;
}

// Parts that no longer fit go back to the bench.
function sendOutsidePartsToBench(run) {
  const machine = run.machine;
  const cells = machine.cells.slice();
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (!isInside(machine, c.x, c.y)) {
      removePart(machine, c.x, c.y);
      run.bench.push({ partId: c.partId, level: c.level });
    }
  }
}

export function resizeBoard(run, deltaCols, deltaRows) {
  const machine = run.machine;
  const cols = clamp(machine.cols + deltaCols, MIN_BOARD, MAX_BOARD);
  const rows = clamp(machine.rows + deltaRows, MIN_BOARD, MAX_BOARD);
  if (cols === machine.cols && rows === machine.rows) {
    return refuse('Board is at its limit (' + MIN_BOARD + ' to ' + MAX_BOARD + ')');
  }
  machine.cols = cols;
  machine.rows = rows;
  if (machine.sourceRow >= rows) {
    machine.sourceRow = rows - 1;
  }
  sendOutsidePartsToBench(run);
  machine.blocked = machine.blocked.filter(function (b) {
    return isInside(machine, b.x, b.y);
  });
  makeBenchFit(run);
  return done(run, 'Board is ' + cols + ' x ' + rows);
}

export function setSparkCount(run, count) {
  if (!Number.isInteger(count) || count < 1 || count > MAX_SPARKS) {
    return refuse('Spark count must be 1 to ' + MAX_SPARKS);
  }
  run.machine.sparkCount = count;
  return done(run, count + ' sparks (until the next shift starts)');
}

export function setStartValue(run, value) {
  if (!isGoodNumber(value) || value <= 0) {
    return refuse('Not a good number');
  }
  run.machine.startValue = value;
  return done(run, 'Start value ' + value + ' (until the next shift starts)');
}

export function clearTwists(run) {
  run.machine.blocked = [];
  run.machine.banned = [];
  run.machine.flags = {};
  return done(run, 'Twists cleared');
}

// ---------- parts ----------

export function giveBenchPart(run, partId, level) {
  if (allPartIds().indexOf(partId) === -1) {
    return refuse('Unknown part');
  }
  if (!Number.isInteger(level) || level < 1 || level > 3) {
    return refuse('Level must be 1 to 3');
  }
  if (run.bench.length >= benchSizeOf(run)) {
    return refuse('Bench is full: add a bench slot first');
  }
  run.bench.push({ partId: partId, level: level });
  applyMerges(run);
  return done(run, 'Gave ' + partId + ' level ' + level);
}

export function addBenchSlot(run) {
  run.bonuses = cleanBonuses(run.bonuses);
  if (benchSizeOf(run) >= MAX_BENCH) {
    return refuse('Bench is at its limit (' + MAX_BENCH + ')');
  }
  run.bonuses.benchSize += 1;
  return done(run, 'Bench has ' + benchSizeOf(run) + ' slots');
}

function topLevelOf(partId) {
  const part = getPart(partId);
  return part && part.maxLevel ? Math.min(3, part.maxLevel) : 3;
}

export function allPartsToLevel3(run) {
  const cells = run.machine.cells;
  for (let i = 0; i < cells.length; i++) {
    cells[i].level = topLevelOf(cells[i].partId);
  }
  for (let j = 0; j < run.bench.length; j++) {
    run.bench[j].level = topLevelOf(run.bench[j].partId);
  }
  return done(run, 'All parts at top level');
}

export function allPartsToBench(run) {
  const cells = run.machine.cells.slice();
  for (let i = 0; i < cells.length; i++) {
    removePart(run.machine, cells[i].x, cells[i].y);
    run.bench.push({ partId: cells[i].partId, level: cells[i].level });
  }
  makeBenchFit(run);
  return done(run, 'Board cleared');
}
