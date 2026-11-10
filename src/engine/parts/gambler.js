// Gambler: a random multiplier from the seeded rng. Boost only helps the winning rolls
// (multipliers above 1); the x0.5 roll is not made worse by a boost.
// Owner: AI-3
import { boostMult, multLabel, byLevel } from './partMath.js';

// Each entry is [multiplier, chance]. Chances of one level add up to 1.
const NUMBERS = {
  rolls: [
    [[0.5, 0.25], [1, 0.25], [2, 0.3], [4, 0.2]],
    [[0.5, 0.15], [1, 0.25], [2, 0.35], [4, 0.25]],
    [[1, 0.25], [2, 0.4], [4, 0.35]]
  ]
};

function describeRolls(table) {
  const parts = [];
  for (let i = 0; i < table.length; i++) {
    parts.push('x' + table[i][0] + ' (' + Math.round(table[i][1] * 100) + '%)');
  }
  return parts.join(', ');
}

export default {
  id: 'gambler',
  name: 'Gambler',
  rarity: 'common',
  tags: ['risk'],
  directional: false,
  maxLevel: 3,
  cost: 3,
  describe(level) {
    return 'Random multiplier: ' + describeRolls(byLevel(NUMBERS.rolls, level)) + '.';
  },
  onPass(ctx) {
    const table = byLevel(NUMBERS.rolls, ctx.level);
    const roll = ctx.rng();
    let total = 0;
    let m = table[table.length - 1][0];
    for (let i = 0; i < table.length; i++) {
      total += table[i][1];
      if (roll < total) {
        m = table[i][0];
        break;
      }
    }
    if (m > 1) {
      m = boostMult(m, ctx.boost);
    }
    ctx.setValue(ctx.value * m, multLabel(m));
  }
};
