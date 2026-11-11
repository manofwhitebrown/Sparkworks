// Starter: a big adder that only works in the FIRST column (where the sparks are born).
// Needs ctx.x (contract item 22). If the engine does not give it, it does nothing.
// Owner: AI-3
import { boostAdd, addLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { add: [6, 10, 16] };

export default {
  id: 'starter',
  name: 'Starter',
  rarity: 'common',
  tags: ['add'],
  directional: false,
  maxLevel: 3,
  cost: 3,
  describe(level) {
    return 'In the first column: +' + byLevel(NUMBERS.add, level) + '. Anywhere else: nothing.';
  },
  example(level) {
    return makeExample(this, level, { x: 0 });
  },
  onPass(ctx) {
    if (ctx.x !== 0) {
      ctx.note('1st col');
      return;
    }
    const bonus = boostAdd(byLevel(NUMBERS.add, ctx.level), ctx.boost);
    ctx.setValue(ctx.value + bonus, addLabel(bonus));
  }
};
