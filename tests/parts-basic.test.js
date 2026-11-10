// Structure checks for every part: ids, tags, costs, describe, no NaN/Infinity.
// Owner: AI-3
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { PARTS, getPart, allPartIds, partsWithTag } from '../src/engine/parts/index.js';
import { runPart } from './helpers/fakeCtx.js';

const RARITIES = ['common', 'rare', 'legendary'];
const TAGS = ['add', 'mult', 'route', 'split', 'state', 'boost', 'risk', 'economy'];
const NOT_PARTS = ['index.js', 'partMath.js'];
const REQUIRED = ['coil', 'dynamo', 'ember', 'amplifier', 'compounder', 'overdrive', 'bend', 'switch',
  'reverser', 'splitter', 'triplet', 'capacitor', 'counter', 'anvil', 'flywheel', 'battery',
  'gambler', 'fuse', 'rectifier', 'tollgate'];

test('allPartIds has no duplicates and every id has a part', () => {
  const ids = allPartIds();
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ids) {
    assert.ok(getPart(id), id);
    assert.equal(PARTS[id].id, id);
  }
  assert.equal(getPart('nope'), null);
});

test('all 20 required parts and 4 extra parts exist', () => {
  for (const id of REQUIRED) {
    assert.ok(getPart(id), id);
  }
  assert.equal(allPartIds().length, 24);
});

test('every part file matches an id and every id has a file', () => {
  const files = readdirSync(new URL('../src/engine/parts/', import.meta.url))
    .filter((f) => !NOT_PARTS.includes(f))
    .map((f) => f.replace('.js', ''));
  assert.deepEqual(files.sort(), allPartIds().slice().sort());
});

test('rarity, tags, cost, level and describe are valid', () => {
  for (const id of allPartIds()) {
    const part = PARTS[id];
    assert.ok(RARITIES.includes(part.rarity), id);
    assert.ok(part.tags.length > 0, id);
    for (const tag of part.tags) {
      assert.ok(TAGS.includes(tag), id + ' ' + tag);
    }
    assert.ok(Number.isInteger(part.cost) && part.cost > 0, id);
    assert.equal(part.maxLevel, 3);
    assert.equal(typeof part.directional, 'boolean');
    for (let level = 1; level <= 3; level++) {
      const text = part.describe(level);
      assert.ok(typeof text === 'string' && text.length > 0, id);
    }
  }
});

test('extra parts cover legendary, route, fire info and coins', () => {
  assert.equal(PARTS.prism.rarity, 'legendary');
  assert.ok(PARTS.turnstile.tags.includes('route'));
  assert.ok(PARTS.echo);
  assert.ok(PARTS.mint.tags.includes('economy'));
});

test('partsWithTag finds parts', () => {
  const split = partsWithTag('split').map((p) => p.id);
  assert.ok(split.includes('splitter') && split.includes('triplet') && split.includes('prism'));
  assert.deepEqual(partsWithTag('nothing'), []);
});

test('no NaN or Infinity for values from 0 up to 1e300, every level, with and without boost', () => {
  const values = [0, 1, 2, 3.5, 100, 1e50, 1e300];
  for (const id of allPartIds()) {
    for (let level = 1; level <= 3; level++) {
      for (const boost of [1, 2]) {
        for (const value of values) {
          const fire = { sparkNumber: 2, bankedTotal: value, bankedCount: 1, partsOnBoard: 10 };
          const ctx = runPart(PARTS[id], { value, level, boost, fire, rngValues: [0.1, 0.9] });
          assert.ok(Number.isFinite(ctx.value), id + ' value ' + value);
          for (const s of ctx.calls.split) {
            assert.ok(Number.isFinite(s.value), id + ' split');
          }
          for (const n of ctx.calls.addCoins) {
            assert.ok(Number.isFinite(n), id + ' coins');
          }
          for (const c of ctx.calls.setValue) {
            assert.ok(c.label === undefined || String(c.label).length <= 6, id + ' label ' + c.label);
          }
        }
      }
    }
  }
});
