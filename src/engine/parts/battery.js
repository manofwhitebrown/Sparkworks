// Battery: does nothing itself, but boosts the parts next to it.
// Owner: AI-3
import { byLevel } from './partMath.js';

const NUMBERS = { boost: [1.5, 1.75, 2] };

export default {
  id: 'battery',
  name: 'Battery',
  rarity: 'common',
  tags: ['boost'],
  directional: false,
  maxLevel: 3,
  cost: 5,
  describe(level) {
    return 'Parts next to it work x' + byLevel(NUMBERS.boost, level) + ' stronger.';
  },
  boostFor(level) {
    return byLevel(NUMBERS.boost, level);
  },
  onPass(ctx) {
    ctx.note('boost');
  }
};
