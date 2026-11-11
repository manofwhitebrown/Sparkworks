// Tollgate: does not change the spark, but pays coins every time a spark passes.
// Owner: AI-3
import { boostAdd, byLevel } from './partMath.js';

const NUMBERS = { coins: [2, 3, 4] };

export default {
  id: 'tollgate',
  name: 'Tollgate',
  rarity: 'common',
  tags: ['economy'],
  directional: false,
  maxLevel: 3,
  cost: 3,
  describe(level) {
    const n = byLevel(NUMBERS.coins, level);
    return 'Pays ' + n + (n === 1 ? ' coin' : ' coins') + ' each time a spark comes by.';
  },
  example() {
    return null;
  },
  onPass(ctx) {
    const coins = Math.round(boostAdd(byLevel(NUMBERS.coins, ctx.level), ctx.boost));
    ctx.addCoins(coins);
    ctx.note('+' + coins + 'c');
  }
};
