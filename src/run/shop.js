// The shop: make offers, buy, sell and reroll. Every function changes the run.
// Owner: AI-4

import { getPart as realGetPart } from '../engine/parts/index.js';
import { removePart } from '../engine/board.js';
import { SHIFT_RULES } from '../data/shifts.js';
import { nextRng } from './runRng.js';
import { applyMerges } from './merge.js';
import { benchSizeOf, shopSlotsOf, sellValueOf } from './runRules.js';

function pickGetPart(deps) {
  return deps && deps.getPart ? deps.getPart : realGetPart;
}

// The rarity weights for a shift, for example { common: 85, rare: 15, legendary: 0 }.
export function rarityWeightsFor(shift) {
  const bands = SHIFT_RULES.rarityBands;
  for (let i = 0; i < bands.length; i++) {
    if (shift >= bands[i].fromShift && shift <= bands[i].toShift) {
      return bands[i];
    }
  }
  return bands[bands.length - 1];
}

// How many times each tag is owned (board + bench). Tag -> list of owned parts is
// not needed: we only need to know, for a candidate, how many owned parts share a tag.
function ownedPartList(run, getPart) {
  const list = [];
  for (let i = 0; i < run.machine.cells.length; i++) {
    list.push(getPart(run.machine.cells[i].partId));
  }
  for (let i = 0; i < run.bench.length; i++) {
    list.push(getPart(run.bench[i].partId));
  }
  return list;
}

function sharesTag(partA, partB) {
  const a = partA.tags || [];
  const b = partB.tags || [];
  for (let i = 0; i < a.length; i++) {
    if (b.indexOf(a[i]) >= 0) {
      return true;
    }
  }
  return false;
}

// How many owned parts share at least one tag with this part.
function synergyCount(part, owned) {
  let count = 0;
  for (let i = 0; i < owned.length; i++) {
    if (owned[i] && sharesTag(part, owned[i])) {
      count = count + 1;
    }
  }
  return count;
}

// Weight of one candidate: rarity weight x synergy (x1 + 0.5 per match, capped at x2.5).
function weightOf(part, weights, owned) {
  const rarityWeight = weights[part.rarity] || 0;
  const multiplier = Math.min(2.5, 1 + 0.5 * synergyCount(part, owned));
  return { weight: rarityWeight * multiplier, synergy: synergyCount(part, owned) > 0 };
}

// Pick one candidate by weight. Returns an index into the list, or -1.
function pickWeighted(list, rng) {
  let total = 0;
  for (let i = 0; i < list.length; i++) {
    total = total + list[i].weight;
  }
  if (total <= 0) {
    return -1;
  }
  let roll = rng() * total;
  for (let i = 0; i < list.length; i++) {
    roll = roll - list[i].weight;
    if (roll < 0) {
      return i;
    }
  }
  return list.length - 1;
}

function buildCandidates(run, getPart) {
  const weights = rarityWeightsFor(run.shift);
  const owned = ownedPartList(run, getPart);
  const list = [];
  for (let i = 0; i < run.poolIds.length; i++) {
    const part = getPart(run.poolIds[i]);
    if (!part) {
      continue;
    }
    const w = weightOf(part, weights, owned);
    list.push({ part: part, weight: w.weight, synergy: w.synergy });
  }
  return list;
}

// Fill run.offers. At most one offer per part id. At least one offer shares a tag
// with something owned, when any candidate does.
export function makeOffers(run, deps) {
  const getPart = pickGetPart(deps);
  const rng = nextRng(run);
  const slots = shopSlotsOf(run);
  let candidates = buildCandidates(run, getPart);
  const picked = [];

  // First, the guaranteed synergy offer (placed at a random slot afterwards).
  const synergyOnly = candidates.filter(function (c) { return c.synergy && c.weight > 0; });
  if (synergyOnly.length > 0 && slots > 0) {
    const index = pickWeighted(synergyOnly, rng);
    picked.push(synergyOnly[index].part);
    candidates = candidates.filter(function (c) { return c.part.id !== synergyOnly[index].part.id; });
  }
  while (picked.length < slots && candidates.length > 0) {
    let index = pickWeighted(candidates, rng);
    if (index < 0) {
      index = 0; // every weight is 0 (odd pool): fall back to the first one
    }
    picked.push(candidates[index].part);
    candidates.splice(index, 1);
  }
  // Move the first (guaranteed) offer to a random slot so it is not always on the left.
  if (picked.length > 1) {
    const slot = Math.floor(rng() * picked.length);
    const first = picked[0];
    picked[0] = picked[slot];
    picked[slot] = first;
  }
  run.offers = picked.map(function (part) {
    return { partId: part.id, level: 1, price: part.cost, sold: false };
  });
  return { ok: true };
}

