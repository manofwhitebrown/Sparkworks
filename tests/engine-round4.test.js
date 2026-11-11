// Engine tests for round 4: ctx.x / ctx.y / ctx.cols / ctx.rows, bonus tiles, portal pairs.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { simulate } from '../src/engine/simulate.js';
import { CONFIG } from '../src/data/config.js';
import { makeMachine, placePart, validateMachine, cloneMachine } from '../src/engine/board.js';
import {
  makeAdder, makeMultiplier, turner, disabler, makeGetPart, machineWith
} from './engine-helpers.test.js';

const seen = [];
const getPart = makeGetPart({
  coil: makeAdder(2),
  amp: makeMultiplier(2),
  turn: turner,
  disabler: disabler,
  spy: {
    id: 'spy',
    onPass(ctx) {
      seen.push({ x: ctx.x, y: ctx.y, cols: ctx.cols, rows: ctx.rows });
    }
  }
});

function ofType(result, type) {
  return result.events.filter(function (e) {
    return e.type === type;
  });
}

function same(machine) {
  const full = simulate(machine, { getPart });
  const fast = simulate(machine, { getPart, recordEvents: false });
  assert.strictEqual(fast.total, full.total);
  assert.strictEqual(fast.coins, full.coins);
  assert.strictEqual(fast.banked, full.banked);
  assert.strictEqual(fast.fizzled, full.fizzled);
  return full;
}

// ---------- ctx.x, ctx.y, ctx.cols, ctx.rows ----------

test('ctx gives the part its own cell and the board size', () => {
  seen.length = 0;
  const machine = machineWith([[2, 1, 'spy'], [3, 1, 'spy']], { seed: 1, cols: 6, rows: 3, sourceRow: 1, sparkCount: 1 });
  simulate(machine, { getPart });
  assert.deepStrictEqual(seen, [
    { x: 2, y: 1, cols: 6, rows: 3 },
    { x: 3, y: 1, cols: 6, rows: 3 }
  ]);
});

test('ctx.x and ctx.y follow the part, also when a spark comes back (loop)', () => {
  seen.length = 0;
  // spy at (1,1) is passed by a spark that a turner at (2,1) sends back to the left.
  const machine = machineWith([[1, 1, 'spy'], [2, 1, 'turn', 2]], { seed: 1, sparkCount: 1 });
  simulate(machine, { getPart });
  assert.ok(seen.length >= 2);
  for (let i = 0; i < seen.length; i++) {
    assert.deepStrictEqual(seen[i], { x: 1, y: 1, cols: CONFIG.cols, rows: CONFIG.rows });
  }
});

// ---------- bonus tiles ----------

test('bonus add on an empty cell: every spark gets it, a bonus event is made', () => {
  const machine = machineWith([], { seed: 1, bonusCells: [{ x: 2, y: 1, kind: 'add', amount: 5 }] });
  const result = same(machine);
  assert.strictEqual(result.total, 3 * 6);
  const bonus = ofType(result, 'bonus');
  assert.strictEqual(bonus.length, 3);
  assert.deepStrictEqual(
    { x: bonus[0].x, y: bonus[0].y, kind: bonus[0].kind, amount: bonus[0].amount, before: bonus[0].before, after: bonus[0].after },
    { x: 2, y: 1, kind: 'add', amount: 5, before: 1, after: 6 }
  );
  assert.strictEqual(bonus[0].spark, 1);
});

test('bonus mult on an empty cell', () => {
  const machine = machineWith([], { seed: 1, bonusCells: [{ x: 3, y: 1, kind: 'mult', amount: 3 }] });
  assert.strictEqual(same(machine).total, 3 * 3);
});

test('the bonus comes AFTER the part in the same cell', () => {
  // Coil +2 then bonus x3: (1 + 2) * 3 = 9. The other order would be 1 * 3 + 2 = 5.
  const machine = machineWith([[1, 1, 'coil']], { seed: 1, sparkCount: 1, bonusCells: [{ x: 1, y: 1, kind: 'mult', amount: 3 }] });
  const result = same(machine);
  assert.strictEqual(result.total, 9);
  const types = result.events.map(function (e) {
    return e.type;
  });
  assert.ok(types.indexOf('value') < types.indexOf('bonus'));
});

