// Switch: even sparks go straight, odd sparks turn to face the rotation.
// Owner: AI-3
import { isOdd } from './partMath.js';

export default {
  id: 'switch',
  name: 'Switch',
  rarity: 'common',
  tags: ['route'],
  directional: true,
  maxLevel: 3,
  cost: 3,
  describe() {
    return 'Even value goes straight. Odd value turns to face the way the part points.';
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
