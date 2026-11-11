// Coil: the simplest adder. Adds a flat number to the spark.
// Owner: AI-3
import { boostAdd, addLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { add: [3, 5, 8] };

export default {
  id: 'coil',
  name: 'Coil',
  rarity: 'common',
  tags: ['add'],
  directional: false,
  maxLevel: 3,
  cost: 3,
  describe(level) {
    return 'Adds ' + byLevel(NUMBERS.add, level) + '.';
  },
  example(level) {
    return makeExample(this, level);
  },
  onPass(ctx) {
    const bonus = boostAdd(byLevel(NUMBERS.add, ctx.level), ctx.boost);
    ctx.setValue(ctx.value + bonus, addLabel(bonus));
  }
};
