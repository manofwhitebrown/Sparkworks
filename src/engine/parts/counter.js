// Counter: every Nth spark that passes gets a big multiplier.
// Owner: AI-3
import { boostMult, multLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { every: [3, 3, 2], mult: [3, 4, 4] };

export default {
  id: 'counter',
  name: 'Counter',
  rarity: 'common',
  tags: ['state'],
  directional: false,
  maxLevel: 3,
  cost: 4,
  describe(level) {
    const n = byLevel(NUMBERS.every, level);
    const word = n === 2 ? '2nd' : '3rd';
    return 'Every ' + word + ' spark gets x' + byLevel(NUMBERS.mult, level) + '.';
  },
  example(level) {
    return makeExample(this, level, { state: { count: byLevel(NUMBERS.every, level) - 1 } });
  },
  onPass(ctx) {
    const every = byLevel(NUMBERS.every, ctx.level);
    const count = (ctx.state.count || 0) + 1;
    if (count >= every) {
      ctx.state.count = 0;
      const m = boostMult(byLevel(NUMBERS.mult, ctx.level), ctx.boost);
      ctx.setValue(ctx.value * m, multLabel(m));
      return;
    }
    ctx.state.count = count;
    ctx.note(count + '/' + every);
  }
};
