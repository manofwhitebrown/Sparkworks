// Bend: turns the spark to face the part's rotation. The basic road builder.
// Owner: AI-3
import { dirWord } from './partMath.js';

export default {
  id: 'bend',
  name: 'Bend',
  rarity: 'common',
  tags: ['route'],
  directional: true,
  maxLevel: 3,
  cost: 2,
  describe(level, rot) {
    return 'Turns the spark ' + dirWord(rot) + '.';
  },
  example() {
    return null;
  },
  onPass(ctx) {
    ctx.turnToFacing();
  }
};
