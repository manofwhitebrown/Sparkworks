// Contract checker for the event log. About 500 random boards with the real parts,
// levels and rotations. AI-6's player and AI-8's bot depend on this shape.
// Also checks that the sample log in docs/ENGINE.md is still what simulate() makes.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { simulate } from '../src/engine/simulate.js';
import { makeMachine, placePart, validateMachine } from '../src/engine/board.js';
import { allPartIds } from '../src/engine/parts/index.js';
import { CONFIG } from '../src/data/config.js';

// A tiny seeded generator for the test itself (the tests must not use Math.random).
function makeLcg(seed) {
  let state = seed >>> 0;
  return function () {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pick(next, count) {
  return Math.floor(next() * count);
}

function randomMachine(next, boardNumber, ids) {
  const cols = 4 + pick(next, 3);
  const rows = 3 + pick(next, 3);
  const machine = makeMachine({
    cols: cols, rows: rows, sourceRow: pick(next, rows),
    sparkCount: 1 + pick(next, 4), startValue: 1 + pick(next, 3), seed: boardNumber + 1
  });
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      const roll = next();
      if (roll < 0.55) {
        placePart(machine, x, y, ids[pick(next, ids.length)], 1 + pick(next, 3), pick(next, 4));
      } else if (roll < 0.6) {
        machine.blocked.push({ x: x, y: y });
      }
    }
  }
  if (next() < 0.2) {
    machine.banned.push(ids[pick(next, ids.length)]);
  }
  return machine;
}

function isPlain(value) {
  const kind = typeof value;
  if (kind === 'string' || kind === 'boolean') {
    return true;
  }
  return kind === 'number' && Number.isFinite(value);
}

function checkLog(result, label) {
  const events = result.events;
  assert.ok(events.length >= 2, label + ': at least a spawn and an end');
  let endCount = 0;
  const spawnIds = [];
  const spawnParents = {};
  const splitChildren = {};
  let banks = 0;
  let fizzles = 0;
  let sum = 0;
  let lastRunning = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    assert.strictEqual(e.n, i, label + ': n runs 0,1,2 with no gaps');
    assert.strictEqual(typeof e.type, 'string');
    assert.ok(Number.isInteger(e.spark) && e.spark >= 0, label + ': spark is a whole number');
    for (const key of Object.keys(e)) {
      assert.ok(isPlain(e[key]), label + ': ' + e.type + '.' + key + ' must be a number, string or boolean');
    }
    if (e.type === 'end') {
      endCount++;
    } else if (e.type === 'spawn') {
      spawnIds.push(e.spark);
      spawnParents[e.spark] = e.parent;
    } else if (e.type === 'split') {
      splitChildren[e.child] = e.spark;
    } else if (e.type === 'bank') {
      banks++;
      sum += e.value;
      lastRunning = e.runningTotal;
    } else if (e.type === 'fizzle') {
      fizzles++;
    } else if (e.type === 'bonus') {
      assert.ok(e.kind === 'add' || e.kind === 'mult', label + ': bonus kind');
      assert.notStrictEqual(e.before, e.after, label + ': a bonus event means the value changed');
      assert.ok(Number.isFinite(e.amount) && Number.isInteger(e.x) && Number.isInteger(e.y));
    } else if (e.type === 'portal') {
      assert.ok(Number.isInteger(e.toX) && Number.isInteger(e.toY), label + ': portal exit cell');
      assert.ok(typeof e.dir === 'string' && Number.isFinite(e.value));
    }
  }
  assert.strictEqual(endCount, 1, label + ': exactly one end');
  assert.strictEqual(events[events.length - 1].type, 'end', label + ': end is last');
  assert.strictEqual(events[events.length - 1].total, result.total);
  assert.strictEqual(events[events.length - 1].coins, result.coins);
  // spark ids appear in spawn order: 1, 2, 3 ...
  for (let i = 0; i < spawnIds.length; i++) {
    assert.strictEqual(spawnIds[i], i + 1, label + ': spawn order matches ids');
  }
  assert.ok(spawnIds.length <= CONFIG.maxSparksPerFire);
  // every child has a spawn and a split pointing to it, with the same parent
  for (const id of spawnIds) {
    const parent = spawnParents[id];
    if (parent !== 0) {
      assert.strictEqual(splitChildren[id], parent, label + ': split points to child ' + id);
      assert.ok(parent < id, label + ': parent is older than child');
    }
  }
  for (const child of Object.keys(splitChildren)) {
    assert.ok(spawnParents[child] !== undefined, label + ': split child ' + child + ' has a spawn');
  }
  assert.strictEqual(banks + fizzles, spawnIds.length, label + ': every spark banks or fizzles');
  assert.strictEqual(banks, result.banked);
  assert.strictEqual(fizzles, result.fizzled);
  // the total is the sum of banked values (unless it hit the cap)
  if (sum <= CONFIG.maxValue) {
    assert.strictEqual(result.total, sum, label + ': total equals the sum of bank values');
  } else {
    assert.strictEqual(result.total, CONFIG.maxValue);
  }
  assert.strictEqual(lastRunning, result.total, label + ': runningTotal ends at total');
  assert.ok(Number.isInteger(result.coins) && result.coins >= 0, label + ': coins are whole and not negative');
  assert.strictEqual(result.errors, 0, label + ': real parts never throw');
  assert.ok(Number.isFinite(result.total));
}

