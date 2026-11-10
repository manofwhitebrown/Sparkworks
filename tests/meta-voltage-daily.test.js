// Tests for voltage progress and the daily contract.
// Owner: AI-5
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultMeta } from '../src/meta/metaState.js';
import { maxVoltageFor, recordWin } from '../src/meta/voltage.js';
import { dailyConfig, shareCode, hasPlayedDaily, recordDaily, yesterdayOf, todayString } from '../src/meta/daily.js';

// A simple real hash, so these tests do not depend on AI-1's unfinished rng.js.
const deps = {
  hashString: function (text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
};

test('maxVoltageFor starts at 1 and opens the next voltage after a win', () => {
  const m = defaultMeta();
  assert.equal(maxVoltageFor(m, 'tinkerbot'), 1);
  recordWin(m, 'tinkerbot', 1);
  assert.equal(maxVoltageFor(m, 'tinkerbot'), 2);
  assert.equal(maxVoltageFor(m, 'clockmaker'), 1);
});

test('maxVoltageFor never goes past the number of voltages', () => {
  const m = defaultMeta();
  recordWin(m, 'tinkerbot', 4);
  assert.equal(maxVoltageFor(m, 'tinkerbot', { voltages: [1, 2, 3, 4] }), 4);
});

test('dailyConfig is the same for a date and differs across dates', () => {
  assert.deepEqual(dailyConfig('2026-11-10', deps), dailyConfig('2026-11-10', deps));
  const seeds = {};
  for (let d = 1; d <= 20; d++) seeds[dailyConfig('2026-11-' + (d < 10 ? '0' + d : d), deps).seed] = true;
  assert.equal(Object.keys(seeds).length, 20);
  assert.equal(dailyConfig('2026-11-10', deps).voltage, 1);
});

test('todayString is a local YYYY-MM-DD', () => {
  assert.equal(todayString(new Date(2026, 10, 10, 23, 59)), '2026-11-10');
});

test('streak counts consecutive days and resets after a gap', () => {
  const m = defaultMeta();
  recordDaily(m, '2026-11-10', { won: false, shiftReached: 3, bestFire: 100 });
  recordDaily(m, '2026-11-11', { won: false, shiftReached: 4, bestFire: 100 });
  assert.equal(m.daily.streak, 2);
  recordDaily(m, '2026-11-14', { won: false, shiftReached: 2, bestFire: 50 });
  assert.equal(m.daily.streak, 1);
  assert.equal(hasPlayedDaily(m, '2026-11-14'), true);
  assert.equal(hasPlayedDaily(m, '2026-11-15'), false);
});

test('the best result of the day is kept', () => {
  const m = defaultMeta();
  recordDaily(m, '2026-11-10', { won: false, shiftReached: 5, bestFire: 100 });
  recordDaily(m, '2026-11-10', { won: false, shiftReached: 3, bestFire: 999 });
  assert.equal(m.daily.best.shiftReached, 5);
  assert.equal(m.daily.streak, 1);
});

test('yesterdayOf works across a month and year edge', () => {
  assert.equal(yesterdayOf('2026-03-01'), '2026-02-28');
  assert.equal(yesterdayOf('2027-01-01'), '2026-12-31');
});

test('shareCode is short and has no line breaks', () => {
  const code = shareCode('2026-11-10', { won: false, shiftReached: 6, bestFire: 12400 }, deps);
  assert.ok(code.length < 100);
  assert.ok(!code.includes('\n'));
  assert.ok(code.includes('Shift 6/8'));
  assert.ok(code.includes('12.4K'));
});
