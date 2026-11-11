// The tutorial script: a plain list of steps. Every sentence is 10 words or fewer.
// target = the data-tut value to spotlight. waitFor = a ui:* event the player triggers,
// or null for a "Got it" button. needsHigher = only advance when the Fire beat the last one.
// failText = shown (and the step stays) when the Fire made 0, so the spark was lost.
// onEnter = a small job to do when the step starts (the lesson swaps the bench).
// Owner: AI-8

export const STEPS = [
  {
    id: 'welcome',
    text: 'Sparks run from the Source to the Vault. Parts change them.',
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
    text: 'Add an Amplifier BEFORE the Coil. Then FIRE.',
    target: 'board',
    waitFor: 'ui:fireDone'
  },
  {
    id: 'orderMatters',
    text: 'Order matters! Swap them so the Amplifier is AFTER. FIRE.',
    target: 'board',
    waitFor: 'ui:fireDone',
    needsHigher: true
  },
  {
    id: 'steerIntro',
    text: 'Parts do not have to be in a line. Bend turns the spark.',
    target: 'bench',
    waitFor: null,
    onEnter: 'steerParts'
  },
  {
    id: 'detour',
    text: 'Build a detour: Bend down, Coil below it, Bend right. FIRE.',
    target: 'board',
    waitFor: 'ui:fireDone',
    failText: 'Lost off the bottom! Only the right edge counts. Add a Bend.'
  },
  {
    id: 'detourSeen',
    text: 'The Coil was off the line. The spark still got it.',
    target: 'board',
    waitFor: null
  },
  {
    id: 'target',
    text: 'Reach the target before your Fires run out. Clear 8 shifts to win.',
    target: 'hud',
    waitFor: 'ui:shopOpened'
  },
  {
    id: 'shop',
    text: 'Spend coins on parts. Buy 3 of a kind to level up.',
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
