// Splitter: the spark goes straight AND a smaller copy goes toward the rotation.
// The copy's share is boosted but never above 100% of the value.
// Owner: AI-3
import { dirOfRot, byLevel, dirWord } from './partMath.js';

const NUMBERS = { share: [0.5, 0.65, 0.8] };

export default {
  id: 'splitter',
  name: 'Splitter',
  rarity: 'common',
  tags: ['split'],
  directional: true,
  maxLevel: 3,
  cost: 4,
  describe(level, rot) {
    const share = byLevel(NUMBERS.share, level);
    const what = share === 0.5 ? 'half the number' : Math.round(share * 100) + '% of the number';
    return 'The spark goes straight. A copy (' + what + ') goes ' + dirWord(rot) + '.';
  },
  example() {
    return null;
  },
  onPass(ctx) {
    const share = Math.min(byLevel(NUMBERS.share, ctx.level) * ctx.boost, 1);
    const label = Math.round(share * 100) + '%';
    ctx.split(dirOfRot(ctx.rot), ctx.value * share, label);
  }
};
