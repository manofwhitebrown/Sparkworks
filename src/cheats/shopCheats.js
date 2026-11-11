// Cheats for the shop phase. Same rules as runCheats.js: change the run, return { ok, msg },
// a working cheat marks the run as cheated. Owner: AI-2

import { allPartIds, getPart } from '../engine/parts/index.js';
import { rerollOffers, rerollPrice } from '../run/shop.js';

const MAX_FORCED = 4;

function done(run, msg) {
  run.cheated = true;
  return { ok: true, msg: msg || 'Done' };
}

function refuse(msg) {
  return { ok: false, msg: msg };
}

// A reroll that costs nothing: pay the price first, then let the real reroll take it.
export function freeReroll(run) {
  if (run.phase !== 'shop') {
    return refuse('Open the shop first');
  }
  run.coins = run.coins + rerollPrice(run);
  const out = rerollOffers(run);
  if (!out.ok) {
    return refuse('Reroll refused');
  }
  return done(run, 'Rerolled for free');
}

export function zeroOfferPrices(run) {
  if (run.phase !== 'shop') {
    return refuse('Open the shop first');
  }
  for (let i = 0; i < run.offers.length; i++) {
    run.offers[i].price = 0;
  }
  return done(run, 'All offers are free');
}

// The chosen parts (up to 4, no repeats) become the offers, at their normal price.
export function forceOffers(run, partIds) {
  if (run.phase !== 'shop') {
    return refuse('Open the shop first');
  }
  const known = allPartIds();
  const picked = [];
  const wanted = Array.isArray(partIds) ? partIds : [];
  for (let i = 0; i < wanted.length && picked.length < MAX_FORCED; i++) {
    if (known.indexOf(wanted[i]) !== -1 && picked.indexOf(wanted[i]) === -1) {
      picked.push(wanted[i]);
    }
  }
  if (picked.length === 0) {
    return refuse('Pick at least one part');
  }
  run.offers = picked.map(function (id) {
    return { partId: id, level: 1, price: getPart(id).cost, sold: false };
  });
  return done(run, picked.length + ' offers set');
}
