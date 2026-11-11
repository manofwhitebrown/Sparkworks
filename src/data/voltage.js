// Difficulty levels ("voltage"). twistsByShift maps a shift number to twist ids.
// Twist ids come from AI-3: deadCell, twoDeadCells, noSplit, fewerSparks, rust, coldStart,
// closedRow, loneSpark, noMult.
// Owner: AI-4

export const VOLTAGES = [
  {
    level: 1,
    name: 'Low Voltage',
    targetMultiplier: 1.0,
    twistsByShift: { 4: ['deadCell'], 8: ['twoDeadCells'] }
  },
  {
    level: 2,
    name: 'Mains',
    targetMultiplier: 1.35,
    twistsByShift: { 4: ['noSplit'], 8: ['rust'] }
  },
  {
    level: 3,
    name: 'High Voltage',
    targetMultiplier: 1.4,
    twistsByShift: {
      4: ['noSplit', 'deadCell'],
      5: ['fewerSparks'],
      6: ['coldStart'],
      8: ['rust', 'twoDeadCells']
    }
  },
  {
    level: 4,
    name: 'Overload',
    targetMultiplier: 1.7,
    // Every shift from 3 on has one twist, the two Overloads (4 and 8) have two.
    twistsByShift: {
      3: ['fewerSparks'],
      4: ['noSplit', 'deadCell'],
      5: ['coldStart'],
      6: ['noMult'],
      7: ['rust'],
      8: ['rust', 'twoDeadCells']
    }
  }
];

// The voltage with this level (1..4). Unknown levels give level 1.
export function getVoltage(level) {
  for (let i = 0; i < VOLTAGES.length; i++) {
    if (VOLTAGES[i].level === level) {
      return VOLTAGES[i];
    }
  }
  return VOLTAGES[0];
}
