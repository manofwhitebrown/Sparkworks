// The tutorial script: a plain list of steps. Keep every message tiny and in plain words.
// target = the data-tut value to spotlight. waitFor = a ui:* event the player triggers,
// or null for a "Got it" button. needsHigher = only advance when the Fire beat the last one.
// Owner: AI-8

export const STEPS = [
  {
    id: 'welcome',
    text: 'Sparks run from the source to the vault. Your parts change them.',
    target: 'board',
    waitFor: null
  },
  {
    id: 'placeCoil',
    text: 'Place the Coil on the glowing cell.',
    target: 'board',
    waitFor: 'ui:placed'
  },
  {
    id: 'fireOne',
    text: 'Press FIRE.',
    target: 'fire',
    waitFor: 'ui:fireDone'
  },
  {
    id: 'amplifierBefore',
    text: 'Now add an Amplifier BEFORE the Coil (closer to the source). Then FIRE.',
    target: 'board',
    waitFor: 'ui:fireDone'
  },
  {
    id: 'orderMatters',
    text: 'Order matters! Amplifier AFTER the Coil gives a bigger number. Swap them and fire again.',
    target: 'board',
    waitFor: 'ui:fireDone',
    needsHigher: true
  },
  {
    id: 'target',
    text: 'Reach the target before your Fires run out. Clear it to open the shop.',
    target: 'hud',
    waitFor: 'ui:shopOpened'
  },
  {
    id: 'shop',
    text: 'Spend coins on new parts. Buy 3 of the same part to level it up.',
    target: 'offers',
    waitFor: null
  },
  {
    id: 'done',
    text: 'That is it. Build something crazy.',
    target: null,
    waitFor: null
  }
];
