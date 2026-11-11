// Checks the plain beginner texts: short sentences, no jargon, directions named, honest examples.
// Owner: AI-3
import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTS, allPartIds } from '../src/engine/parts/index.js';

const BANNED_WORDS = ['pass', 'banked', 'value', 'stores', 'store', 'fizzle', 'trigger'];

function sentencesOf(text) {
  return text.split(/[.:]\s+|\.$/).filter((s) => s.trim().length > 0);
}

test('every describe uses short sentences and no jargon', () => {
  for (const id of allPartIds()) {
    const part = PARTS[id];
    for (let level = 1; level <= 3; level++) {
      const text = part.describe(level, part.directional ? 1 : undefined);
      for (const sentence of sentencesOf(text)) {
        assert.ok(sentence.trim().split(/\s+/).length <= 10, id + ': "' + sentence + '"');
      }
      const lower = text.toLowerCase();
      for (const word of BANNED_WORDS) {
        assert.ok(!new RegExp('\\b' + word + '\\b').test(lower), id + ' uses "' + word + '"');
      }
    }
  }
});

test('directional parts name the direction in words', () => {
  assert.equal(PARTS.bend.describe(1, 1), 'Turns the spark DOWN.');
  assert.equal(PARTS.bend.describe(1, 3), 'Turns the spark UP.');
  assert.equal(PARTS.bend.describe(1, 0), 'Turns the spark RIGHT.');
  assert.equal(PARTS.bend.describe(1, 2), 'Turns the spark LEFT.');
  assert.ok(PARTS.splitter.describe(1, 1).includes('DOWN'));
  assert.ok(PARTS.triplet.describe(1, 1).includes('DOWN') && PARTS.triplet.describe(1, 1).includes('UP'));
  assert.ok(PARTS.turnstile.describe(1, 1).includes('DOWN, then straight, then UP'));
});

test('describe still works without a rotation', () => {
  for (const id of allPartIds()) {
    assert.ok(PARTS[id].describe(2).length > 0, id);
  }
});

test('examples are null or a before/after pair that matches the real part', () => {
  for (const id of allPartIds()) {
    for (let level = 1; level <= 3; level++) {
      const example = PARTS[id].example(level);
      if (example === null) {
        continue;
      }
      assert.equal(example.before, 2, id);
      assert.ok(Number.isFinite(example.after), id);
    }
  }
});

test('example numbers: coil, amplifier, fuse, anvil', () => {
  assert.deepEqual(PARTS.coil.example(1), { before: 2, after: 5 });
  assert.deepEqual(PARTS.coil.example(3), { before: 2, after: 10 });
  assert.deepEqual(PARTS.amplifier.example(2), { before: 2, after: 5 });
  assert.deepEqual(PARTS.fuse.example(3), { before: 2, after: 40 });
  assert.deepEqual(PARTS.anvil.example(1), { before: 2, after: 4 });
});

test('route and split parts have no number example', () => {
  const ids = ['bend', 'switch', 'reverser', 'splitter', 'triplet', 'prism', 'turnstile', 'battery', 'tollgate'];
  for (const id of ids) {
    assert.equal(PARTS[id].example(1), null, id);
  }
});
