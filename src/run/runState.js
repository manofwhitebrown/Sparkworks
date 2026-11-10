// The life of one run: start a run, build, fire, shop, next shift.
// A run is plain JSON. Every function changes the run and returns a small result object.
// Owner: AI-4

import { simulate as realSimulate } from '../engine/simulate.js';
import { getPart as realGetPart } from '../engine/parts/index.js';
import { applyTwists as realApplyTwists } from '../engine/twists.js';
import { makeMachine, cloneMachine, removePart } from '../engine/board.js';
import { SHIFT_RULES } from '../data/shifts.js';
import { getInventor } from '../data/inventors.js';
import { getVoltage } from '../data/voltage.js';
import { nextRng, nextMachineSeed } from './runRng.js';
import { applyMerges } from './merge.js';
import { makeOffers } from './shop.js';
import { returnToBench as returnToBenchAction } from './boardActions.js';
import {
  cleanBonuses, benchSizeOf, firesPerShiftOf, baseSparkFields, targetFor, sellValueOf
} from './runRules.js';

export { placeFromBench, moveOnBoard, rotatePart } from './boardActions.js';

function pickDeps(deps) {
  const d = deps || {};
  return {
    simulate: d.simulate || realSimulate,
    getPart: d.getPart || realGetPart,
    applyTwists: d.applyTwists || realApplyTwists,
    custom: deps || null
  };
}

export function getTarget(run) {
  return targetFor(run.shift, run.voltage);
}

export function returnToBench(run, x, y) {
  return returnToBenchAction(run, x, y, benchSizeOf(run));
}

// Parts standing on blocked cells go back to the bench; a full bench sells them.
function clearBlockedParts(run, d) {
  const moved = [];
  const sold = [];
  const cells = run.machine.cells.slice();
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    if (!isBlocked(run.machine, c.x, c.y)) {
      continue;
    }
    removePart(run.machine, c.x, c.y);
    if (run.bench.length < benchSizeOf(run)) {
      run.bench.push({ partId: c.partId, level: c.level });
      moved.push({ partId: c.partId, level: c.level });
    } else {
      const coins = sellValueOf(d.getPart(c.partId), c.level);
      run.coins = run.coins + coins;
      sold.push({ partId: c.partId, level: c.level, coins: coins });
    }
  }
  return { movedToBench: moved, sold: sold };
}

function isBlocked(machine, x, y) {
  for (let i = 0; i < machine.blocked.length; i++) {
    if (machine.blocked[i].x === x && machine.blocked[i].y === y) {
      return true;
    }
  }
  return false;
}

// Shared by newRun and startNextShift. Sets up the machine and counters of the current shift.
function startShift(run, d) {
  run.phase = 'build';
  run.shiftTotal = 0;
  run.pendingCoins = 0;
  run.rerollsThisShift = 0;
  run.firesLeft = firesPerShiftOf(run);
  run.lastFire = null;
  run.offers = [];
  const base = baseSparkFields(run.inventorId);
  run.machine.sparkCount = base.sparkCount;
  run.machine.startValue = base.startValue;
  run.machine.blocked = [];
  run.machine.banned = [];
  run.machine.flags = {};
  const twistIds = getVoltage(run.voltage).twistsByShift[run.shift] || [];
  if (twistIds.length > 0) {
    d.applyTwists(run.machine, twistIds, nextRng(run));
  }
  run.machine.seed = nextMachineSeed(run);
  return clearBlockedParts(run, d);
}

export function newRun(options, deps) {
  const d = pickDeps(deps);
  const o = options || {};
  const inventor = getInventor(o.inventorId) || getInventor('tinkerbot');
  const bonuses = cleanBonuses(o.bonuses);
  const bench = [];
  for (let i = 0; i < inventor.startParts.length; i++) {
    bench.push({ partId: inventor.startParts[i], level: 1 });
  }
  const run = {
    v: 1,
    seed: o.seed === undefined ? 1 : o.seed,
    inventorId: inventor.id,
    voltage: o.voltage || 1,
    daily: o.daily || false,
    shift: 1,
    phase: 'build',
    coins: inventor.startCoins + bonuses.startCoins,
    rerollsThisShift: 0,
    firesLeft: 0,
    shiftTotal: 0,
    pendingCoins: 0,
    bestFire: 0,
    machine: makeMachine(),
    bench: bench,
    offers: [],
    poolIds: (o.poolIds || []).slice(),
    bonuses: bonuses,
    lastFire: null,
    history: [],
    rngState: 0
  };
  startShift(run, d);
  applyMerges(run, d.custom);
  return run;
}

