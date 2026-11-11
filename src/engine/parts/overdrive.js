// Overdrive: a huge multiplier, but only for sparks born from source spark 1.
// Owner: AI-3
import { boostMult, multLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { mult: [4, 5, 6], onlySpark: 1 };

export default {
  id: 'overdrive',
  name: 'Overdrive',
  rarity: 'legendary',
  tags: ['mult'],
  directional: false,
  maxLevel: 3,
  cost: 10,
  describe(level) {
    return 'Huge x' + byLevel(NUMBERS.mult, level) + ' for the first spark and its copies. Later sparks get nothing.';
  },
  example(level) {
    return makeExample(this, level);
  },
  onPass(ctx) {
    if (ctx.fire.sparkNumber !== NUMBERS.onlySpark) {
      ctx.note('spark 1');
      return;
    }
    const m = boostMult(byLevel(NUMBERS.mult, ctx.level), ctx.boost);
    ctx.setValue(ctx.value * m, multLabel(m));
  }
};