// Would adding this part fit on the bench once merges are done? Tries it on copies.
function fitsAfterMerges(run, partId, deps) {
  const trial = {
    machine: { cells: run.machine.cells.map(function (c) { return { x: c.x, y: c.y, partId: c.partId, level: c.level, rot: c.rot }; }) },
    bench: run.bench.map(function (b) { return { partId: b.partId, level: b.level }; })
  };
  trial.bench.push({ partId: partId, level: 1 });
  applyMerges(trial, deps);
  return trial.bench.length <= benchSizeOf(run);
}

export function buyOffer(run, index, deps) {
  if (run.phase !== 'shop') {
    return { ok: false, reason: 'not_shop_phase' };
  }
  const offer = run.offers[index];
  if (!offer) {
    return { ok: false, reason: 'no_such_offer' };
  }
  if (offer.sold) {
    return { ok: false, reason: 'already_sold' };
  }
  if (run.coins < offer.price) {
    return { ok: false, reason: 'not_enough_coins' };
  }
  if (!fitsAfterMerges(run, offer.partId, deps)) {
    return { ok: false, reason: 'bench_full' };
  }
  offer.sold = true;
  run.coins = run.coins - offer.price;
  run.bench.push({ partId: offer.partId, level: offer.level });
  const merged = applyMerges(run, deps);
  return { ok: true, merged: merged.merges };
}

export function sellPart(run, where, deps) {
  if (run.phase !== 'build' && run.phase !== 'shop') {
    return { ok: false, reason: 'wrong_phase' };
  }
  const getPart = pickGetPart(deps);
  let partId = null;
  let level = 1;
  if (where && where.kind === 'bench') {
    const item = run.bench[where.index];
    if (!item) {
      return { ok: false, reason: 'no_such_part' };
    }
    partId = item.partId;
    level = item.level;
    run.bench.splice(where.index, 1);
  } else if (where && where.kind === 'board') {
    const cell = findCell(run, where.x, where.y);
    if (!cell) {
      return { ok: false, reason: 'no_such_part' };
    }
    partId = cell.partId;
    level = cell.level;
    removePart(run.machine, where.x, where.y);
  } else {
    return { ok: false, reason: 'bad_location' };
  }
  const part = getPart(partId);
  const coins = sellValueOf(part, level);
  run.coins = run.coins + coins;
  return { ok: true, coins: coins };
}

function findCell(run, x, y) {
  for (let i = 0; i < run.machine.cells.length; i++) {
    const c = run.machine.cells[i];
    if (c.x === x && c.y === y) {
      return c;
    }
  }
  return null;
}

// The price of the next reroll. The first bonuses.freeRerolls of each shift are free.
export function rerollPrice(run) {
  if (run.rerollsThisShift < run.bonuses.freeRerolls) {
    return 0;
  }
  return SHIFT_RULES.rerollStartPrice + SHIFT_RULES.rerollStep * run.rerollsThisShift;
}

export function rerollOffers(run, deps) {
  if (run.phase !== 'shop') {
    return { ok: false, reason: 'not_shop_phase' };
  }
  const price = rerollPrice(run);
  if (run.coins < price) {
    return { ok: false, reason: 'not_enough_coins' };
  }
  run.coins = run.coins - price;
  run.rerollsThisShift = run.rerollsThisShift + 1;
  makeOffers(run, deps);
  return { ok: true, price: price };
}