test('a bonus on the source cell is paid too', () => {
  const machine = machineWith([], { seed: 1, sparkCount: 2, bonusCells: [{ x: 0, y: 1, kind: 'add', amount: 4 }] });
  assert.strictEqual(same(machine).total, 2 * 5);
});

test('a blocked cell stays blocked: no bonus there', () => {
  const machine = machineWith([], { seed: 1, sparkCount: 1, blocked: [{ x: 2, y: 1 }], bonusCells: [{ x: 2, y: 1, kind: 'add', amount: 5 }] });
  const result = same(machine);
  assert.strictEqual(ofType(result, 'bonus').length, 0);
  assert.strictEqual(ofType(result, 'fizzle')[0].reason, 'blocked');
  assert.strictEqual(result.total, 0);
});

test('a bonus off the path is never paid; a part that was never reached does not matter', () => {
  const machine = machineWith([], { seed: 1, bonusCells: [{ x: 2, y: 3, kind: 'add', amount: 5 }] });
  const result = same(machine);
  assert.strictEqual(ofType(result, 'bonus').length, 0);
  assert.strictEqual(result.total, 3);
});

test('bonus on every entry in a loop; the visit limit still ends the loop', () => {
  const LOOP = [[1, 1, 'turn', 1], [1, 2, 'turn', 0], [2, 2, 'turn', 3], [2, 1, 'turn', 2]];
  const machine = machineWith(LOOP, { seed: 1, sparkCount: 1, bonusCells: [{ x: 1, y: 1, kind: 'add', amount: 1 }] });
  const result = same(machine);
  // (1,1) is entered 4 times (the 5th entry fizzles): 4 bonuses, 1 + 4 = 5.
  assert.strictEqual(ofType(result, 'bonus').length, CONFIG.maxVisitsPerCell);
  const f = ofType(result, 'fizzle')[0];
  assert.strictEqual(f.reason, 'steps');
  assert.strictEqual(f.value, 1 + CONFIG.maxVisitsPerCell);
  assert.strictEqual(result.total, 0);
});

test('bonus: no event when the value does not change; bad tiles are ignored; value is capped', () => {
  const machine = machineWith([], {
    seed: 1, sparkCount: 1,
    bonusCells: [
      { x: 1, y: 1, kind: 'mult', amount: 1 },
      { x: 2, y: 1, kind: 'add', amount: NaN },
      { x: 3, y: 1, kind: 'weird', amount: 5 },
      { x: 9, y: 9, kind: 'add', amount: 5 },
      { x: 4, y: 1, kind: 'add', amount: 1e305 }
    ]
  });
  const result = same(machine);
  assert.strictEqual(ofType(result, 'bonus').length, 1);
  assert.strictEqual(result.total, CONFIG.maxValue);
});

test('bonus: a negative add stops at 0', () => {
  const machine = machineWith([], { seed: 1, sparkCount: 1, bonusCells: [{ x: 1, y: 1, kind: 'add', amount: -50 }] });
  assert.strictEqual(same(machine).total, 0);
});

test('bonus: children get the bonus on cells they enter, not on their birth cell', () => {
  const split = { id: 'split', onPass(ctx) { ctx.split('right', ctx.value, 's'); } };
  const parts = makeGetPart({ split: split });
  const machine = machineWith([[1, 1, 'split']], { seed: 1, sparkCount: 1, bonusCells: [{ x: 1, y: 1, kind: 'add', amount: 10 }, { x: 2, y: 1, kind: 'add', amount: 100 }] });
  const result = simulate(machine, { getPart: parts });
  // parent: 1 -> (1,1) split child with 1, bonus +10 -> 11 -> (2,1) +100 = 111.
  // child (born with 1 in (1,1), no bonus there): moves to (2,1) +100 = 101.
  assert.strictEqual(result.total, 111 + 101);
  assert.strictEqual(ofType(result, 'bonus').length, 3);
});

test('a bonus works with a banned part (the cell acts as empty)', () => {
  const machine = machineWith([[1, 1, 'coil']], { seed: 1, sparkCount: 1, banned: ['coil'], bonusCells: [{ x: 1, y: 1, kind: 'add', amount: 5 }] });
  assert.strictEqual(same(machine).total, 6);
});

// ---------- portal pairs ----------

