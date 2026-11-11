// Triplet: the spark goes straight AND two copies go to both sides.
// Copy shares are boosted but never above 100% of the value.
// Owner: AI-3
import { dirOfRot, byLevel, dirWord } from './partMath.js';

const NUMBERS = { share: [0.4, 0.5, 0.6] };

export default {
  id: 'triplet',
  name: 'Triplet',
  rarity: 'rare',
  tags: ['split'],
  directional: true,
  maxLevel: 3,
  cost: 7,
  describe(level, rot) {
    const percent = Math.round(byLevel(NUMBERS.share, level) * 100);
    const sides = rot === undefined ? 'to both sides' : dirWord(rot) + ' and ' + dirWord(rot + 2);
    return 'The spark goes straight. Copies (' + percent + '% of the number) go ' + sides + '.';
  },
  example() {
    return null;
  },
  onPass(ctx) {
    const share = Math.min(byLevel(NUMBERS.share, ctx.level) * ctx.boost, 1);
    const label = Math.round(share * 100) + '%';
    ctx.split(dirOfRot(ctx.rot), ctx.value * share, label);
    ctx.split(dirOfRot(ctx.rot + 2), ctx.value * share, label);
  }
};
