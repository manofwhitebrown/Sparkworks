// Full headless games with the REAL modules (no fakes): validity, determinism, save/load,
// every part, content cross-checks and a cheap speed test.
// If one of these fails because of another AI's file, report it in docs/notes/AI-8.md.
// Owner: AI-8

import test from 'node:test';
import assert from 'node:assert/strict';
import { realApi } from '../tools/lib/realApi.js';
import { playRun, newBotRun, stepRun, isOver, newStats } from '../tools/lib/bot.js';
import { makeMachine, placePart } from '../src/engine/board.js';
import { simulate } from '../src/engine/simulate.js';
import { TWISTS } from '../src/engine/twists.js';
import { VOLTAGES } from '../src/data/voltage.js';
import { INVENTORS } from '../src/data/inventors.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { STARTING_PARTS } from '../src/meta/metaState.js';
import { drawPartIcon } from '../src/render/partIcons.js';

const api = realApi();
const INVENTOR_IDS = ['tinkerbot', 'clockmaker', 'drvolt'];

// Walks every value in the run; fails on NaN or Infinity.
function checkNumbers(value, path) {
  if (typeof value === 'number') {
    assert.ok(Number.isFinite(value), 'bad number at ' + path + ': ' + value);
  } else if (value && typeof value === 'object') {
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i++) {
      checkNumbers(value[keys[i]], path + '.' + keys[i]);
    }
  }
}

function checkRun(run, label) {
  const m = run.machine;
  assert.ok(run.coins >= 0, label + ': coins negative ' + run.coins);
  for (let i = 0; i < m.cells.length; i++) {
    const c = m.cells[i];
    assert.ok(c.x >= 0 && c.x < m.cols && c.y >= 0 && c.y < m.rows, label + ': cell outside board');
    for (let j = 0; j < m.blocked.length; j++) {
      assert.ok(!(m.blocked[j].x === c.x && m.blocked[j].y === c.y), label + ': part on blocked cell');
    }
  }
  checkNumbers(run, label);
}

function playChecked(inventorId, voltage, seed) {
  const options = { inventorId: inventorId, voltage: voltage, seed: seed, layouts: 6, smart: false };
  const run = newBotRun(options, api);
  const rng = api.makeRng(seed * 7 + 1);
  const stats = newStats();
  const coinsAtShop = [];
  for (let guard = 0; guard < 200 && !isOver(run); guard++) {
    stepRun(run, api, options, rng, stats, coinsAtShop);
    checkRun(run, inventorId + ' v' + voltage + ' seed ' + seed);
  }
  assert.ok(isOver(run), 'run did not finish: ' + inventorId + ' v' + voltage + ' seed ' + seed);
}

test('200 seeds x 3 inventors x voltage 1-4 finish with valid states', () => {
  for (let seed = 1; seed <= 200; seed++) {
    for (let i = 0; i < INVENTOR_IDS.length; i++) {
      const voltage = 1 + ((seed + i) % 4);
      playChecked(INVENTOR_IDS[i], voltage, seed);
    }
  }
  // Also make sure every voltage is covered for a few seeds.
  for (let voltage = 1; voltage <= 4; voltage++) {
    playChecked('tinkerbot', voltage, 1000 + voltage);
  }
});

test('determinism: same seed and same bot give the same final run', () => {
  const options = { inventorId: 'drvolt', voltage: 2, seed: 33, layouts: 10, smart: true };
  const a = playRun(options, api);
  const b = playRun(options, api);
  assert.equal(JSON.stringify(a.run), JSON.stringify(b.run));
});

test('save/load in the middle of a shift gives the same result', () => {
  const options = { inventorId: 'tinkerbot', voltage: 1, seed: 21, layouts: 10, smart: false };
  const whole = playRun(options, api);

  let run = newBotRun(options, api);
  const rng = api.makeRng(options.seed * 7 + 1);
  const stats = newStats();
  const coinsAtShop = [];
  let steps = 0;
  for (let guard = 0; guard < 200 && !isOver(run); guard++) {
    stepRun(run, api, options, rng, stats, coinsAtShop);
    steps = steps + 1;
    if (steps === 3) {
      run = JSON.parse(JSON.stringify(run));
    }
  }
  assert.equal(JSON.stringify(run), JSON.stringify(whole.run));
});

test('every part works at levels 1-3 and rotations 0-3, and has an icon', () => {
  const ids = api.allPartIds();
  assert.ok(ids.length >= 20, 'expected at least 20 parts, got ' + ids.length);
  // A fake 2D context that accepts any call, so drawing the icon cannot fail on missing methods.
  const fakeCtx = new Proxy({}, {
    get(target, name) {
      return name in target ? target[name] : function noop() { return fakeCtx; };
    },
    set(target, name, value) { target[name] = value; return true; }
  });
  for (let i = 0; i < ids.length; i++) {
    for (let level = 1; level <= 3; level++) {
      for (let rot = 0; rot < 4; rot++) {
        const machine = makeMachine({ seed: 5 });
        placePart(machine, 0, machine.sourceRow, 'coil', 1, 0);
        placePart(machine, 1, machine.sourceRow, ids[i], level, rot);
        const result = simulate(machine);
        assert.ok(Number.isFinite(result.total), ids[i] + ' L' + level + ' rot' + rot + ' total is ' + result.total);
        assert.ok(Number.isFinite(result.coins), ids[i] + ' coins is not a number');
      }
    }
    assert.doesNotThrow(function draw() {
      drawPartIcon(fakeCtx, ids[i], 0, 0, 48, '#FFC857');
    }, 'icon for ' + ids[i]);
  }
});

test('content cross-checks: unlocks, inventors, twists', () => {
  const ids = api.allPartIds();
  const unlocked = {};
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const reward = ACHIEVEMENTS[i].reward;
    if (reward && reward.type === 'part') {
      unlocked[reward.id] = true;
    }
  }
  for (let i = 0; i < ids.length; i++) {
    if (STARTING_PARTS.indexOf(ids[i]) < 0) {
      assert.ok(unlocked[ids[i]], 'non-starting part has no unlock achievement: ' + ids[i]);
    }
  }
  for (let i = 0; i < INVENTORS.length; i++) {
    for (let j = 0; j < INVENTORS[i].startParts.length; j++) {
      assert.ok(ids.indexOf(INVENTORS[i].startParts[j]) >= 0, INVENTORS[i].id + ' has unknown part ' + INVENTORS[i].startParts[j]);
    }
  }
  for (let i = 0; i < VOLTAGES.length; i++) {
    const shifts = Object.keys(VOLTAGES[i].twistsByShift);
    for (let j = 0; j < shifts.length; j++) {
      const list = VOLTAGES[i].twistsByShift[shifts[j]];
      for (let k = 0; k < list.length; k++) {
        assert.ok(TWISTS[list[k]], 'voltage ' + VOLTAGES[i].level + ' uses unknown twist ' + list[k]);
      }
    }
  }
});

test('performance: 10,000 simulates are fast enough', () => {
  const machine = makeMachine({ seed: 7 });
  placePart(machine, 0, machine.sourceRow, 'coil', 1, 0);
  placePart(machine, 1, machine.sourceRow, 'amplifier', 1, 0);
  placePart(machine, 2, machine.sourceRow, 'coil', 2, 0);
  const start = Date.now();
  for (let i = 0; i < 10000; i++) {
    simulate(machine, { recordEvents: false });
  }
  const ms = Date.now() - start;
  assert.ok(ms < 10000, '10,000 simulates took ' + ms + ' ms');
});
