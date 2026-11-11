// Plays one whole run with the real run functions and returns a result record.
// All modules come in through `api` so tests can pass fakes and the CLI passes the real ones.
// Owner: AI-8

import { ownedParts, randomLayout, hillClimb, applyLayout, layoutKey, boardKey } from './layouts.js';
import { doShopping } from './shopBot.js';

function machineFor(run, layout, api) {
  const machine = api.cloneMachine(run.machine);
  machine.cells = [];
  for (let i = 0; i < layout.length; i++) {
    const p = layout[i];
    api.placePart(machine, p.x, p.y, p.partId, p.level, p.rot);
  }
  return machine;
}

function scoreLayout(run, layout, api) {
  const machine = machineFor(run, layout, api);
  return api.simulate(machine, { recordEvents: false }).total;
}

// Count parts that do nothing: remove one part, and if the total stays the same it is "dead".
function recordDeadParts(run, layout, api, stats) {
  const base = scoreLayout(run, layout, api);
  for (let i = 0; i < layout.length; i++) {
    const id = layout[i].partId;
    stats.onBoard[id] = (stats.onBoard[id] || 0) + 1;
    const without = layout.slice(0, i).concat(layout.slice(i + 1));
    if (scoreLayout(run, without, api) === base) {
      stats.dead[id] = (stats.dead[id] || 0) + 1;
    }
  }
}

// Try random layouts, keep the best. In smart mode the best one then gets hill climbing.
function buildBoard(run, api, options, rng, stats) {
  const parts = ownedParts(run);
  let best = null;
  let bestScore = -1;
  for (let i = 0; i < options.layouts; i++) {
    const layout = randomLayout(parts, run.machine, rng, api.getPart);
    const score = scoreLayout(run, layout, api);
    if (score > bestScore) {
      bestScore = score;
      best = layout;
    }
  }
  if (best === null) {
    return;
  }
  if (options.smart) {
    const scoreOf = function scoreOf(layout) {
      return scoreLayout(run, layout, api);
    };
    best = hillClimb(best, run.machine, scoreOf, rng, 200, api.getPart);
  }
  recordDeadParts(run, best, api, stats);
  if (layoutKey(best) !== boardKey(run.machine)) {
    applyLayout(run, best, api);
  }
}

export function newStats() {
  return { offered: {}, bought: {}, onBoard: {}, dead: {} };
}

// A fresh run for the bot. options: { inventorId, voltage, seed, gentle }
export function newBotRun(options, api) {
  return api.newRun({
    inventorId: options.inventorId,
    voltage: options.voltage,
    seed: options.seed,
    poolIds: api.allPartIds(),
    bonuses: options.gentle ? { gentle: true } : {},
    daily: false
  });
}

// One bot turn: build + fire in the build phase, shop + next shift in the shop phase.
// Returns the total of the Fire it made (0 when it only shopped).
export function stepRun(run, api, options, rng, stats, coinsAtShop) {
  if (run.phase === 'build') {
    buildBoard(run, api, options, rng, stats);
    api.fire(run);
    return run.lastFire ? run.lastFire.total : 0;
  }
  if (run.phase === 'shop') {
    coinsAtShop.push(run.coins);
    doShopping(run, api, api.getPart, stats);
    api.startNextShift(run);
  }
  return 0;
}

export function isOver(run) {
  return run.phase === 'won' || run.phase === 'lost';
}

// options: { inventorId, voltage, seed, layouts, smart }
export function playRun(options, api) {
  const run = newBotRun(options, api);
  const rng = api.makeRng(options.seed * 7 + 1);
  const stats = newStats();
  const coinsAtShop = [];
  let bestFire = 0;
  for (let guard = 0; guard < 200 && !isOver(run); guard++) {
    const total = stepRun(run, api, options, rng, stats, coinsAtShop);
    if (total > bestFire) {
      bestFire = total;
    }
  }
  return {
    inventorId: options.inventorId,
    won: run.phase === 'won',
    endShift: run.shift,
    bestFire: bestFire,
    coinsAtShop: coinsAtShop,
    owned: ownedParts(run).map(function id(p) { return p.partId; }),
    stats: stats,
    finished: isOver(run),
    run: run
  };
}
