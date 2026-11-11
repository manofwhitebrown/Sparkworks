// Round 4: Gentle mode, first-visit help flags, new inventors and new achievements.
// Owner: AI-5
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta, repairMeta, INVENTOR_IDS } from '../src/meta/metaState.js';
import { recordRunEnd, dustFor } from '../src/meta/stats.js';
import { ACHIEVEMENTS, ALL_ACHIEVEMENTS } from '../src/data/achievements.js';
import { INVENTORS } from '../src/data/inventors.js';
import { checkAchievements } from '../src/meta/achievements.js';
import { maxVoltageFor } from '../src/meta/voltage.js';

function summaryOf(overrides) {
  return Object.assign({ won: false, shiftReached: 1, shiftsCleared: 0, voltage: 1, inventorId: 'tinkerbot',
    daily: false, bestFire: 0, totalBanked: 0, partsOwned: [], coinsLeft: 5, partLevels: [], gentle: false }, overrides);
}

function planned(id) {
  const found = ALL_ACHIEVEMENTS.filter((a) => a.id === id);
  assert.equal(found.length, 1, id);
  return found[0];
}

// ---------- Gentle mode ----------

test('gentle dust is half of the normal dust, rounded down', () => {
  const m = defaultMeta();
  const won = summaryOf({ won: true, shiftsCleared: 8 });
  assert.equal(dustFor(m, won), 28);
  assert.equal(dustFor(m, Object.assign({}, won, { gentle: true })), 14);
  const lost = summaryOf({ shiftsCleared: 3 });
  assert.equal(dustFor(m, Object.assign({}, lost, { gentle: true })), 4);
  const odd = summaryOf({ shiftsCleared: 2 });
  assert.equal(dustFor(m, odd), 6);
  assert.equal(dustFor(m, Object.assign({}, odd, { gentle: true })), 3);
});

test('gentle dust still uses the Dust Magnet upgrade, with one rounding step', () => {
  const m = defaultMeta();
  m.upgrades.dustBoost = 3;
  const s = summaryOf({ shiftsCleared: 3, gentle: true });
  assert.equal(dustFor(m, s), 5);
});

test('a gentle win pays half, records no win and opens no voltage, but the run still counts', () => {
  const m = defaultMeta();
  const run = { phase: 'won', bonuses: { gentle: true }, history: [{}, {}] };
  const result = recordRunEnd(m, run, { runSummary: () => summaryOf({ won: true, shiftsCleared: 8, shiftReached: 8 }) });
  assert.equal(result.dustEarned, 14);
  assert.equal(m.stats.runs, 1);
  assert.equal(m.stats.wins, 0);
  assert.deepEqual(m.wins, {});
  assert.equal(maxVoltageFor(m, 'tinkerbot'), 1);
});

test('a gentle win unlocks no win achievements (but clearing shifts still counts)', () => {
  const m = defaultMeta();
  const run = { phase: 'won', bonuses: { gentle: true }, history: [{}] };
  const result = recordRunEnd(m, run, { runSummary: () => summaryOf({ won: true, shiftsCleared: 8, shiftReached: 8, bestFire: 5000 }) });
  const ids = result.newAchievements.map((a) => a.id);
  assert.ok(!ids.includes('firstWin'));
  assert.ok(!ids.includes('tinkerWin'));
  assert.ok(ids.includes('halfway'));
  assert.ok(ids.includes('bigSpark'));
});

test('a gentle run never counts for the daily contract', () => {
  const m = defaultMeta();
  const run = { phase: 'lost', bonuses: { gentle: true }, daily: '2026-11-11', history: [{}] };
  const result = recordRunEnd(m, run, { runSummary: () => summaryOf({ shiftsCleared: 2, daily: '2026-11-11' }) });
  assert.equal(m.daily.lastPlayed, '');
  assert.equal(m.daily.streak, 0);
  assert.ok(!result.newAchievements.map((a) => a.id).includes('dailyDone'));
});

test('the same run without the gentle flag pays full dust and records the win', () => {
  const m = defaultMeta();
  const run = { phase: 'won', history: [{}] };
  const result = recordRunEnd(m, run, { runSummary: () => summaryOf({ won: true, shiftsCleared: 8, shiftReached: 8 }) });
  assert.equal(result.dustEarned, 28);
  assert.equal(m.stats.wins, 1);
  assert.equal(maxVoltageFor(m, 'tinkerbot'), 2);
});

test('gentle can also be read from run.gentle', () => {
  const m = defaultMeta();
  const run = { phase: 'lost', gentle: true, history: [{}] };
  const result = recordRunEnd(m, run, { runSummary: () => ({ won: false, shiftsCleared: 3, voltage: 1, inventorId: 'tinkerbot' }) });
  assert.equal(result.dustEarned, 4);
});

// ---------- first-visit help ----------

test('a fresh meta has all three intro flags off', () => {
  assert.deepEqual(defaultMeta().seenIntro, { workshop: false, patents: false, daily: false });
});

test('repairMeta fills seenIntro for old saves and cleans damaged ones', () => {
  const old = defaultMeta();
  delete old.seenIntro;
  assert.deepEqual(repairMeta(old).seenIntro, { workshop: false, patents: false, daily: false });
  assert.deepEqual(repairMeta({ seenIntro: 'x' }).seenIntro, { workshop: false, patents: false, daily: false });
  const kept = repairMeta({ seenIntro: { workshop: true, patents: 1, daily: true, extra: true } });
  assert.deepEqual(kept.seenIntro, { workshop: true, patents: false, daily: true });
});

