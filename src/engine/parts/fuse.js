// Fuse: a one-shot huge multiplier. The first spark gets it, then the fuse is spent.
// Owner: AI-3
import { boostMult, multLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { mult: [10, 12, 15] };

export default {
  id: 'fuse',
  name: 'Fuse',
  rarity: 'rare',
  tags: ['risk'],
  directional: false,
  maxLevel: 3,
  cost: 6,
  describe(level) {
    return 'The first spark gets x' + byLevel(NUMBERS.mult, level) + '. Then it burns out.';
  },
  example(level) {
    return makeExample(this, level);
  },
  onPass(ctx) {
    const m = boostMult(byLevel(NUMBERS.mult, ctx.level), ctx.boost);
    ctx.setValue(ctx.value * m, multLabel(m));
    ctx.disable();
  }
};
