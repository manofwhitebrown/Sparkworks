// Switch: even sparks go straight, odd sparks turn to face the rotation.
// Owner: AI-3
import { isOdd, dirWord } from './partMath.js';

export default {
  id: 'switch',
  name: 'Switch',
  rarity: 'common',
  tags: ['route'],
  directional: true,
  maxLevel: 3,
  cost: 3,
  describe(level, rot) {
    return 'Even number: straight on. Odd number: turns ' + dirWord(rot) + '.';
  },
  example() {
    return null;
  },
  onPass(ctx) {
    if (isOdd(ctx.value)) {
      ctx.turnToFacing();
      ctx.note('odd');
    } else {
      ctx.note('even');
    }
  }
};