test('portal pair: a spark goes in one and comes out of the other, same direction', () => {
  // portal at (1,1) and (3,2); a coil at (4,2) proves the spark left through (3,2) going right.
  const machine = machineWith([[1, 1, 'portal'], [3, 2, 'portal'], [4, 2, 'coil'], [2, 1, 'coil']], { seed: 1, sparkCount: 1 });
  const result = same(machine);
  assert.strictEqual(result.total, 3);
  const jumps = ofType(result, 'portal');
  assert.strictEqual(jumps.length, 1);
  assert.deepStrictEqual(
    { x: jumps[0].x, y: jumps[0].y, toX: jumps[0].toX, toY: jumps[0].toY, dir: jumps[0].dir, value: jumps[0].value },
    { x: 1, y: 1, toX: 3, toY: 2, dir: 'right', value: 1 }
  );
  const enters = ofType(result, 'enter').map(function (e) {
    return e.x + ',' + e.y;
  });
  // the partner cell has no enter event, the spark simply appears there and moves on
  assert.deepStrictEqual(enters, ['0,1', '1,1', '4,2']);
});

test('portal works without a part definition (the engine knows the id)', () => {
  const machine = machineWith([[1, 1, 'portal'], [3, 3, 'portal']], { seed: 1, sparkCount: 1 });
  const result = simulate(machine, { getPart: makeGetPart({}) });
  assert.strictEqual(ofType(result, 'portal').length, 1);
  assert.strictEqual(result.banked, 1);
});

test('portal: the exit keeps the direction of a spark that was turned before', () => {
  // a turner at (1,1) sends the spark down; it enters portal (1,2), leaves from (3,0) going down.
  const machine = machineWith([[1, 1, 'turn', 1], [1, 2, 'portal'], [3, 0, 'portal'], [3, 1, 'coil']], { seed: 1, sparkCount: 1 });
  const result = same(machine);
  // out of (3,0) going down: enters (3,1) coil +2, goes on down to the bottom edge and fizzles
  const jump = ofType(result, 'portal')[0];
  assert.strictEqual(jump.dir, 'down');
  assert.strictEqual(ofType(result, 'value')[0].x, 3);
  assert.strictEqual(ofType(result, 'fizzle')[0].reason, 'edge');
});

test('a lone portal does nothing', () => {
  const machine = machineWith([[1, 1, 'portal']], { seed: 1 });
  const result = same(machine);
  assert.strictEqual(ofType(result, 'portal').length, 0);
  assert.strictEqual(result.total, 3);
});

test('portals: the first two in machine.cells order are the pair, a third does nothing', () => {
  const machine = machineWith([[1, 1, 'portal'], [3, 2, 'portal'], [2, 3, 'portal']], { seed: 1, sparkCount: 1 });
  const result = same(machine);
  const jump = ofType(result, 'portal')[0];
  assert.strictEqual(jump.toX, 3);
  assert.strictEqual(jump.toY, 2);
  // a spark that walks into the third one just passes it
  const third = machineWith([[1, 1, 'portal'], [3, 2, 'portal'], [2, 1, 'portal']], { seed: 1, sparkCount: 1 });
  assert.strictEqual(ofType(simulate(third, { getPart }), 'portal').length, 1);
});

test('banned portals are switched off', () => {
  const machine = machineWith([[1, 1, 'portal'], [3, 2, 'portal']], { seed: 1, banned: ['portal'] });
  assert.strictEqual(ofType(same(machine), 'portal').length, 0);
});

test('a blocked portal: the entry fizzles; a blocked partner switches the pair off', () => {
  const entryBlocked = machineWith([[1, 1, 'portal'], [3, 2, 'portal']], { seed: 1, sparkCount: 1, blocked: [{ x: 1, y: 1 }] });
  const a = same(entryBlocked);
  assert.strictEqual(ofType(a, 'fizzle')[0].reason, 'blocked');
  assert.strictEqual(ofType(a, 'portal').length, 0);
  const partnerBlocked = machineWith([[1, 1, 'portal'], [3, 2, 'portal']], { seed: 1, sparkCount: 1, blocked: [{ x: 3, y: 2 }] });
  const b = same(partnerBlocked);
  assert.strictEqual(ofType(b, 'portal').length, 0);
  assert.strictEqual(b.total, 1);
});