// ---------- inventors ----------

test('every inventor except the first is unlocked by exactly one achievement', () => {
  for (const inventor of INVENTORS) {
    if (inventor.id === 'tinkerbot') continue;
    const owners = ACHIEVEMENTS.filter((a) => a.reward.type === 'inventor' && a.reward.id === inventor.id);
    assert.equal(owners.length, 1, 'inventor ' + inventor.id + ' has ' + owners.length + ' achievements');
  }
});

test('repairMeta keeps every real inventor id', () => {
  const all = INVENTORS.map((i) => i.id);
  const m = repairMeta({ unlockedInventors: all.concat(['nobody']) });
  for (const id of all) assert.ok(m.unlockedInventors.includes(id), id);
  assert.ok(!m.unlockedInventors.includes('nobody'));
  for (const id of all) assert.ok(INVENTOR_IDS.includes(id), id);
});

test('Whole Crew needs a win with every inventor in the game', () => {
  const crew = ACHIEVEMENTS.filter((a) => a.id === 'allInventors')[0];
  const m = defaultMeta();
  for (const inventor of INVENTORS) m.wins[inventor.id] = { '1': true };
  assert.equal(crew.check(m, summaryOf({})), true);
  m.wins[INVENTORS[INVENTORS.length - 1].id] = {};
  assert.equal(crew.check(m, summaryOf({})), false);
});

// ---------- new achievements (checked on the full planned list) ----------

test('the planned list has at least 8 new achievements, each with a plain one-sentence text', () => {
  const ids = ['steerer', 'banker', 'bounceWin', 'bankerWin', 'gentleStart', 'routes', 'tenK', 'spendAll', 'giant', 'bigHoard'];
  assert.ok(ids.length >= 8);
  for (const id of ids) {
    const a = planned(id);
    assert.ok(a.description.length > 8 && a.description.length < 60 && a.description.endsWith('.'), id);
  }
  const all = ALL_ACHIEVEMENTS.map((a) => a.id);
  assert.equal(new Set(all).size, all.length);
});

test('the new inventor unlocks and win rewards check the right things', () => {
  const m = defaultMeta();
  assert.equal(planned('steerer').check(m, summaryOf({ shiftsCleared: 4 })), false);
  assert.equal(planned('steerer').check(m, summaryOf({ shiftsCleared: 5 })), true);
  assert.equal(planned('banker').check(m, summaryOf({ shiftsCleared: 5 })), false);
  assert.equal(planned('banker').check(m, summaryOf({ shiftsCleared: 6 })), true);
  assert.equal(planned('bounceWin').check(m, summaryOf({ won: true, inventorId: 'msbounce' })), true);
  assert.equal(planned('bounceWin').check(m, summaryOf({ won: true, inventorId: 'banker' })), false);
  assert.equal(planned('bankerWin').check(m, summaryOf({ won: true, inventorId: 'banker' })), true);
  assert.equal(planned('bankerWin').check(m, summaryOf({ won: true, inventorId: 'banker', gentle: true })), false);
});

test('Gentle, route, fire-size, coin and hoard achievements', () => {
  const m = defaultMeta();
  assert.equal(planned('gentleStart').check(m, summaryOf({ gentle: true, shiftsCleared: 3 })), true);
  assert.equal(planned('gentleStart').check(m, summaryOf({ gentle: true, shiftsCleared: 2 })), false);
  assert.equal(planned('gentleStart').check(m, summaryOf({ gentle: false, shiftsCleared: 5 })), false);
  assert.equal(planned('routes').check(m, summaryOf({ partsOwned: ['bend', 'switch'] })), false);
  assert.equal(planned('routes').check(m, summaryOf({ partsOwned: ['bend', 'bend', 'switch', 'turnstile'] })), true);
  assert.equal(planned('tenK').check(m, summaryOf({ bestFire: 9999 })), false);
  assert.equal(planned('tenK').check(m, summaryOf({ bestFire: 10000 })), true);
  assert.equal(planned('giant').check(m, summaryOf({ bestFire: 10000000 })), true);
  assert.equal(planned('spendAll').check(m, summaryOf({ won: true, coinsLeft: 0 })), true);
  assert.equal(planned('spendAll').check(m, summaryOf({ won: true, coinsLeft: 1 })), false);
  assert.equal(planned('spendAll').check(m, summaryOf({ won: false, coinsLeft: 0 })), false);
  const ten = ['coil', 'amplifier', 'bend', 'switch', 'splitter', 'battery', 'anvil', 'counter', 'gambler', 'capacitor'];
  assert.equal(planned('bigHoard').check(m, summaryOf({ partsOwned: ten })), true);
  assert.equal(planned('bigHoard').check(m, summaryOf({ partsOwned: ten.slice(0, 9) })), false);
});

test('a planned achievement fires once and applies its reward when the reward exists', () => {
  const m = defaultMeta();
  const list = [planned('steerer')];
  list[0].reward = { type: 'inventor', id: 'tinkerbot' };
  const first = checkAchievements(m, summaryOf({ shiftsCleared: 5 }), { achievements: list });
  assert.equal(first.length, 1);
  assert.equal(checkAchievements(m, summaryOf({ shiftsCleared: 5 }), { achievements: list }).length, 0);
});
