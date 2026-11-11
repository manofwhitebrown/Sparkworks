// Numbers for the shifts of a run. Only numbers here, so they are easy to tune.
// Tuned with AI-8's bot (tools/simulate.js): 16 / 1.40, payout 5 gives smart bot ~53% V1, ~29% V2, ~13% V3, ~5% V4.
// Owner: AI-4

export const SHIFT_RULES = {
  shiftsPerRun: 8,
  overloadShifts: [4, 8],
  firesPerShift: 2,
  targetBase: 16,
  targetGrowth: 1.40,
  baseShiftPayout: 5,
  unusedFireCoins: 1,
  overkillStepRatio: 0.5,
  overkillMaxCoins: 4,
  startBenchSize: 5,
  startShopSlots: 3,
  rerollStartPrice: 1,
  rerollStep: 1,
  sellFraction: 0.5,
  // Shop rarity weights per band of shifts (inclusive on both ends).
  rarityBands: [
    { fromShift: 1, toShift: 2, common: 85, rare: 15, legendary: 0 },
    { fromShift: 3, toShift: 5, common: 62, rare: 30, legendary: 8 },
    { fromShift: 6, toShift: 8, common: 44, rare: 38, legendary: 18 }
  ]
};

// Gentle mode (beginners and kids): one more Fire, easier targets, a few more start coins.
export const GENTLE_RULES = {
  extraFires: 1,
  targetMultiplier: 0.7,
  startCoins: 4
};

// Bonus tiles on the floor of the board. None on shift 1, one from shift 2, two from shift 5.
// Early tiles add a small number; later tiles are sometimes a multiplier.
export const BONUS_CELL_RULES = {
  firstShift: 2,
  secondTileShift: 5,
  laterShift: 5,
  addMin: 3,
  addMax: 6,
  laterAddMin: 4,
  laterAddMax: 8,
  multChance: 0.5,
  multAmount: 2
};

// Simple rules for the tip on the loss screen.
export const LOSS_TIP_RULES = {
  unspentCoins: 6
};

// Stars, medals and the size of the light show on the shop and results screens.
// A shift scores 1 star for reaching the target, 2 for 1.5x, 3 for 2.5x.
// A won run earns a medal from its share of all possible stars.
export const CELEBRATION_RULES = {
  starRatios: [1, 1.5, 2.5],
  silverShare: 0.4,
  goldShare: 0.7,
  burstPieces: { low: 12, medium: 30, high: 60 },
  flightMsMin: 260,
  flightMsMax: 520,
  staggerStepMs: 70,
  staggerMaxMs: 350
};
