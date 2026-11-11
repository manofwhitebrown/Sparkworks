// The starting kits ("inventors"). A passive may ONLY change these run fields:
// sparkCount, startValue, firesPerShift, benchSize, shopSlots, shiftStartCoins
// (shiftStartCoins = extra coins at the start of every shift).
// Owner: AI-4

export const INVENTORS = [
  {
    id: 'tinkerbot',
    name: 'Tinkerbot',
    tagline: 'Balanced and friendly. Good at everything, great at nothing.',
    startParts: ['coil', 'coil', 'bend', 'amplifier'],
    startCoins: 6
  },
  {
    id: 'clockmaker',
    name: 'The Clockmaker',
    tagline: 'Loves parts that remember things. Has a bigger bench.',
    startParts: ['counter', 'anvil', 'bend', 'bend'],
    startCoins: 4,
    passive: { benchSize: 1 }
  },
  {
    id: 'drvolt',
    name: 'Dr. Volt',
    tagline: 'Loves splitting. Every spark starts at 2 instead of 1.',
    startParts: ['splitter', 'battery', 'coil', 'bend'],
    startCoins: 5,
    passive: { startValue: 2 }
  },
  {
    id: 'msbounce',
    name: 'Ms. Bounce',
    tagline: 'Loves steering. Starts with Coil, Bend, Spring and Side Amp.',
    startParts: ['coil', 'bend', 'spring', 'sideamp'],
    startCoins: 6,
    passive: { shopSlots: 1 }
  },
  {
    id: 'banker',
    name: 'The Banker',
    tagline: 'Turns coins into power. Starts with Mint, Tollgate and Workbench.',
    startParts: ['mint', 'tollgate', 'workbench', 'coil'],
    startCoins: 4,
    passive: { shiftStartCoins: 2 }
  }
];

// The inventor with this id, or null when it does not exist.
export function getInventor(id) {
  for (let i = 0; i < INVENTORS.length; i++) {
    if (INVENTORS[i].id === id) {
      return INVENTORS[i];
    }
  }
  return null;
}
