// Dynamo: gets stronger the more parts you have on the board.
// Owner: AI-3
import { boostAdd, addLabel, byLevel, makeExample } from './partMath.js';

const NUMBERS = { perPart: [1, 2, 3] };

export default {
  id: 'dynamo',
  name: 'Dynamo',
  rarity: 'common',
  tags: ['add'],
  directional: false,
  maxLevel: 3,
  cost: 4,
  describe(level) {
    return 'Adds ' + byLevel(NUMBERS.perPart, level) + ' for every part on the board.';
  },
  example(level) {
    return makeExample(this, level);
  },
  onPass(ctx) {
    const each = byLevel(NUMBERS.perPart, ctx.level);
    const bonus = boostAdd(each * ctx.fire.partsOnBoard, ctx.boost);
    ctx.setValue(ctx.value + bonus, addLabel(bonus));
  }
};
