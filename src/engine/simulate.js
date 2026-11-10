// simulate(machine, options): runs one Fire through a machine and returns
// { events, total, coins, banked, fizzled, errors }.
// Pure and deterministic: no DOM, no timers, no Date, no Math.random.
// Owner: AI-2

import { CONFIG } from '../data/config.js';
import { EVT } from './eventTypes.js';
import { rotToDir } from './board.js';
import { makeRng } from '../core/rng.js';
import { getPart as defaultGetPart } from './parts/index.js';

// Lookup tables so the walk loop never builds objects just to move.
const DX = { right: 1, down: 0, left: -1, up: 0 };
const DY = { right: 0, down: 1, left: 0, up: -1 };

function isDir(dir) {
  return dir === 'right' || dir === 'down' || dir === 'left' || dir === 'up';
}

function clampValue(v) {
  if (v < 0) {
    return 0;
  }
  if (v > CONFIG.maxValue) {
    return CONFIG.maxValue;
  }
  return v;
}

function isGoodNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function safeGetPart(getPart, partId) {
  try {
    return getPart(partId);
  } catch (e) {
    return null;
  }
}

// Fill run.partAt (index y * cols + x -> part instance) and run.blockedAt.
function buildBoard(run, machine, getPart) {
  const size = run.cols * run.rows;
  run.partAt = new Array(size).fill(null);
  run.blockedAt = new Array(size).fill(false);
  const banned = {};
  const bannedList = machine.banned || [];
  for (let i = 0; i < bannedList.length; i++) {
    banned[bannedList[i]] = true;
  }
  const blocked = machine.blocked || [];
  for (let i = 0; i < blocked.length; i++) {
    const b = blocked[i];
    if (inBoard(run, b.x, b.y)) {
      run.blockedAt[b.y * run.cols + b.x] = true;
    }
  }
  run.instances = [];
  const cells = machine.cells || [];
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    if (!inBoard(run, cell.x, cell.y) || banned[cell.partId]) {
      continue;
    }
    const def = safeGetPart(getPart, cell.partId);
    if (!def || typeof def.onPass !== 'function') {
      continue;
    }
    const inst = { def: def, cell: cell, state: {}, disabled: false, boost: 1 };
    run.partAt[cell.y * run.cols + cell.x] = inst;
    run.instances.push(inst);
  }
  for (let i = 0; i < run.instances.length; i++) {
    run.instances[i].boost = computeBoost(run, run.instances[i]);
  }
}

function inBoard(run, x, y) {
  return Number.isInteger(x) && Number.isInteger(y) &&
    x >= 0 && x < run.cols && y >= 0 && y < run.rows;
}

// Product of boostFor(level) of the (up to 4) neighbours that have it.
function computeBoost(run, inst) {
  const x = inst.cell.x;
  const y = inst.cell.y;
  let boost = 1;
  boost *= boostFromCell(run, x + 1, y);
  boost *= boostFromCell(run, x - 1, y);
  boost *= boostFromCell(run, x, y + 1);
  boost *= boostFromCell(run, x, y - 1);
  return boost;
}

function boostFromCell(run, x, y) {
  if (!inBoard(run, x, y)) {
    return 1;
  }
  const other = run.partAt[y * run.cols + x];
  if (!other || typeof other.def.boostFor !== 'function') {
    return 1;
  }
  let amount = 1;
  try {
    amount = other.def.boostFor(other.cell.level);
  } catch (e) {
    return 1;
  }
  if (!isGoodNumber(amount)) {
    return 1;
  }
  return amount;
}

// ---- events (only built when run.events is an array) ----

function bank(run, spark) {
  run.total = Math.min(run.total + spark.value, CONFIG.maxValue);
  run.banked++;
  const events = run.events;
  if (events !== null) {
    events.push({
      n: events.length, type: EVT.BANK, spark: spark.id,
      value: spark.value, runningTotal: run.total
    });
  }
}

function fizzle(run, spark, x, y, reason) {
  run.fizzled++;
  const events = run.events;
  if (events !== null) {
    events.push({
      n: events.length, type: EVT.FIZZLE, spark: spark.id,
      x: x, y: y, value: spark.value, reason: reason
    });
  }
}

// ---- the ctx object that parts see (one per simulate call, reused) ----

