// Amplifier: the basic multiplier. Order matters: put adders BEFORE it.
// Owner: AI-3
import { boostMult, multLabel, byLevel } from './partMath.js';

const NUMBERS = { mult: [2, 2.5, 3] };

export default {
  id: 'amplifier',
  name: 'Amplifier',
  rarity: 'common',
  tags: ['mult'],
  directional: false,
  maxLevel: 3,
  cost: 5,
  describe(level) {
    return 'Multiplies the spark by x' + byLevel(NUMBERS.mult, level) + '.';
  },
  onPass(ctx) {
    const m = boostMult(byLevel(NUMBERS.mult, ctx.level), ctx.boost);
    ctx.setValue(ctx.value * m, multLabel(m));
  }
};
