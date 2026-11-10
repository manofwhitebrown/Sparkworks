// Tests for src/core/save.js. Owner: AI-1
import test from 'node:test';
import assert from 'node:assert/strict';
import { loadMeta, saveMeta, loadRun, saveRun, clearRun, wipeAll } from '../src/core/save.js';

// A tiny in-memory stand-in for localStorage.
function installFakeStorage() {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
  return store;
}

test('save: meta written then read gives the same data', () => {
  installFakeStorage();
  const meta = loadMeta();
  meta.dust = 42;
  assert.equal(saveMeta(meta), true);
  assert.equal(loadMeta().dust, 42);
});

test('save: run written then read gives the same data, clearRun removes it', () => {
  installFakeStorage();
  assert.equal(loadRun(), null);
  const run = { v: 1, shift: 3, coins: 9 };
  saveRun(run);
  assert.deepEqual(loadRun(), run);
  clearRun();
  assert.equal(loadRun(), null);
});

test('save: corrupt text is moved to .corrupt and defaults come back', () => {
  const store = installFakeStorage();
  store['sparkworks/meta'] = '{not json';
  const meta = loadMeta();
  assert.equal(typeof meta, 'object');
  assert.equal(meta.dust, 0);
  assert.equal(store['sparkworks/meta.corrupt'], '{not json');
  assert.equal('sparkworks/meta' in store, false);
});

test('save: a corrupt run returns null and is kept', () => {
  const store = installFakeStorage();
  store['sparkworks/run'] = '[[[';
  assert.equal(loadRun(), null);
  assert.equal(store['sparkworks/run.corrupt'], '[[[');
});

test('save: valid JSON in the wrong shape counts as corrupt', () => {
  const store = installFakeStorage();
  store['sparkworks/run'] = JSON.stringify({ hello: 'world' });
  assert.equal(loadRun(), null);
  assert.ok('sparkworks/run.corrupt' in store);
});

test('save: wipeAll removes both keys', () => {
  const store = installFakeStorage();
  saveMeta(loadMeta());
  saveRun({ v: 1 });
  wipeAll();
  assert.equal('sparkworks/meta' in store, false);
  assert.equal('sparkworks/run' in store, false);
});

test('save: storage that throws never crashes the game', () => {
  globalThis.localStorage = {
    getItem() { throw new Error('private mode'); },
    setItem() { throw new Error('private mode'); },
    removeItem() { throw new Error('private mode'); },
  };
  assert.equal(typeof loadMeta(), 'object');
  assert.equal(loadRun(), null);
  assert.equal(saveMeta({}), false);
  clearRun();
  wipeAll();
});

test('save: no localStorage at all (plain node) is fine', () => {
  delete globalThis.localStorage;
  assert.equal(loadRun(), null);
  assert.equal(saveRun({}), false);
});
