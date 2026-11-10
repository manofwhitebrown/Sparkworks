// Capacitor: the first spark leaves some value behind, the next spark picks it up.
// Owner: AI-3
import { addLabel, byLevel } from './partMath.js';

const NUMBERS = { store: [0.4, 0.6, 0.8] };

export default {
  id: 'capacitor',
  name: 'Capacitor',
  rarity: 'common',
  tags: ['state'],
  directional: false,
  maxLevel: 3,
  cost: 4,
  describe(level) {
    const percent = Math.round(byLevel(NUMBERS.store, level) * 100);
    return 'One spark stores ' + percent + '% of its value. The next spark gets it added.';
  },
  onPass(ctx) {
    if (ctx.state.full) {
      const stored = ctx.state.amount || 0;
      ctx.state.full = false;
      ctx.state.amount = 0;
      ctx.setValue(ctx.value + stored, addLabel(stored));
      return;
    }
    const share = Math.min(byLevel(NUMBERS.store, ctx.level) * ctx.boost, 1);
    const stored = ctx.value * share;
    ctx.state.full = true;
    ctx.state.amount = stored;
    ctx.setValue(ctx.value - stored, 'store');
  }
};
