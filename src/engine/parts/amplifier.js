// Amplifier: the basic multiplier. Order matters: put adders BEFORE it.
// Owner: AI-3
import { boostMult, multLabel, byLevel, makeExample } from './partMath.js';

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
    const m = byLevel(NUMBERS.mult, level);
    if (m === 2) {
      return 'Doubles the number (x2).';
    }
    if (m === 3) {
      return 'Triples the number (x3).';
    }
    return 'Multiplies the number by ' + m + '.';
  },
  example(level) {
    return makeExample(this, level);
  },
  onPass(ctx) {
    const m = boostMult(byLevel(NUMBERS.mult, ctx.level), ctx.boost);
    ctx.setValue(ctx.value * m, multLabel(m));
  }
};
