// Anvil: adds more each time a spark passes it in the same Fire.
// Owner: AI-3
import { boostAdd, addLabel, byLevel } from './partMath.js';

const NUMBERS = { perPass: [2, 3, 4] };

export default {
  id: 'anvil',
  name: 'Anvil',
  rarity: 'common',
  tags: ['add', 'state'],
  directional: false,
  maxLevel: 3,
  cost: 4,
  describe(level) {
    return 'Adds +' + byLevel(NUMBERS.perPass, level) + ' times the number of sparks that passed so far (this one included).';
  },
  onPass(ctx) {
    const passes = (ctx.state.passes || 0) + 1;
    ctx.state.passes = passes;
    const bonus = boostAdd(byLevel(NUMBERS.perPass, ctx.level) * passes, ctx.boost);
    ctx.setValue(ctx.value + bonus, addLabel(bonus));
  }
};