test('contract: 500 random boards with all real parts keep the event log shape', () => {
  const ids = allPartIds();
  assert.ok(ids.length >= 20);
  const next = makeLcg(2024);
  for (let i = 0; i < 500; i++) {
    const machine = randomMachine(next, i, ids);
    assert.deepStrictEqual(validateMachine(machine), [], 'board ' + i + ' is valid');
    const result = simulate(machine);
    checkLog(result, 'board ' + i);
    const fast = simulate(machine, { recordEvents: false });
    assert.strictEqual(fast.total, result.total, 'board ' + i + ': fast total');
    assert.strictEqual(fast.coins, result.coins);
    assert.strictEqual(fast.banked, result.banked);
    assert.strictEqual(fast.fizzled, result.fizzled);
  }
});

test('contract: 300 random boards with bonus tiles and a portal pair keep the log shape', () => {
  const ids = allPartIds();
  const next = makeLcg(777);
  let withBonus = 0;
  let withPortal = 0;
  for (let i = 0; i < 300; i++) {
    const machine = randomMachine(next, i, ids);
    machine.bonusCells = [];
    const tiles = 1 + pick(next, 4);
    for (let t = 0; t < tiles; t++) {
      const kind = next() < 0.5 ? 'add' : 'mult';
      const amount = kind === 'add' ? 1 + pick(next, 9) : 2 + pick(next, 2);
      machine.bonusCells.push({ x: pick(next, machine.cols), y: pick(next, machine.rows), kind: kind, amount: amount });
    }
    // remove duplicate tiles on one cell so the machine stays valid
    const taken = {};
    machine.bonusCells = machine.bonusCells.filter(function (b) {
      const key = b.x + ',' + b.y;
      const fresh = !taken[key];
      taken[key] = true;
      return fresh;
    });
    if (next() < 0.5) {
      placePart(machine, pick(next, machine.cols), pick(next, machine.rows), 'portal', 1, 0);
      placePart(machine, pick(next, machine.cols), pick(next, machine.rows), 'portal', 1, 0);
    }
    assert.deepStrictEqual(validateMachine(machine), [], 'board ' + i + ' is valid');
    const result = simulate(machine);
    checkLog(result, 'bonus board ' + i);
    const fast = simulate(machine, { recordEvents: false });
    assert.strictEqual(fast.total, result.total);
    assert.strictEqual(fast.coins, result.coins);
    assert.strictEqual(fast.banked, result.banked);
    assert.strictEqual(fast.fizzled, result.fizzled);
    assert.deepStrictEqual(simulate(machine), result);
    if (result.events.some(function (e) { return e.type === 'bonus'; })) {
      withBonus++;
    }
    if (result.events.some(function (e) { return e.type === 'portal'; })) {
      withPortal++;
    }
  }
  // the generator must really exercise both features
  assert.ok(withBonus > 50, 'many boards paid a bonus: ' + withBonus);
  assert.ok(withPortal > 5, 'some boards used a portal: ' + withPortal);
});

test('contract: the same random board gives the same log twice', () => {
  const ids = allPartIds();
  const next = makeLcg(99);
  for (let i = 0; i < 30; i++) {
    const machine = randomMachine(next, i, ids);
    assert.deepStrictEqual(simulate(machine), simulate(machine));
  }
});

function codeBlockAfter(text, marker) {
  const at = text.indexOf(marker);
  assert.ok(at >= 0, 'marker ' + marker + ' is in docs/ENGINE.md');
  const open = text.indexOf('```json', at);
  const close = text.indexOf('```', open + 7);
  return text.slice(open + 7, close).trim();
}

test('docs/ENGINE.md: the captured Splitter + Amplifier log is still real', () => {
  const text = fs.readFileSync(new URL('../docs/ENGINE.md', import.meta.url), 'utf8');
  const machine = JSON.parse(codeBlockAfter(text, '<!-- captured-machine -->'));
  const lines = codeBlockAfter(text, '<!-- captured-log -->').split('\n');
  const documented = lines.map(function (line) {
    return JSON.parse(line);
  });
  const result = simulate(machine);
  assert.deepStrictEqual(result.events, documented);
  assert.strictEqual(result.total, 3);
  assert.strictEqual(result.banked, 2);
});

test('docs/ENGINE.md: the captured bonus + portal log is still real', () => {
  const text = fs.readFileSync(new URL('../docs/ENGINE.md', import.meta.url), 'utf8');
  const machine = JSON.parse(codeBlockAfter(text, '<!-- captured-machine-2 -->'));
  const lines = codeBlockAfter(text, '<!-- captured-log-2 -->').split('\n');
  const documented = lines.map(function (line) {
    return JSON.parse(line);
  });
  const result = simulate(machine);
  // a real 'portal' part file (AI-3) would add partId 'portal' to the enter events of the portal cells
  const events = result.events.map(function (e) {
    if (e.type === 'enter' && e.partId === 'portal') {
      const copy = Object.assign({}, e);
      delete copy.partId;
      return copy;
    }
    return e;
  });
  assert.deepStrictEqual(events, documented);
  assert.strictEqual(result.total, 5);
});
