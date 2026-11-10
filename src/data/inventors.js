// The starting kits ("inventors"). A passive may ONLY change these run fields:
// sparkCount, startValue, firesPerShift, benchSize, shopSlots.
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
    tagline: 'Loves splitting. Fewer sparks, but each one starts stronger.',
    startParts: ['splitter', 'splitter', 'battery', 'coil'],
    startCoins: 5,
    passive: { sparkCount: 2, startValue: 2 }
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
