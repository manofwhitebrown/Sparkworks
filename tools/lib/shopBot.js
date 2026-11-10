// The bot's shopping brain: score each offer, buy the best affordable one, sell the weakest
// part when the bench is full.
// offer score = rarity weight + 2 x tags shared with owned parts + a bonus when it completes a merge.
// Owner: AI-8

import { ownedParts } from './layouts.js';

const RARITY_WEIGHT = { common: 1, rare: 3, legendary: 5 };
const MERGE_BONUS = 6;

function tagsOf(partId, getPart) {
  const part = getPart(partId);
  if (part && part.tags) {
    return part.tags;
  }
  return [];
}

function countShared(tagsA, tagsB) {
  let shared = 0;
  for (let i = 0; i < tagsA.length; i++) {
    if (tagsB.indexOf(tagsA[i]) >= 0) {
      shared = shared + 1;
    }
  }
  return shared;
}

export function scoreOffer(offer, owned, getPart) {
  const part = getPart(offer.partId);
  let score = RARITY_WEIGHT[part ? part.rarity : 'common'] || 1;
  const offerTags = tagsOf(offer.partId, getPart);
  let sameCount = 0;
  for (let i = 0; i < owned.length; i++) {
    score = score + 2 * countShared(offerTags, tagsOf(owned[i].partId, getPart));
    if (owned[i].partId === offer.partId && owned[i].level === offer.level) {
      sameCount = sameCount + 1;
    }
  }
  // Two of the same already owned: this one makes three, which levels it up.
  if (sameCount >= 2) {
    score = score + MERGE_BONUS;
  }
  return score;
}

// How valuable a part we own is. Used to decide what to sell.
export function keepScore(item, getPart) {
  const part = getPart(item.partId);
  return (RARITY_WEIGHT[part ? part.rarity : 'common'] || 1) + item.level * 2;
}

function bestOfferIndex(run, getPart) {
  const owned = ownedParts(run);
  let bestIndex = -1;
  let bestScore = -1;
  for (let i = 0; i < run.offers.length; i++) {
    const offer = run.offers[i];
    if (!offer.sold && offer.price <= run.coins) {
      const score = scoreOffer(offer, owned, getPart);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
  }
  return { index: bestIndex, score: bestScore };
}

// Sell the lowest keepScore part from the bench. `where` is the shape sellPart is given;
// if AI-4 changes it, only this one function needs to change.
function sellWeakest(run, api, getPart) {
  let weakest = -1;
  let weakestScore = 1e9;
  for (let i = 0; i < run.bench.length; i++) {
    const score = keepScore(run.bench[i], getPart);
    if (score < weakestScore) {
      weakestScore = score;
      weakest = i;
    }
  }
  if (weakest < 0) {
    return false;
  }
  api.sellPart(run, { zone: 'bench', index: weakest });
  return true;
}

// Buys until nothing useful is affordable. stats.offered / stats.bought count parts for partStats.
export function doShopping(run, api, getPart, stats) {
  for (let i = 0; i < run.offers.length; i++) {
    stats.offered[run.offers[i].partId] = (stats.offered[run.offers[i].partId] || 0) + 1;
  }
  let rerolls = 0;
  for (let guard = 0; guard < 12; guard++) {
    const pick = bestOfferIndex(run, getPart);
    // Nothing good? Keep 1 coin and try one reroll, at most twice per shop.
    if ((pick.index < 0 || pick.score < 3) && rerolls < 2 && run.coins > api.rerollPrice(run)) {
      api.rerollOffers(run);
      rerolls = rerolls + 1;
      continue;
    }
    if (pick.index < 0) {
      return;
    }
    const partId = run.offers[pick.index].partId;
    const coinsBefore = run.coins;
    api.buyOffer(run, pick.index);
    if (run.coins === coinsBefore) {
      // The buy did not happen: most likely the bench is full. Sell something and retry once.
      if (!sellWeakest(run, api, getPart)) {
        return;
      }
      api.buyOffer(run, pick.index);
      if (run.coins === coinsBefore) {
        return;
      }
    }
    stats.bought[partId] = (stats.bought[partId] || 0) + 1;
    if (api.applyMerges) {
      api.applyMerges(run);
    }
  }
}
