// Compounder: the bigger the spark, the bigger the multiplier (with a cap).
// The cap is applied first, then the boost.
// Owner: AI-3
import { boostMult, multLabel, byLevel } from './partMath.js';

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
    const d = byLevel(NUMBERS.divisor, level);
    const cap = byLevel(NUMBERS.cap, level);
    return 'Multiplies by 1 + value/' + d + ', never more than x' + cap + '.';
  },
  onPass(ctx) {
    const raw = 1 + ctx.value / byLevel(NUMBERS.divisor, ctx.level);
    const capped = Math.min(raw, byLevel(NUMBERS.cap, ctx.level));
    const m = boostMult(capped, ctx.boost);
    ctx.setValue(ctx.value * m, multLabel(m));
  }
};
