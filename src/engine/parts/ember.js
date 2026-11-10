// Ember: rewards later sparks. The first source spark gets nothing.
// Owner: AI-3
import { boostAdd, addLabel, byLevel } from './partMath.js';

const NUMBERS = { perEarlier: [3, 5, 8] };

export default {
  id: 'ember',
  name: 'Ember',
  rarity: 'common',
  tags: ['add', 'state'],
  directional: false,
  maxLevel: 3,
  cost: 4,
  describe(level) {
    return 'Adds +' + byLevel(NUMBERS.perEarlier, level) + ' for each spark that came before this one.';
  },
  onPass(ctx) {
    const earlier = Math.max(ctx.fire.sparkNumber - 1, 0);
    if (earlier === 0) {
      ctx.note('+0');
      return;
    }
    const bonus = boostAdd(byLevel(NUMBERS.perEarlier, ctx.level) * earlier, ctx.boost);
    ctx.setValue(ctx.value + bonus, addLabel(bonus));
  }
};
