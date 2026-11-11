// Sideamp: a multiplier that only works on sparks moving up or down. It rewards steering:
// the spark must first be turned by a bend (or similar) before it reaches this part.
// Owner: AI-3
import { boostMult, multLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { mult: [2, 2.5, 3] };

export default {
  id: 'sideamp',
  name: 'Sideamp',
  rarity: 'common',
  tags: ['mult'],
  directional: false,
  maxLevel: 3,
  cost: 5,
  describe(level) {
    return 'Multiplies by x' + byLevel(NUMBERS.mult, level) + '. Only for sparks moving UP or DOWN.';
  },
  example(level) {
    return makeExample(this, level, { dir: 'down' });
  },
  onPass(ctx) {
    if (ctx.dir !== 'up' && ctx.dir !== 'down') {
      ctx.note('up/down');
      return;
    }
    const m = boostMult(byLevel(NUMBERS.mult, ctx.level), ctx.boost);
    ctx.setValue(ctx.value * m, multLabel(m));
  }
};