// Coins for clearing a shift: base + unused Fires + overkill + coins from parts.
function shiftPayout(run, target) {
  const unused = SHIFT_RULES.unusedFireCoins * run.firesLeft;
  const overRatio = (run.shiftTotal - target) / (target * SHIFT_RULES.overkillStepRatio);
  const overkill = Math.min(SHIFT_RULES.overkillMaxCoins, Math.max(0, Math.floor(overRatio)));
  return SHIFT_RULES.baseShiftPayout + unused + overkill + run.pendingCoins;
}

export function fire(run, deps) {
  const d = pickDeps(deps);
  if (run.phase !== 'build') {
    return { ok: false, reason: 'wrong_phase' };
  }
  if (run.firesLeft <= 0) {
    return { ok: false, reason: 'no_fires_left' };
  }
  const machine = cloneMachine(run.machine);
  machine.seed = nextMachineSeed(run);
  const result = d.simulate(machine, d.custom && d.custom.getPart ? { getPart: d.custom.getPart } : undefined);
  const target = getTarget(run);
  run.shiftTotal = run.shiftTotal + result.total;
  run.pendingCoins = run.pendingCoins + (result.coins || 0);
  run.firesLeft = run.firesLeft - 1;
  if (result.total > run.bestFire) {
    run.bestFire = result.total;
  }
  const passed = run.shiftTotal >= target;
  let coinsEarned = 0;
  if (passed) {
    coinsEarned = shiftPayout(run, target);
    run.coins = run.coins + coinsEarned;
  }
  run.lastFire = { total: result.total, shiftTotal: run.shiftTotal, target: target, passed: passed, coinsEarned: coinsEarned };
  endShiftIfNeeded(run, passed, target, d);
  const runOver = run.phase === 'won' || run.phase === 'lost';
  return { ok: true, result: result, passed: passed, shiftCleared: passed, runOver: runOver };
}

function endShiftIfNeeded(run, passed, target, d) {
  if (!passed && run.firesLeft > 0) {
    return;
  }
  run.history.push({ shift: run.shift, total: run.shiftTotal, target: target });
  if (!passed) {
    run.phase = 'lost';
  } else if (run.shift >= SHIFT_RULES.shiftsPerRun) {
    run.phase = 'won';
  } else {
    run.phase = 'shop';
    makeOffers(run, d.custom);
  }
}

export function startNextShift(run, deps) {
  const d = pickDeps(deps);
  if (run.phase !== 'shop') {
    return { ok: false, reason: 'wrong_phase' };
  }
  run.shift = run.shift + 1;
  const sent = startShift(run, d);
  return { ok: true, shift: run.shift, movedToBench: sent.movedToBench, sold: sent.sold };
}

export function runSummary(run) {
  let cleared = 0;
  let banked = 0;
  for (let i = 0; i < run.history.length; i++) {
    banked = banked + run.history[i].total;
    if (run.history[i].total >= run.history[i].target) {
      cleared = cleared + 1;
    }
  }
  if (run.phase === 'build') {
    banked = banked + run.shiftTotal;
  }
  const owned = [];
  for (let i = 0; i < run.machine.cells.length; i++) {
    owned.push(run.machine.cells[i].partId);
  }
  for (let i = 0; i < run.bench.length; i++) {
    owned.push(run.bench[i].partId);
  }
  return {
    won: run.phase === 'won',
    shiftReached: run.shift,
    shiftsCleared: cleared,
    voltage: run.voltage,
    inventorId: run.inventorId,
    daily: run.daily,
    bestFire: run.bestFire,
    totalBanked: banked,
    partsOwned: owned,
    coinsLeft: run.coins
  };
}
