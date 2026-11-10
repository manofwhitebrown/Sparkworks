// Bend: turns the spark to face the part's rotation. The basic road builder.
// Owner: AI-3

export default {
  id: 'bend',
  name: 'Bend',
  rarity: 'common',
  tags: ['route'],
  directional: true,
  maxLevel: 3,
  cost: 2,
  describe() {
    return 'Turns the spark to face the way the part points.';
  },
  onPass(ctx) {
    ctx.turnToFacing();
  }
};
