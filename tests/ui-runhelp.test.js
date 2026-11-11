// Tests for src/ui/runHelp.js and src/ui/howtoCards.js. Owner: AI-7
import test from 'node:test';
import assert from 'node:assert/strict';
import { HINTS_PER_SHIFT, hintLabel, pathLabel, machineKey, previewCells, hintText, hintsLeftFor } from '../src/ui/runHelp.js';
import { HOWTO_CARDS, cardCounter, cardIndexFromScroll } from '../src/ui/howtoCards.js';
import { simulate } from '../src/engine/simulate.js';
import { makeMachine, placePart } from '../src/engine/board.js';

test('hint labels and counts', () => {
  assert.equal(HINTS_PER_SHIFT, 3);
  assert.equal(hintLabel(3), 'Hint 3');
  assert.equal(hintLabel(0), 'Hint 0');
  assert.equal(hintLabel(-2), 'Hint 0');
  assert.equal(hintsLeftFor(0), 3);
  assert.equal(hintsLeftFor(2), 1);
  assert.equal(hintsLeftFor(9), 0);
  assert.equal(pathLabel(true), 'Path: on');
  assert.equal(pathLabel(false), 'Path: off');
});

test('machineKey changes when a part moves or turns, not when nothing changed', () => {
  const a = makeMachine({});
  placePart(a, 1, 1, 'coil', 1, 0);
  const keyA = machineKey(a);
  assert.equal(machineKey(a), keyA);
  const b = makeMachine({});
  placePart(b, 1, 1, 'coil', 1, 1);
  assert.notEqual(machineKey(b), keyA);
  assert.notEqual(machineKey(makeMachine({})), keyA);
});

test('previewCells lists the cells the source sparks enter and uses one simulate call', () => {
  let calls = 0;
  const fake = function (machine, options) {
    calls += 1;
    assert.equal(options.recordEvents, true);
    return { events: [
      { type: 'spawn', spark: 1, parent: 0 },
      { type: 'enter', spark: 1, x: 0, y: 1 },
      { type: 'enter', spark: 1, x: 1, y: 1 }
    ] };
  };
  const cells = previewCells(makeMachine({}), { simulate: fake });
  assert.deepEqual(cells, [{ x: 0, y: 1 }, { x: 1, y: 1 }]);
  assert.equal(calls, 1);
});

test('previewCells with the real engine walks along the source row to the right edge', () => {
  const cells = previewCells(makeMachine({}), { simulate: simulate });
  assert.equal(cells.length, 5);
  assert.deepEqual(cells[0], { x: 0, y: 1 });
  assert.deepEqual(cells[4], { x: 4, y: 1 });
});

test('hintText names the part, and the way for parts that point somewhere', () => {
  const run = { bench: [{ partId: 'bend', level: 1 }, { partId: 'coil', level: 1 }] };
  const parts = { bend: { name: 'Bend', directional: true }, coil: { name: 'Coil', directional: false } };
  const deps = { getPart: function (id) { return parts[id]; } };
  assert.equal(hintText(run, { partIndex: 0, x: 1, y: 1, rot: 1 }, deps),
    'Hint: try Bend in the glowing cell. Point it down.');
  assert.equal(hintText(run, { partIndex: 1, x: 2, y: 1, rot: 0 }, deps),
    'Hint: try Coil in the glowing cell.');
  assert.equal(hintText(run, null, deps), '');
  assert.equal(hintText(run, { partIndex: 7, x: 0, y: 0, rot: 0 }, deps), '');
});

test('How to Play has 6 cards, each with a title, short text and a picture', () => {
  assert.equal(HOWTO_CARDS.length, 6);
  HOWTO_CARDS.forEach(function (card) {
    assert.ok(card.title.length > 0);
    assert.ok(card.text.length > 0 && card.text.length < 140, card.title);
    assert.ok(card.rows.length >= 1);
    card.rows.forEach(function (row) {
      assert.ok(row.length >= 1);
      row.forEach(function (token) { assert.equal(typeof token.text, 'string'); assert.ok(token.kind); });
    });
  });
  assert.equal(HOWTO_CARDS[0].title, 'Sparks run to the vault');
  assert.equal(HOWTO_CARDS[5].title, 'Buy 3 the same to level up');
});

test('the order card shows the right sums', () => {
  // (1 + 2) x 3 = 9 and 1 x 3 + 2 = 5
  const rows = HOWTO_CARDS[2].rows;
  assert.equal(rows[0][3].text, '= 9');
  assert.equal(rows[1][3].text, '= 5');
});

test('card counter and scroll position', () => {
  assert.equal(cardCounter(0, 6), 'Card 1 of 6');
  assert.equal(cardCounter(5, 6), 'Card 6 of 6');
  assert.equal(cardIndexFromScroll(0, 300, 6), 0);
  assert.equal(cardIndexFromScroll(610, 300, 6), 2);
  assert.equal(cardIndexFromScroll(99999, 300, 6), 5);
  assert.equal(cardIndexFromScroll(100, 0, 6), 0);
});
