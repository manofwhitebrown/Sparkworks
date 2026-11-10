// Checks the balance bot and report with a tiny FAKE run module (real engine, fake run loop),
// so the bot is tested even before AI-4's run code is finished.
// Owner: AI-8

import test from 'node:test';
import assert from 'node:assert/strict';
import { simulate } from '../src/engine/simulate.js';
import { cloneMachine, placePart, makeMachine } from '../src/engine/board.js';
import { getPart, allPartIds } from '../src/engine/parts/index.js';
import { makeRng } from '../src/core/rng.js';
import { playRun } from '../tools/lib/bot.js';
import { summarize, formatReport, verdict } from '../tools/lib/report.js';
import { collectPartStats, flagsFor } from '../tools/partStats.js';

// A 3-shift fake game: one Fire per shift, target 5, shop sells a coil for 1 coin.
function fakeApi() {
  return {
    simulate, cloneMachine, placePart, getPart, allPartIds, makeRng,
    newRun() {
      return {
        shift: 1, phase: 'build', coins: 3, firesLeft: 1, lastFire: null,
        machine: makeMachine({}),
        bench: [{ partId: 'coil', level: 1 }, { partId: 'amplifier', level: 1 }],
        offers: [{ partId: 'coil', level: 1, price: 1, sold: false }]
      };
    },
    placeFromBench(run, index, x, y, rot) {
      const item = run.bench.splice(index, 1)[0];
      placePart(run.machine, x, y, item.partId, item.level, rot);
    },
    returnToBench(run, x, y) {
      for (let i = 0; i < run.machine.cells.length; i++) {
        const cell = run.machine.cells[i];
        if (cell.x === x && cell.y === y) {
          run.bench.push({ partId: cell.partId, level: cell.level });
          run.machine.cells.splice(i, 1);
          return;
        }
      }
    },
    fire(run) {
      const total = simulate(run.machine, { recordEvents: false }).total;
      run.lastFire = { total: total };
      run.phase = run.shift >= 3 ? 'won' : 'shop';
    },
    startNextShift(run) {
      run.shift = run.shift + 1;
      run.phase = 'build';
    },
    buyOffer(run, index) {
      const offer = run.offers[index];
      run.coins = run.coins - offer.price;
      run.bench.push({ partId: offer.partId, level: offer.level });
    },
    sellPart() {},
    rerollOffers() {},
    rerollPrice() { return 1; }
  };
}

test('the bot finishes a fake run and reports sane numbers', () => {
  const result = playRun({ inventorId: 'tinkerbot', voltage: 1, seed: 5, layouts: 20, smart: true }, fakeApi());
  assert.equal(result.finished, true);
  assert.equal(result.won, true);
  assert.ok(result.bestFire > 0);
  assert.ok(result.owned.length >= 2);
});

test('the bot is deterministic for the same seed', () => {
  const a = playRun({ inventorId: 'tinkerbot', voltage: 1, seed: 9, layouts: 20, smart: false }, fakeApi());
  const b = playRun({ inventorId: 'tinkerbot', voltage: 1, seed: 9, layouts: 20, smart: false }, fakeApi());
  assert.deepEqual(a, b);
});

test('report, verdict and part stats work on results', () => {
  const results = [];
  for (let i = 0; i < 4; i++) {
    results.push(playRun({ inventorId: 'tinkerbot', voltage: 1, seed: i + 1, layouts: 10, smart: false }, fakeApi()));
  }
  const summary = summarize(results);
  assert.equal(summary.total, 4);
  assert.equal(summary.winRate, 1);
  assert.match(formatReport(summary, true, 1), /TOO EASY/);
  assert.match(verdict({ winRate: 0.05 }, true, 1), /TOO HARD/);
  assert.match(verdict({ winRate: 0.4 }, true, 1), /OK/);
  const data = collectPartStats(results, allPartIds());
  assert.ok(data.rows.coil.ownedRuns >= 1);
  assert.ok(flagsFor(data.rows.dynamo, 0.5).flags.indexOf('NEVER BOUGHT') >= 0);
});
