// Tests for src/ui/teach.js (plain-word texts, recap, path cells). Owner: AI-7
import test from 'node:test';
import assert from 'node:assert/strict';
import { ownedCount, ownedHintText, recapText, untouchedParts, untouchedText, sourcePathCells,
  showPathDefault, lossTipText, neededText, twistInfos, overloadText, arrowGlyph, arrowWord, partDescribe, exampleLine } from '../src/ui/teach.js';

test('ownedCount counts the same part and level on the bench and the board', () => {
  const run = {
    bench: [{ partId: 'coil', level: 1 }, { partId: 'coil', level: 2 }, { partId: 'bend', level: 1 }],
    machine: { cells: [{ x: 0, y: 0, partId: 'coil', level: 1, rot: 0 }] }
  };
  assert.equal(ownedCount(run, 'coil', 1), 2);
  assert.equal(ownedCount(run, 'coil', 2), 1);
  assert.equal(ownedCount(run, 'ember', 1), 0);
  assert.equal(ownedCount(null, 'coil', 1), 0);
});

test('ownedHintText says how many more to level up', () => {
  assert.equal(ownedHintText(0), '');
  assert.equal(ownedHintText(1), 'You have 1. Buy 2 more to level up.');
  assert.equal(ownedHintText(2), 'You have 2. Buy 1 more to level up.');
});

test('recapText uses vault and lost, never banked or fizzle', () => {
  assert.equal(recapText({ banked: 3, fizzled: 1, total: 42 }), '3 sparks reached the vault: 42. 1 lost.');
  assert.equal(recapText({ banked: 1, fizzled: 0, total: 7 }), '1 spark reached the vault: 7.');
  assert.equal(recapText({ banked: 0, fizzled: 3, total: 0 }), 'No spark reached the vault. 3 lost.');
  assert.equal(recapText(null), '');
  const all = recapText({ banked: 2, fizzled: 2, total: 5 }).toLowerCase();
  assert.ok(all.indexOf('banked') === -1 && all.indexOf('fizzle') === -1);
});

test('untouchedParts finds parts no spark entered, ignoring banned parts', () => {
  const machine = {
    banned: ['ember'],
    cells: [
      { x: 0, y: 1, partId: 'coil', level: 1, rot: 0 },
      { x: 3, y: 3, partId: 'amplifier', level: 1, rot: 0 },
      { x: 2, y: 0, partId: 'ember', level: 1, rot: 0 }
    ]
  };
  const events = [{ type: 'enter', x: 0, y: 1, spark: 1 }, { type: 'enter', x: 1, y: 1, spark: 1 }];
  const out = untouchedParts(machine, events);
  assert.deepEqual(out, [{ x: 3, y: 3, partId: 'amplifier' }]);
});

test('untouchedText names each part once and points at the Path button', () => {
  const fake = { getPart: (id) => ({ name: id === 'coil' ? 'Coil' : 'Bend' }) };
  const text = untouchedText([{ partId: 'coil' }, { partId: 'coil' }, { partId: 'bend' }], fake);
  assert.equal(text, 'Not touched: Coil, Bend. The spark never went there. Try the Path button.');
  assert.equal(untouchedText([], fake), '');
});

test('sourcePathCells lists only cells entered by source sparks, once each', () => {
  const events = [
    { type: 'spawn', spark: 1, parent: 0 },
    { type: 'enter', x: 0, y: 1, spark: 1 },
    { type: 'enter', x: 1, y: 1, spark: 1 },
    { type: 'spawn', spark: 2, parent: 1 },
    { type: 'enter', x: 1, y: 2, spark: 2 },
    { type: 'spawn', spark: 3, parent: 0 },
    { type: 'enter', x: 0, y: 1, spark: 3 },
    { type: 'enter', x: 1, y: 1, spark: 3 }
  ];
  assert.deepEqual(sourcePathCells(events), [{ x: 0, y: 1 }, { x: 1, y: 1 }]);
});

test('showPathDefault is on for the first 3 runs and in Gentle mode', () => {
  assert.equal(showPathDefault(0, false), true);
  assert.equal(showPathDefault(2, false), true);
  assert.equal(showPathDefault(3, false), false);
  assert.equal(showPathDefault(10, true), true);
});

test('loss tips and the needed line', () => {
  assert.ok(lossTipText('merge').startsWith('Tip:'));
  assert.equal(lossTipText('nope'), '');
  assert.equal(neededText(120, 85), 'You needed 120. Your best Fire was 85.');
  assert.equal(neededText(undefined, 5), '');
});

test('twistInfos finds the plain description by twist name; overloadText joins them', () => {
  const twists = { a: { name: 'Dead cell', description: 'One cell is dead.' }, b: { name: 'Rust', description: 'A part rusts.' } };
  const infos = twistInfos(['Rust', 'Dead cell', 'Unknown'], { twists: twists });
  assert.equal(infos[0].description, 'A part rusts.');
  assert.equal(infos[2].description, '');
  const text = overloadText(infos);
  assert.equal(text.title, 'Overload!');
  assert.equal(text.body, 'Rust: A part rusts. Dead cell: One cell is dead. Unknown');
  assert.deepEqual(overloadText([]), { title: '', body: '' });
});

test('every real twist has a plain description the banner can show', async () => {
  const { TWISTS } = await import('../src/engine/twists.js');
  const names = Object.keys(TWISTS).map((id) => TWISTS[id].name);
  assert.ok(names.length >= 6);
  const infos = twistInfos(names);
  for (let i = 0; i < infos.length; i++) {
    assert.ok(infos[i].description.length > 0, infos[i].name + ' has no description');
  }
});

test('arrowGlyph and arrowWord follow the rotation, bad numbers count as right', () => {
  assert.equal(arrowWord(0), 'right');
  assert.equal(arrowWord(1), 'down');
  assert.equal(arrowWord(2), 'left');
  assert.equal(arrowWord(3), 'up');
  assert.equal(arrowWord(9), 'right');
  assert.equal(arrowWord(undefined), 'right');
  assert.notEqual(arrowGlyph(0), arrowGlyph(1));
  assert.equal(arrowGlyph(-1), arrowGlyph(0));
});

test('partDescribe passes the rotation, exampleLine shows before -> after or nothing', () => {
  const part = { describe: (level, rot) => 'L' + level + ' R' + rot, example: () => ({ before: 2, after: 5 }) };
  assert.equal(partDescribe(part, 2, 3), 'L2 R3');
  assert.equal(partDescribe(part, 1), 'L1 R0');
  assert.equal(exampleLine(part, 1), '2 -> 5');
  assert.equal(exampleLine({ example: () => null }, 1), '');
  assert.equal(exampleLine({ example: () => ({ before: 1, after: NaN }) }, 1), '');
  assert.equal(exampleLine({ example: () => { throw new Error('x'); } }, 1), '');
  assert.equal(exampleLine({}, 1), '');
  assert.equal(partDescribe(null, 1, 0), '');
});

test('every real part gives a text and a valid example line', async () => {
  const { allPartIds, getPart } = await import('../src/engine/parts/index.js');
  const ids = allPartIds();
  assert.ok(ids.length >= 24);
  for (let i = 0; i < ids.length; i++) {
    const part = getPart(ids[i]);
    for (let level = 1; level <= 3; level++) {
      assert.ok(partDescribe(part, level, 1).length > 0, ids[i] + ' level ' + level + ' has no text');
      const line = exampleLine(part, level);
      assert.ok(line === '' || line.indexOf(' -> ') > 0, ids[i] + ' has a bad example line');
    }
  }
});
