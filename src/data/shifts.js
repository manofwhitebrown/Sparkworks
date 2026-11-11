// Numbers for the shifts of a run. Only numbers here, so they are easy to tune.
// Tuned with AI-8's bot (tools/simulate.js): 16 / 1.45 gave smart bot ~20% wins at V1, ~3% at V2.
// Owner: AI-4

export const SHIFT_RULES = {
  shiftsPerRun: 8,
  overloadShifts: [4, 8],
  firesPerShift: 2,
  targetBase: 16,
  targetGrowth: 1.45,
  baseShiftPayout: 4,
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
