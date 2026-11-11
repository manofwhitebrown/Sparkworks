// Compounder: the bigger the spark, the bigger the multiplier (with a cap).
// The cap is applied first, then the boost.
// Owner: AI-3
import { boostMult, multLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { divisor: [10, 7, 5], cap: [6, 8, 10] };

export default {
  id: 'compounder',
  name: 'Compounder',
  rarity: 'rare',
  tags: ['mult'],
  directional: false,
  maxLevel: 3,
  cost: 7,
  describe(level) {
    return 'Bigger numbers grow more. Up to x' + byLevel(NUMBERS.cap, level) + '.';
  },
  example(level) {
    return makeExample(this, level);
  },
  onPass(ctx) {
    const raw = 1 + ctx.value / byLevel(NUMBERS.divisor, ctx.level);
    const capped = Math.min(raw, byLevel(NUMBERS.cap, ctx.level));
    const m = boostMult(capped, ctx.boost);
    ctx.setValue(ctx.value * m, multLabel(m));
  }
};
