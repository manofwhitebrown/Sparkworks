// Turnstile: a rotating gate. Each spark takes the next road in a cycle:
// 1st turns to face the rotation, 2nd goes straight, 3rd turns to the opposite side, then repeat.
// Owner: AI-3
import { dirOfRot } from './partMath.js';

export default {
  id: 'turnstile',
  name: 'Turnstile',
  rarity: 'rare',
  tags: ['route'],
  directional: true,
  maxLevel: 3,
  cost: 5,
  describe() {
    return 'Each spark takes the next road: first the way it points, then straight, then the opposite way.';
  },
  onPass(ctx) {
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
