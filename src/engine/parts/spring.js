// Spring: adds a small number AND turns the spark the way it points. An adder that steers.
// Owner: AI-3
import { boostAdd, addLabel, byLevel, dirWord, makeExample } from './partMath.js';

const NUMBERS = { add: [2, 4, 7] };

export default {
  id: 'spring',
  name: 'Spring',
  rarity: 'common',
  tags: ['add', 'route'],
  directional: true,
  maxLevel: 3,
  cost: 4,
  describe(level, rot) {
    return 'Adds ' + byLevel(NUMBERS.add, level) + ' and turns the spark ' + dirWord(rot) + '.';
  },
  example(level) {
    return makeExample(this, level);
  },
  onPass(ctx) {
    const bonus = boostAdd(byLevel(NUMBERS.add, ctx.level), ctx.boost);
    ctx.setValue(ctx.value + bonus, addLabel(bonus));
    ctx.turnToFacing();
  }
};
