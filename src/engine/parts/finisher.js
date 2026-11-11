// Finisher: a big multiplier that only works in the LAST column (the cell next to the vault).
// Needs ctx.x and ctx.cols (contract item 22). If the engine does not give them, it does nothing.
// Owner: AI-3
import { boostMult, multLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { mult: [3, 4, 6] };

export default {
  id: 'finisher',
  name: 'Finisher',
  rarity: 'rare',
  tags: ['mult'],
  directional: false,
  maxLevel: 3,
  cost: 6,
  describe(level) {
    return 'In the last column: x' + byLevel(NUMBERS.mult, level) + '. Anywhere else: nothing.';
  },
  example(level) {
    return makeExample(this, level, { x: 4 });
  },
  onPass(ctx) {
    if (typeof ctx.x !== 'number' || typeof ctx.cols !== 'number' || ctx.x !== ctx.cols - 1) {
      ctx.note('last col');
      return;
    }
    const m = boostMult(byLevel(NUMBERS.mult, ctx.level), ctx.boost);
    ctx.setValue(ctx.value * m, multLabel(m));
  }
};
