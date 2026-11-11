// Mint: turns value into coins. Takes a share of the spark and pays 1 coin per 10 value taken.
// Boost raises the coin cap, not the share taken (a boost should never hurt the spark more).
// Owner: AI-3
import { boostAdd, byLevel } from './partMath.js';

const NUMBERS = { take: 0.2, perCoin: 10, maxCoins: [3, 5, 8] };

export default {
  id: 'mint',
  name: 'Mint',
  rarity: 'common',
  tags: ['economy', 'add'],
  directional: false,
  maxLevel: 3,
  cost: 3,
  describe(level) {
    const percent = Math.round(NUMBERS.take * 100);
    return 'Takes ' + percent + '% of the number. Pays 1 coin per ' + NUMBERS.perCoin + ' taken, up to ' + byLevel(NUMBERS.maxCoins, level) + '.';
  },
  example() {
    return null;
  },
  onPass(ctx) {
    const taken = ctx.value * NUMBERS.take;
    const cap = Math.round(boostAdd(byLevel(NUMBERS.maxCoins, ctx.level), ctx.boost));
    const coins = Math.min(Math.floor(taken / NUMBERS.perCoin), cap);
    ctx.setValue(ctx.value - taken, '-' + Math.round(NUMBERS.take * 100) + '%');
    if (coins > 0) {
      ctx.addCoins(coins);
    }
  }
};
