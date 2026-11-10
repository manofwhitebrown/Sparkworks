// Triplet: the spark goes straight AND two copies go to both sides.
// Copy shares are boosted but never above 100% of the value.
// Owner: AI-3
import { dirOfRot, byLevel } from './partMath.js';

const NUMBERS = { share: [0.4, 0.5, 0.6] };

export default {
  id: 'triplet',
  name: 'Triplet',
  rarity: 'rare',
  tags: ['split'],
  directional: true,
  maxLevel: 3,
  cost: 7,
  describe(level) {
    const percent = Math.round(byLevel(NUMBERS.share, level) * 100);
    return 'Spark goes straight and two copies with ' + percent + '% of the value go to both sides.';
  },
  onPass(ctx) {
    const share = Math.min(byLevel(NUMBERS.share, ctx.level) * ctx.boost, 1);
    const label = Math.round(share * 100) + '%';
    ctx.split(dirOfRot(ctx.rot), ctx.value * share, label);
    ctx.split(dirOfRot(ctx.rot + 2), ctx.value * share, label);
  }
};
