// Reverser: turns the spark around, a limited number of times per Fire.
// After the last use it disables itself and acts like an empty cell.
// Owner: AI-3
import { oppositeDir, byLevel } from './partMath.js';

const NUMBERS = { uses: [1, 2, 3] };

export default {
  id: 'reverser',
  name: 'Reverser',
  rarity: 'rare',
  tags: ['route'],
  directional: false,
  maxLevel: 3,
  cost: 6,
  describe(level) {
    const n = byLevel(NUMBERS.uses, level);
    return 'Turns the spark around. Works ' + n + (n === 1 ? ' time' : ' times') + ' per Fire.';
  },
  onPass(ctx) {
    const limit = byLevel(NUMBERS.uses, ctx.level);
    const used = (ctx.state.used || 0) + 1;
    ctx.state.used = used;
    ctx.setDir(oppositeDir(ctx.dir));
    ctx.note(used + '/' + limit);
    if (used >= limit) {
      ctx.disable();
    }
  }
};
