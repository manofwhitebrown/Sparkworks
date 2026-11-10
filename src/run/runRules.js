// Small helpers that work out numbers for a run (bench size, fires, shop slots...).
// The inventor passive and the meta bonuses are always added on top of SHIFT_RULES.
// Owner: AI-4

import { SHIFT_RULES } from '../data/shifts.js';
import { CONFIG } from '../data/config.js';
import { getInventor } from '../data/inventors.js';
import { getVoltage } from '../data/voltage.js';

// The bonuses of a run with every missing number set to 0.
export function cleanBonuses(bonuses) {
  const b = bonuses || {};
  return {
    startCoins: b.startCoins || 0,
    benchSize: b.benchSize || 0,
    shopSlots: b.shopSlots || 0,
    freeRerolls: b.freeRerolls || 0,
    extraFires: b.extraFires || 0
  };
}

// A number from the inventor passive (0 when there is none).
function passiveNumber(run, field) {
  const inventor = getInventor(run.inventorId);
  if (inventor && inventor.passive && inventor.passive[field] !== undefined) {
    return inventor.passive[field];
  }
  return 0;
}

export function benchSizeOf(run) {
  return SHIFT_RULES.startBenchSize + run.bonuses.benchSize + passiveNumber(run, 'benchSize');
}

export function shopSlotsOf(run) {
  return SHIFT_RULES.startShopSlots + run.bonuses.shopSlots + passiveNumber(run, 'shopSlots');
}

export function firesPerShiftOf(run) {
  return SHIFT_RULES.firesPerShift + run.bonuses.extraFires + passiveNumber(run, 'firesPerShift');
}

// The sparkCount and startValue a machine has at the start of every shift
// (before twists). A passive REPLACES the default, it does not add to it.
export function baseSparkFields(inventorId) {
  const inventor = getInventor(inventorId);
  const fields = { sparkCount: CONFIG.sparkCount, startValue: CONFIG.startValue };
  if (inventor && inventor.passive) {
    if (inventor.passive.sparkCount !== undefined) {
      fields.sparkCount = inventor.passive.sparkCount;
    }
    if (inventor.passive.startValue !== undefined) {
      fields.startValue = inventor.passive.startValue;
    }
  }
  return fields;
}

// target(shift) = round(targetBase * targetGrowth^(shift - 1) * voltageMultiplier)
export function targetFor(shift, voltageLevel) {
  const multiplier = getVoltage(voltageLevel).targetMultiplier;
  const raw = SHIFT_RULES.targetBase * Math.pow(SHIFT_RULES.targetGrowth, shift - 1) * multiplier;
  return Math.round(raw);
}

// What a part sells for: max(1, floor(cost * sellFraction * level)).
export function sellValueOf(part, level) {
  const raw = Math.floor(part.cost * SHIFT_RULES.sellFraction * level);
  return Math.max(1, raw);
}
