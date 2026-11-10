// Tollgate: does not change the spark, but pays coins every time a spark passes.
// Owner: AI-3
import { boostAdd, byLevel } from './partMath.js';

const NUMBERS = { coins: [1, 2, 3] };

export default {
  id: 'tollgate',
  name: 'Tollgate',
  rarity: 'common',
  tags: ['economy'],
  directional: false,
  maxLevel: 3,
  cost: 3,
  describe(level) {
    return 'Pays +' + byLevel(NUMBERS.coins, level) + ' coins each time a spark passes.';
  },
  onPass(ctx) {
    const coins = Math.round(boostAdd(byLevel(NUMBERS.coins, ctx.level), ctx.boost));
    ctx.addCoins(coins);
    ctx.note('+' + coins + 'c');
  }
};
