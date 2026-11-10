// Tests for achievements, the Patent Book logic and unlock hints.
// Owner: AI-5
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta, STARTING_PARTS } from '../src/meta/metaState.js';
import { ACHIEVEMENTS } from '../src/data/achievements.js';
import { checkAchievements } from '../src/meta/achievements.js';
import { partStatus, markSeen, unlockHint, unlockedPartIds } from '../src/meta/patentBook.js';
import { allPartIds } from '../src/engine/parts/index.js';

// Until AI-3 finishes the parts library, check the ids the contract promises.
const PROMISED = ['ember', 'compounder', 'overdrive', 'reverser', 'triplet', 'flywheel', 'fuse', 'rectifier',
  'prism', 'turnstile', 'echo', 'mint'];

function lockedPartIds() {
  const all = allPartIds().length > 0 ? allPartIds() : STARTING_PARTS.concat(PROMISED);
  return all.filter((id) => STARTING_PARTS.indexOf(id) === -1);
}

function summaryOf(overrides) {
  return Object.assign({ won: false, shiftReached: 1, shiftsCleared: 0, voltage: 1, inventorId: 'tinkerbot',
    daily: false, bestFire: 0, totalBanked: 0, partsOwned: [], coinsLeft: 0 }, overrides);
}

test('about 25 achievements with unique ids', () => {
  assert.ok(ACHIEVEMENTS.length >= 22 && ACHIEVEMENTS.length <= 30);
  const ids = ACHIEVEMENTS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('every non-starting part is unlocked by exactly one achievement', () => {
  const locked = lockedPartIds();
  assert.ok(locked.length > 0);
  for (const partId of locked) {
    const owners = ACHIEVEMENTS.filter((a) => a.reward.type === 'part' && a.reward.id === partId);
    assert.equal(owners.length, 1, 'part ' + partId + ' has ' + owners.length + ' achievements');
  }
});

test('no achievement gives a starting part', () => {
  for (const a of ACHIEVEMENTS) {
    if (a.reward.type === 'part') assert.ok(STARTING_PARTS.indexOf(a.reward.id) === -1, a.id);
  }
});

test('unlockHint returns text for every locked part', () => {
  for (const partId of lockedPartIds()) {
    const hint = unlockHint(partId);
    assert.ok(hint.length > 3);
    assert.notEqual(hint, 'Keep playing to find this part.');
  }
});

test('achievements fire once and apply rewards', () => {
  const m = defaultMeta();
  const s = summaryOf({ shiftsCleared: 4, shiftReached: 5 });
  const first = checkAchievements(m, s);
  const ids = first.map((a) => a.id);
  assert.ok(ids.includes('firstLight') && ids.includes('halfway'));
  assert.ok(m.unlockedParts.includes('ember'));
  assert.ok(m.unlockedInventors.includes('clockmaker'));
  assert.equal(m.dust, 5);
  const dustAfter = m.dust;
  assert.equal(checkAchievements(m, s).length, 0);
  assert.equal(m.dust, dustAfter);
});

test('a broken achievement check never throws', () => {
  const bad = [{ id: 'x', name: 'x', description: 'x', check: () => { throw new Error('boom'); }, reward: { type: 'dust', amount: 1 } }];
  assert.deepEqual(checkAchievements(defaultMeta(), summaryOf({}), { achievements: bad }), []);
});

test('level and collection achievements read partLevels and partsOwned', () => {
  const m = defaultMeta();
  const s = summaryOf({ partLevels: [2, 2, 3, 1], partsOwned: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'a'] });
  const ids = checkAchievements(m, s).map((a) => a.id);
  assert.ok(ids.includes('trio') && ids.includes('levelThree') && ids.includes('collector'));
});

test('Patent Book status: locked, new, seen', () => {
  const m = defaultMeta();
  assert.equal(partStatus(m, 'ember'), 'locked');
  assert.equal(partStatus(m, 'coil'), 'seen');
  checkAchievements(m, summaryOf({ shiftsCleared: 4 }));
  assert.equal(partStatus(m, 'ember'), 'new');
  markSeen(m, 'ember');
  assert.equal(partStatus(m, 'ember'), 'seen');
  markSeen(m, 'prism');
  assert.equal(partStatus(m, 'prism'), 'locked');
  assert.ok(unlockedPartIds(m).includes('ember'));
});