function makeCtx(run, rng) {
  const ctx = {
    value: 0,
    dir: 'right',
    level: 1,
    rot: 0,
    boost: 1,
    state: null,
    fire: { sparkNumber: 1, bankedTotal: 0, bankedCount: 0, partsOnBoard: 0 },
    rng: rng
  };
  ctx.setValue = function (v, label) {
    setValue(run, ctx, v, label);
  };
  ctx.setDir = function (dir) {
    setDir(run, ctx, dir);
  };
  ctx.turnToFacing = function () {
    setDir(run, ctx, rotToDir(run.inst.cell.rot));
  };
  ctx.split = function (dir, value, label) {
    split(run, dir, value, label);
  };
  ctx.addCoins = function (n) {
    addCoins(run, n);
  };
  ctx.disable = function () {
    disablePart(run);
  };
  ctx.note = function (label) {
    notePart(run, label);
  };
  return ctx;
}

function labelText(label) {
  if (label === undefined || label === null) {
    return '';
  }
  return String(label);
}

function setValue(run, ctx, v, label) {
  if (!isGoodNumber(v)) {
    return;
  }
  const spark = run.spark;
  const next = clampValue(v);
  const before = spark.value;
  if (next === before) {
    return;
  }
  spark.value = next;
  ctx.value = next;
  const events = run.events;
  if (events !== null) {
    events.push({
      n: events.length, type: EVT.VALUE, spark: spark.id,
      x: run.inst.cell.x, y: run.inst.cell.y, partId: run.inst.cell.partId,
      before: before, after: next, label: labelText(label)
    });
  }
}

function setDir(run, ctx, dir) {
  if (!isDir(dir)) {
    return;
  }
  const spark = run.spark;
  const from = spark.dir;
  if (dir === from) {
    return;
  }
  spark.dir = dir;
  ctx.dir = dir;
  const events = run.events;
  if (events !== null) {
    events.push({
      n: events.length, type: EVT.TURN, spark: spark.id,
      x: run.inst.cell.x, y: run.inst.cell.y, partId: run.inst.cell.partId,
      from: from, to: dir
    });
  }
}

// A child may only be made when there is still room for the source sparks
// that have not been born yet, so the cap never starves the real sources.
function split(run, dir, value, label) {
  if (!isDir(dir) || !isGoodNumber(value)) {
    return;
  }
  const waiting = run.sparkCount - run.sourceNumber;
  if (run.created + waiting >= CONFIG.maxSparksPerFire) {
    return;
  }
  const parent = run.spark;
  run.created++;
  const child = {
    id: run.created, value: clampValue(value), dir: dir,
    x: parent.x, y: parent.y, steps: 0,
    parent: parent.id, sourceNumber: parent.sourceNumber
  };
  run.family.push(child);
  const events = run.events;
  if (events !== null) {
    events.push({
      n: events.length, type: EVT.SPLIT, spark: parent.id,
      x: run.inst.cell.x, y: run.inst.cell.y, partId: run.inst.cell.partId,
      child: child.id, dir: dir, value: child.value, label: labelText(label)
    });
  }
}

function addCoins(run, n) {
  if (!isGoodNumber(n) || n === 0) {
    return;
  }
  run.coins += n;
  const events = run.events;
  if (events !== null) {
    events.push({
      n: events.length, type: EVT.COINS, spark: run.spark.id,
      x: run.inst.cell.x, y: run.inst.cell.y, partId: run.inst.cell.partId,
      amount: n
    });
  }
}

function disablePart(run) {
  if (run.inst.disabled) {
    return;
  }
  run.inst.disabled = true;
  const events = run.events;
  if (events !== null) {
    events.push({
      n: events.length, type: EVT.DISABLE, spark: run.spark.id,
      x: run.inst.cell.x, y: run.inst.cell.y, partId: run.inst.cell.partId
    });
  }
}

function notePart(run, label) {
  const events = run.events;
  if (events !== null) {
    events.push({
      n: events.length, type: EVT.STATE, spark: run.spark.id,
      x: run.inst.cell.x, y: run.inst.cell.y, partId: run.inst.cell.partId,
      label: labelText(label)
    });
  }
}

// ---- walking ----

function callPart(run, inst, spark) {
  const ctx = run.ctx;
  ctx.value = spark.value;
  ctx.dir = spark.dir;
  ctx.level = typeof inst.cell.level === 'number' ? inst.cell.level : 1;
  ctx.rot = typeof inst.cell.rot === 'number' ? inst.cell.rot : 0;
  ctx.boost = inst.boost;
  ctx.state = inst.state;
  ctx.fire.sparkNumber = spark.sourceNumber;
  ctx.fire.bankedTotal = run.total;
  ctx.fire.bankedCount = run.banked;
  run.inst = inst;
  run.spark = spark;
  try {
    inst.def.onPass(ctx);
  } catch (e) {
    // One bad part must never crash the game: skip it and carry on.
    run.errors++;
  }
}

