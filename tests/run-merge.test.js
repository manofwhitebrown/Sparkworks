// Tests for merging parts.
// Owner: AI-4
import test from 'node:test';
import assert from 'node:assert/strict';
import { findMerges, applyMerges } from '../src/run/merge.js';
import { makeDeps } from './run-fakes.js';

function blankRun() {
  return { machine: { cols: 5, rows: 4, cells: [], blocked: [] }, bench: [] };
}

test('three equal parts on the bench merge into one level 2 part', () => {
  const run = blankRun();
  run.bench = [{ partId: 'coil', level: 1 }, { partId: 'bend', level: 1 }, { partId: 'coil', level: 1 }, { partId: 'coil', level: 1 }];
  assert.equal(findMerges(run, makeDeps()).length, 1);
  const out = applyMerges(run, makeDeps());
  assert.equal(out.count, 1);
  assert.deepEqual(out.merges, [{ partId: 'coil', newLevel: 2 }]);
  assert.deepEqual(run.bench.map((b) => b.partId + b.level), ['bend1', 'coil2']);
});

test('different levels do not merge', () => {
  const run = blankRun();
  run.bench = [{ partId: 'coil', level: 1 }, { partId: 'coil', level: 2 }, { partId: 'coil', level: 1 }];
  assert.equal(findMerges(run, makeDeps()).length, 0);
});

test('a chain merge: 3 x L1 plus two L2 makes an L3', () => {
  const run = blankRun();
  run.bench = [
    { partId: 'coil', level: 2 }, { partId: 'coil', level: 2 },
    { partId: 'coil', level: 1 }, { partId: 'coil', level: 1 }, { partId: 'coil', level: 1 }
  ];
  const out = applyMerges(run, makeDeps());
  assert.equal(out.count, 2);
  assert.deepEqual(run.bench, [{ partId: 'coil', level: 3 }]);
});

test('level 3 parts never merge (maxLevel)', () => {
  const run = blankRun();
  run.bench = [{ partId: 'coil', level: 3 }, { partId: 'coil', level: 3 }, { partId: 'coil', level: 3 }];
  assert.equal(applyMerges(run, makeDeps()).count, 0);
  assert.equal(run.bench.length, 3);
});

test('a merge with a board copy keeps that cell and rotation', () => {
  const run = blankRun();
  run.machine.cells = [{ x: 3, y: 2, partId: 'coil', level: 1, rot: 2 }];
  run.bench = [{ partId: 'coil', level: 1 }, { partId: 'coil', level: 1 }, { partId: 'bend', level: 1 }];
  applyMerges(run, makeDeps());
  assert.deepEqual(run.machine.cells, [{ x: 3, y: 2, partId: 'coil', level: 2, rot: 2 }]);
  assert.deepEqual(run.bench, [{ partId: 'bend', level: 1 }]);
});

test('six equal parts make two merges', () => {
  const run = blankRun();
  for (let i = 0; i < 6; i++) {
    run.bench.push({ partId: 'ember', level: 1 });
  }
  assert.equal(findMerges(run, makeDeps()).length, 2);
});
