// Flywheel: the multiplier grows with every pass in the same Fire.
// Owner: AI-3
import { boostMult, multLabel, byLevel, times, makeExample } from './partMath.js';

const NUMBERS = { perPass: [0.2, 0.3, 0.4] };

export default {
  id: 'flywheel',
  name: 'Flywheel',
  rarity: 'rare',
  tags: ['mult', 'state'],
  directional: false,
  maxLevel: 3,
  cost: 6,
  describe(level) {
    const each = byLevel(NUMBERS.perPass, level);
    return 'Grows each spark: ' + times(1 + each) + ', ' + times(1 + each * 2) + ', ' + times(1 + each * 3) + ', and so on.';
  },
  example(level) {
    return makeExample(this, level);
  },
  onPass(ctx) {
    const passes = (ctx.state.passes || 0) + 1;
    ctx.state.passes = passes;
    const raw = 1 + byLevel(NUMBERS.perPass, ctx.level) * passes;
    const m = boostMult(raw, ctx.boost);
    ctx.setValue(ctx.value * m, multLabel(m));
  }
};
