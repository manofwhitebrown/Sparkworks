// Tests for offers, buying, selling and rerolling.
// Owner: AI-4
import test from 'node:test';
import assert from 'node:assert/strict';
import { newRun } from '../src/run/runState.js';
import { makeOffers, buyOffer, sellPart, rerollOffers, rerollPrice, rarityWeightsFor } from '../src/run/shop.js';
import { makeDeps, FAKE_POOL } from './run-fakes.js';

const DEPS = makeDeps();

function shopRun(options) {
  const opts = Object.assign({ inventorId: 'tinkerbot', voltage: 1, seed: 11, poolIds: FAKE_POOL }, options || {});
  const run = newRun(opts, DEPS);
  run.phase = 'shop';
  run.coins = 20;
  makeOffers(run, DEPS);
  return run;
}

test('rarity weights per shift band', () => {
  assert.equal(rarityWeightsFor(1).legendary, 0);
  assert.equal(rarityWeightsFor(4).rare, 30);
  assert.equal(rarityWeightsFor(8).legendary, 12);
});

test('offers: 3 slots, level 1, price = cost, no repeated part', () => {
  const run = shopRun();
  assert.equal(run.offers.length, 3);
  const ids = run.offers.map((o) => o.partId);
  assert.equal(new Set(ids).size, 3);
  for (const o of run.offers) {
    assert.equal(o.level, 1);
    assert.equal(o.sold, false);
    assert.ok(o.price > 0);
  }
});

test('no legendary offers in shifts 1 and 2', () => {
  for (let seed = 0; seed < 100; seed++) {
    const run = shopRun({ seed: seed });
    assert.ok(run.offers.every((o) => o.partId !== 'gambler'));
  }
});

test('offers are the same for the same seed and actions, also after save and load', () => {
  const a = shopRun({ seed: 99 });
  const b = shopRun({ seed: 99 });
  assert.deepEqual(a.offers, b.offers);
  const copy = JSON.parse(JSON.stringify(a));
  makeOffers(a, DEPS);
  makeOffers(copy, DEPS);
  assert.deepEqual(a.offers, copy.offers);
  assert.equal(a.rngState, copy.rngState);
});

test('synergy weighting makes matching tags more likely', () => {
  const owned = { inventorId: 'tinkerbot', voltage: 1, poolIds: ['coil', 'ember', 'bend', 'counter', 'splitter', 'amplifier', 'battery'] };
  let plain = 0;
  let boosted = 0;
  for (let seed = 0; seed < 2000; seed++) {
    const run = newRun(Object.assign({ seed: seed }, owned), DEPS);
    run.phase = 'shop';
    run.bench = [{ partId: 'counter', level: 1 }]; // only a "state" part owned
    makeOffers(run, DEPS);
    // Without synergy, "counter" (state) would show up 3 out of 7 times at best.
    if (run.offers.some((o) => o.partId === 'counter')) {
      boosted++;
    }
    const clean = newRun(Object.assign({ seed: seed }, owned), DEPS);
    clean.phase = 'shop';
    clean.bench = [{ partId: 'bend', level: 1 }];
    clean.machine.cells = [];
    makeOffers(clean, DEPS);
    if (clean.offers.some((o) => o.partId === 'counter')) {
      plain++;
    }
  }
  assert.ok(boosted > plain, 'owning a state part should raise the chance of a state offer');
});

test('at least one offer shares a tag with an owned part', () => {
  for (let seed = 0; seed < 200; seed++) {
    const run = shopRun({ seed: seed });
    const ownedTags = ['add', 'route', 'mult']; // tinkerbot kit: coil, bend, amplifier
    const hit = run.offers.some((o) => {
      const tags = DEPS.getPart(o.partId).tags;
      return tags.some((t) => ownedTags.indexOf(t) >= 0);
    });
    assert.ok(hit, 'seed ' + seed);
  }
});

