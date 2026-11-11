// Bouncer: sends the spark UP or DOWN with a coin flip (seeded rng). Higher levels also add a bonus.
// Owner: AI-3
import { boostAdd, addLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { add: [0, 2, 5] };

export default {
  id: 'bouncer',
  name: 'Bouncer',
  rarity: 'common',
  tags: ['route', 'risk'],
  directional: false,
  maxLevel: 3,
  cost: 3,
  describe(level) {
    const add = byLevel(NUMBERS.add, level);
    if (add === 0) {
      return 'Sends the spark UP or DOWN. A coin flip.';
    }
    return 'Sends the spark UP or DOWN. A coin flip. Adds ' + add + '.';
  },
  example(level) {
    return makeExample(this, level);
  },
  onPass(ctx) {
    const bonus = boostAdd(byLevel(NUMBERS.add, ctx.level), ctx.boost);
    if (bonus > 0) {
      ctx.setValue(ctx.value + bonus, addLabel(bonus));
    }
    if (ctx.rng() < 0.5) {
      ctx.setDir('up');
      ctx.note('up');
    } else {
      ctx.setDir('down');
      ctx.note('down');
    }
  }
};
