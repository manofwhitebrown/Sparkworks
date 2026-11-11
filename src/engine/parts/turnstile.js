// Turnstile: a rotating gate. Each spark takes the next road in a cycle:
// 1st turns to face the rotation, 2nd goes straight, 3rd turns to the opposite side, then repeat.
// Owner: AI-3
import { dirOfRot, dirWord, boostAdd, byLevel } from './partMath.js';

// A small bonus on every touch, so the part is worth its slot even on a short road.
const NUMBERS = { add: [2, 4, 6] };

export default {
  id: 'turnstile',
  name: 'Turnstile',
  rarity: 'rare',
  tags: ['route'],
  directional: true,
  maxLevel: 3,
  cost: 5,
  describe(level, rot) {
    return 'Each spark takes the next road: ' + dirWord(rot) + ', then straight, then ' + dirWord(rot === undefined ? undefined : rot + 2) + '. Adds ' + byLevel(NUMBERS.add, level) + '.';
  },
  example() {
    return null;
  },
  onPass(ctx) {
    const bonus = boostAdd(byLevel(NUMBERS.add, ctx.level), ctx.boost);
    ctx.setValue(ctx.value + bonus, '+' + bonus);
    const step = ctx.state.step || 0;
    if (step === 0) {
      ctx.setDir(dirOfRot(ctx.rot));
      ctx.note('side A');
    } else if (step === 1) {
      ctx.note('ahead');
    } else {
      ctx.setDir(dirOfRot(ctx.rot + 2));
      ctx.note('side B');
    }
    ctx.state.step = (step + 1) % 3;
  }
};
