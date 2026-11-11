// Jackpot: a legendary gamble. A small chance for a huge multiplier, otherwise a small loss.
// A boost makes the win bigger but never the chance or the loss.
// Owner: AI-3
import { boostMult, multLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { chance: [0.2, 0.25, 0.3], win: [20, 25, 30], lose: 0.9 };

export default {
  id: 'jackpot',
  name: 'Jackpot',
  rarity: 'legendary',
  tags: ['risk'],
  directional: false,
  maxLevel: 3,
  cost: 10,
  describe(level) {
    const percent = Math.round(byLevel(NUMBERS.chance, level) * 100);
    return 'A ' + percent + '% chance of x' + byLevel(NUMBERS.win, level) + '. Otherwise x' + NUMBERS.lose + '.';
  },
  example(level) {
    return makeExample(this, level, { rng: 0 });
  },
  onPass(ctx) {
    if (ctx.rng() < byLevel(NUMBERS.chance, ctx.level)) {
      const m = boostMult(byLevel(NUMBERS.win, ctx.level), ctx.boost);
      ctx.setValue(ctx.value * m, multLabel(m));
      return;
    }
    ctx.setValue(ctx.value * NUMBERS.lose, multLabel(NUMBERS.lose));
  }
};
