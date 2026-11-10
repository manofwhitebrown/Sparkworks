// Rectifier: odd values get a flat bonus, even values get a multiplier.
// Owner: AI-3
import { boostAdd, boostMult, addLabel, multLabel, isOdd, byLevel } from './partMath.js';

const NUMBERS = { oddAdd: [4, 6, 9], evenMult: [1.5, 1.75, 2] };

export default {
  id: 'rectifier',
  name: 'Rectifier',
  rarity: 'common',
  tags: ['add', 'mult'],
  directional: false,
  maxLevel: 3,
  cost: 4,
  describe(level) {
    const add = byLevel(NUMBERS.oddAdd, level);
    const mult = byLevel(NUMBERS.evenMult, level);
    return 'Odd value: +' + add + '. Even value: x' + mult + '.';
  },
  onPass(ctx) {
    if (isOdd(ctx.value)) {
      const bonus = boostAdd(byLevel(NUMBERS.oddAdd, ctx.level), ctx.boost);
      ctx.setValue(ctx.value + bonus, addLabel(bonus));
      return;
    }
    const m = boostMult(byLevel(NUMBERS.evenMult, ctx.level), ctx.boost);
    ctx.setValue(ctx.value * m, multLabel(m));
  }
};
