// Echo: adds a part of everything already banked in this Fire. Spark 1 gets nothing.
// Reads ctx.fire.bankedTotal, so it rewards a machine that banks early and often.
// Owner: AI-3
import { boostAdd, addLabel, byLevel } from './partMath.js';

const NUMBERS = { share: [0.1, 0.15, 0.25] };

export default {
  id: 'echo',
  name: 'Echo',
  rarity: 'rare',
  tags: ['add', 'state'],
  directional: false,
  maxLevel: 3,
  cost: 5,
  describe(level) {
    const percent = Math.round(byLevel(NUMBERS.share, level) * 100);
    return 'Adds ' + percent + '% of the value already banked in this Fire.';
  },
  onPass(ctx) {
    const bonus = boostAdd(byLevel(NUMBERS.share, ctx.level) * ctx.fire.bankedTotal, ctx.boost);
    if (bonus <= 0) {
      ctx.note('+0');
      return;
    }
    ctx.setValue(ctx.value + bonus, addLabel(bonus));
  }
};
