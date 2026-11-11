// Workbench: once per Fire it pays coins for the size of your machine (1 coin per 2 parts, capped).
// Owner: AI-3
import { boostAdd, byLevel } from './partMath.js';

const NUMBERS = { partsPerCoin: 2, maxCoins: [3, 4, 6] };

export default {
  id: 'workbench',
  name: 'Workbench',
  rarity: 'common',
  tags: ['economy'],
  directional: false,
  maxLevel: 3,
  cost: 4,
  describe(level) {
    return 'Once per Fire: 1 coin for every ' + NUMBERS.partsPerCoin + ' parts on the board. Up to ' + byLevel(NUMBERS.maxCoins, level) + ' coins.';
  },
  example() {
    return null;
  },
  onPass(ctx) {
    if (ctx.state.paid) {
      ctx.note('paid');
      return;
    }
    ctx.state.paid = true;
    const cap = Math.round(boostAdd(byLevel(NUMBERS.maxCoins, ctx.level), ctx.boost));
    const coins = Math.min(Math.floor(ctx.fire.partsOnBoard / NUMBERS.partsPerCoin), cap);
    if (coins > 0) {
      ctx.addCoins(coins);
    }
    ctx.note('+' + coins + 'c');
  }
};