// Moves one cell in the spark's current direction.
// Returns true when the spark is still alive after the move.
function moveSpark(run, spark) {
  const prevX = spark.x;
  const prevY = spark.y;
  spark.x += DX[spark.dir];
  spark.y += DY[spark.dir];
  spark.steps++;
  if (spark.x === run.cols) {
    bank(run, spark);
    return false;
  }
  if (spark.x < 0 || spark.y < 0 || spark.y >= run.rows) {
    fizzle(run, spark, prevX, prevY, 'edge');
    return false;
  }
  if (spark.steps > CONFIG.maxSteps) {
    fizzle(run, spark, spark.x, spark.y, 'steps');
    return false;
  }
  return true;
}

function walkSpark(run, spark) {
  const events = run.events;
  if (events !== null) {
    events.push({
      n: events.length, type: EVT.SPAWN, spark: spark.id,
      x: spark.x, y: spark.y, dir: spark.dir, value: spark.value, parent: spark.parent
    });
  }
  let alive = true;
  if (spark.parent !== 0) {
    // A child starts by moving away; it does not trigger its birth cell again.
    alive = moveSpark(run, spark);
  } else if (spark.y < 0 || spark.y >= run.rows) {
    fizzle(run, spark, spark.x, spark.y, 'edge');
    alive = false;
  }
  while (alive) {
    if (events !== null) {
      events.push({
        n: events.length, type: EVT.ENTER, spark: spark.id,
        x: spark.x, y: spark.y, dir: spark.dir, value: spark.value
      });
    }
    const index = spark.y * run.cols + spark.x;
    if (run.blockedAt[index]) {
      if (events !== null) {
        events.push({ n: events.length, type: EVT.BLOCKED, spark: spark.id, x: spark.x, y: spark.y });
      }
      fizzle(run, spark, spark.x, spark.y, 'blocked');
      return;
    }
    const inst = run.partAt[index];
    if (inst !== null && !inst.disabled) {
      callPart(run, inst, spark);
    }
    alive = moveSpark(run, spark);
  }
}

export function simulate(machine, options) {
  const opts = options || {};
  const getPart = opts.getPart || defaultGetPart;
  const record = opts.recordEvents !== false;
  const cols = Number.isInteger(machine.cols) && machine.cols > 0 ? machine.cols : CONFIG.cols;
  const rows = Number.isInteger(machine.rows) && machine.rows > 0 ? machine.rows : CONFIG.rows;
  const run = {
    cols: cols, rows: rows,
    sparkCount: Math.max(0, Math.floor(machine.sparkCount)) || 0,
    events: record ? [] : null,
    total: 0, coins: 0, banked: 0, fizzled: 0, errors: 0,
    created: 0, sourceNumber: 0,
    family: null, spark: null, inst: null, ctx: null,
    partAt: null, blockedAt: null, instances: null
  };
  // One rng per simulate call, so the draw order is always the same.
  run.ctx = makeCtx(run, makeRng(machine.seed));
  buildBoard(run, machine, getPart);
  run.ctx.fire.partsOnBoard = run.instances.length;
  const startValue = isGoodNumber(machine.startValue) ? clampValue(machine.startValue) : CONFIG.startValue;
  while (run.sourceNumber < run.sparkCount && run.created < CONFIG.maxSparksPerFire) {
    run.sourceNumber++;
    run.created++;
    const source = {
      id: run.created, value: startValue, dir: 'right',
      x: 0, y: machine.sourceRow, steps: 0, parent: 0, sourceNumber: run.sourceNumber
    };
    // First in, first out: a spark, then its children in the order they were made.
    run.family = [source];
    for (let head = 0; head < run.family.length; head++) {
      walkSpark(run, run.family[head]);
    }
  }
  const events = run.events;
  if (events !== null) {
    events.push({ n: events.length, type: EVT.END, spark: 0, total: run.total, coins: run.coins });
  }
  return {
    events: events === null ? [] : events,
    total: run.total,
    coins: run.coins,
    banked: run.banked,
    fizzled: run.fizzled,
    errors: run.errors
  };
}
