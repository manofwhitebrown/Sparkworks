// The 6 permanent upgrades bought with Spark Dust. Prices rise per level.
// Owner: AI-5
//
// ALL Spark Dust numbers live in this file (payouts here, prices below) and ALL unlock
// thresholds live at the top of achievements.js, so balance can be changed in one pass.

// Dust paid when a run ends:
//   (base + perShiftCleared x shiftsCleared + (won ? winBonus : 0) + perVoltage x (voltage - 1))
//   x (1 + boostPercentPerLevel / 100 x dustBoost level), rounded down.
export const DUST_RULES = {
  base: 2,
  perShiftCleared: 2,
  winBonus: 10,
  perVoltage: 3,
  boostPercentPerLevel: 10
};

export const WORKSHOP_UPGRADES = [
  {
    id: 'startCoins',
    name: 'Seed Money',
    description: '+1 starting coin per level.',
    maxLevel: 5,
    costs: [8, 12, 18, 26, 36]
  },
  {
    id: 'benchSize',
    name: 'Bigger Bench',
    description: '+1 bench slot per level.',
    maxLevel: 3,
    costs: [15, 30, 50]
  },
  {
    id: 'shopSlots',
    name: 'Wider Shelf',
    description: '+1 offer in every shop.',
    maxLevel: 1,
    costs: [40]
  },
  {
    id: 'freeRerolls',
    name: 'Free Reroll',
    description: '+1 free shop reroll per shift.',
    maxLevel: 3,
    costs: [12, 24, 40]
  },
  {
    id: 'extraFires',
    name: 'Spare Fuse',
    description: '+1 Fire in every shift.',
    maxLevel: 1,
    costs: [120]
  },
  {
    id: 'dustBoost',
    name: 'Dust Magnet',
    description: '+10% Spark Dust per level.',
    maxLevel: 5,
    costs: [10, 16, 24, 34, 46]
  }
];
