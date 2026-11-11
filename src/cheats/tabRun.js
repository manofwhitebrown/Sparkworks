// The RUN tab: buttons for coins, Fires, target, shifts, board, sparks, twists and parts.
// Each button calls a function from runCheats.js through env.doRun. Owner: AI-2

import { allPartIds, getPart } from '../engine/parts/index.js';
import * as rc from './runCheats.js';
import { button, row, section, makeSelect } from './menuUi.js';

function partChoices() {
  return allPartIds().map(function (id) {
    return { value: id, label: getPart(id).name + ' (' + id + ')' };
  });
}

function coinsSection(env) {
  const add = function (n) {
    return button('+' + n, function () { env.doRun('coins', function (r) { return rc.addCoins(r, n); }); });
  };
  const zero = button('Set 0', function () { env.doRun('coins', function (r) { return rc.setCoins(r, 0); }); });
  return section('Coins', [row([add(10), add(100), add(1000), zero])]);
}

function firesSection(env) {
  return section('Fires', [row([
    button('Refill Fires', function () { env.doRun('fires', rc.refillFires); }),
    button('+1 Fire', function () { env.doRun('fires', rc.extraFire); })
  ])]);
}

function targetSection(env) {
  const set = function (label, m) {
    return button(label, function () { env.doRun('target', function (r) { return rc.setTargetMultiplier(r, m); }); });
  };
  return section('Target', [row([set('Easy x0.05', 0.05), set('Normal x1', 1), set('Hard x10', 10)])]);
}

function shiftSection(env) {
  const items = [];
  for (let n = 1; n <= 8; n++) {
    items.push(button(String(n), function () { env.doRun('shift', function (r) { return rc.skipToShift(r, n); }); }));
  }
  const end = row([
    button('Instant WIN', function () { env.doRun('win', rc.winRun); }),
    button('Instant LOSE', function () { env.doRun('lose', rc.loseRun); })
  ]);
  return section('Skip to shift', [row(items), end]);
}

function boardSection(env) {
  const size = function (label, dc, dr) {
    return button(label, function () { env.doRun('board', function (r) { return rc.resizeBoard(r, dc, dr); }); });
  };
  return section('Board size (3 to 8)', [row([
    size('Cols -', -1, 0), size('Cols +', 1, 0), size('Rows -', 0, -1), size('Rows +', 0, 1)
  ])]);
}

function sparkSection(env) {
  const counts = [];
  for (let n = 1; n <= 8; n++) {
    counts.push(button(String(n), function () { env.doRun('sparks', function (r) { return rc.setSparkCount(r, n); }); }));
  }
  const values = [1, 2, 5, 10].map(function (v) {
    return button(String(v), function () { env.doRun('sparks', function (r) { return rc.setStartValue(r, v); }); });
  });
  return section('Sparks (lasts until the next shift starts)', [row(counts), row(values)]);
}

function partSection(env) {
  const select = makeSelect(partChoices());
  const give = function (level) {
    return button('Give L' + level, function () {
      env.doRun('give', function (r) { return rc.giveBenchPart(r, select.value, level); });
    }, { go: true });
  };
  return section('Parts', [
    row([select]),
    row([give(1), give(2), give(3), button('+1 bench slot', function () { env.doRun('bench', rc.addBenchSlot); })]),
    row([
      button('All parts to L3', function () { env.doRun('levels', rc.allPartsToLevel3); }),
      button('Board to bench', function () { env.doRun('bench', rc.allPartsToBench); })
    ])
  ]);
}

export function buildRunTab(env) {
  const box = document.createElement('div');
  const clear = section('Twists', [row([button('Clear twists', function () { env.doRun('twists', rc.clearTwists); })])]);
  const parts = [coinsSection(env), firesSection(env), targetSection(env), shiftSection(env),
    boardSection(env), sparkSection(env), clear, partSection(env)];
  for (let i = 0; i < parts.length; i++) {
    box.appendChild(parts[i]);
  }
  return box;
}