test('the part in the portal cell runs first, then the bonus, then the jump', () => {
  const machine = machineWith([[1, 1, 'portal'], [3, 2, 'portal']], {
    seed: 1, sparkCount: 1, bonusCells: [{ x: 1, y: 1, kind: 'add', amount: 4 }]
  });
  const result = same(machine);
  assert.strictEqual(result.total, 5);
  const types = result.events.map(function (e) {
    return e.type;
  });
  assert.ok(types.indexOf('bonus') < types.indexOf('portal'));
  assert.strictEqual(ofType(result, 'portal')[0].value, 5);
});

test('a loop through a portal pair ends by the visit limit (reason steps)', () => {
  // (0,1) turner right -> A (1,1) -> B (3,1) -> (4,1) turner left -> B -> A -> (0,1) ...
  const machine = machineWith(
    [[0, 1, 'turn', 0], [1, 1, 'portal'], [3, 1, 'portal'], [4, 1, 'turn', 2]],
    { seed: 1, sparkCount: 1 }
  );
  const result = same(machine);
  assert.strictEqual(result.fizzled, 1);
  assert.strictEqual(result.total, 0);
  const f = ofType(result, 'fizzle')[0];
  assert.strictEqual(f.reason, 'steps');
  assert.strictEqual(f.x, 1);
  assert.strictEqual(f.y, 1);
  assert.strictEqual(ofType(result, 'portal').length, 4);
});

test('portals and splits: a child that is born in a portal cell does not jump at once', () => {
  const split = { id: 'split', onPass(ctx) { ctx.split('right', ctx.value, 's'); } };
  const parts = makeGetPart({ split: split });
  // splitter at (1,1), portal pair at (2,1) and (2,3). Parent and child each enter (2,1) and jump.
  const machine = machineWith([[1, 1, 'split'], [2, 1, 'portal'], [2, 3, 'portal']], { seed: 1, sparkCount: 1 });
  const result = simulate(machine, { getPart: parts });
  assert.strictEqual(ofType(result, 'portal').length, 2);
  assert.strictEqual(result.banked, 2);
});

test('portal: the same machine gives the same log (determinism)', () => {
  const machine = machineWith([[1, 1, 'portal'], [3, 2, 'portal'], [4, 2, 'coil']], { seed: 5 });
  assert.deepStrictEqual(simulate(machine, { getPart }), simulate(machine, { getPart }));
});

// ---------- validateMachine and cloneMachine ----------

test('validateMachine: bonusCells is optional and checked when present', () => {
  const ok = makeMachine({ bonusCells: [{ x: 0, y: 0, kind: 'add', amount: 2 }, { x: 1, y: 0, kind: 'mult', amount: 2 }] });
  assert.deepStrictEqual(validateMachine(ok), []);
  assert.deepStrictEqual(validateMachine(makeMachine()), []);
  const bad = makeMachine({
    bonusCells: [
      { x: 9, y: 0, kind: 'add', amount: 2 },
      { x: 0, y: 0, kind: 'nope', amount: 2 },
      { x: 1, y: 1, kind: 'add', amount: NaN },
      { x: 1, y: 1, kind: 'add', amount: 3 }
    ]
  });
  const problems = validateMachine(bad);
  assert.strictEqual(problems.length, 4);
  assert.deepStrictEqual(validateMachine(makeMachine({ bonusCells: 5 })), ['bonusCells must be a list.']);
});

test('cloneMachine copies bonusCells so the copy is independent', () => {
  const machine = makeMachine({ bonusCells: [{ x: 1, y: 1, kind: 'add', amount: 2 }] });
  const copy = cloneMachine(machine);
  assert.deepStrictEqual(copy.bonusCells, machine.bonusCells);
  copy.bonusCells[0].amount = 99;
  assert.strictEqual(machine.bonusCells[0].amount, 2);
  assert.strictEqual(cloneMachine(makeMachine()).bonusCells, undefined);
});

test('old machines without the new fields still give the old numbers', () => {
  const machine = machineWith([[1, 1, 'coil'], [2, 1, 'amp']], { seed: 1 });
  assert.strictEqual(simulate(machine, { getPart }).total, 3 * 6);
});

test('placePart keeps working next to bonus tiles (a bonus tile is not a part)', () => {
  const machine = makeMachine({ bonusCells: [{ x: 1, y: 1, kind: 'add', amount: 2 }] });
  placePart(machine, 1, 1, 'coil', 1, 0);
  assert.strictEqual(machine.cells.length, 1);
  assert.strictEqual(machine.bonusCells.length, 1);
});