test('buyOffer needs the shop phase, coins and space', () => {
  const run = shopRun();
  const price = run.offers[0].price;
  run.phase = 'build';
  assert.equal(buyOffer(run, 0, DEPS).reason, 'not_shop_phase');
  run.phase = 'shop';
  run.coins = price - 1;
  assert.equal(buyOffer(run, 0, DEPS).reason, 'not_enough_coins');
  run.coins = 50;
  // five different parts: nothing can merge, so the bench is really full
  run.bench = ['bend', 'ember', 'coil', 'counter', 'splitter'].map((id) => ({ partId: id, level: 2 }));
  assert.equal(buyOffer(run, 0, DEPS).reason, 'bench_full');
  run.bench = [];
  const out = buyOffer(run, 0, DEPS);
  assert.equal(out.ok, true);
  assert.equal(run.coins, 50 - price);
  assert.equal(run.offers[0].sold, true);
  assert.equal(run.bench.length, 1);
  assert.equal(buyOffer(run, 0, DEPS).reason, 'already_sold');
  assert.equal(buyOffer(run, 9, DEPS).reason, 'no_such_offer');
});

test('buying with a full bench works when the purchase merges', () => {
  const run = shopRun();
  run.offers[0] = { partId: 'ember', level: 1, price: 2, sold: false };
  run.bench = [
    { partId: 'ember', level: 1 }, { partId: 'ember', level: 1 },
    { partId: 'bend', level: 2 }, { partId: 'bend', level: 2 }, { partId: 'coil', level: 2 }
  ];
  const out = buyOffer(run, 0, DEPS);
  assert.equal(out.ok, true);
  assert.deepEqual(out.merged, [{ partId: 'ember', newLevel: 2 }]);
  assert.equal(run.bench.length, 4);
});

test('sellPart values: max(1, floor(cost * 0.5 * level))', () => {
  const run = shopRun();
  run.coins = 0;
  run.bench = [{ partId: 'coil', level: 1 }, { partId: 'coil', level: 3 }, { partId: 'ember', level: 1 }];
  assert.equal(sellPart(run, { kind: 'bench', index: 0 }, DEPS).coins, 1); // floor(1.5)
  assert.equal(sellPart(run, { kind: 'bench', index: 0 }, DEPS).coins, 4); // floor(4.5)
  assert.equal(sellPart(run, { kind: 'bench', index: 0 }, DEPS).coins, 1); // floor(1) = 1
  assert.equal(run.coins, 6);
  run.machine.cells = [{ x: 0, y: 0, partId: 'amplifier', level: 2, rot: 0 }];
  assert.equal(sellPart(run, { kind: 'board', x: 0, y: 0 }, DEPS).coins, 5);
  assert.equal(run.machine.cells.length, 0);
  assert.equal(sellPart(run, { kind: 'bench', index: 3 }, DEPS).ok, false);
  run.phase = 'won';
  assert.equal(sellPart(run, { kind: 'bench', index: 0 }, DEPS).reason, 'wrong_phase');
});

test('reroll prices rise, and free rerolls come first', () => {
  const run = shopRun();
  assert.equal(rerollPrice(run), 1);
  rerollOffers(run, DEPS);
  assert.equal(rerollPrice(run), 2);
  rerollOffers(run, DEPS);
  assert.equal(rerollPrice(run), 3);
  assert.equal(run.coins, 20 - 1 - 2);
  const free = shopRun({ bonuses: { freeRerolls: 2 } });
  assert.equal(rerollPrice(free), 0);
  rerollOffers(free, DEPS);
  rerollOffers(free, DEPS);
  assert.equal(free.coins, 20);
  assert.equal(rerollPrice(free), 3);
});

test('reroll refuses without coins and replaces sold offers', () => {
  const run = shopRun();
  buyOffer(run, 0, DEPS);
  run.coins = 0;
  assert.equal(rerollOffers(run, DEPS).reason, 'not_enough_coins');
  run.coins = 5;
  rerollOffers(run, DEPS);
  assert.ok(run.offers.every((o) => o.sold === false));
});
