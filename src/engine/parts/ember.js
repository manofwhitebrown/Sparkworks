// Ember: rewards later sparks. The first source spark gets nothing.
// Owner: AI-3
import { boostAdd, addLabel, byLevel, makeExample } from './partMath.js';

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
    return 'Later sparks get more: +' + byLevel(NUMBERS.perEarlier, level) + ' for each earlier spark.';
  },
  example(level) {
    return makeExample(this, level, { fire: { sparkNumber: 2, bankedTotal: 0, bankedCount: 0, partsOnBoard: 5 } });
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
