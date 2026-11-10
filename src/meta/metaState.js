// STUB: owned by AI-5. The owner will replace this whole file.
export function defaultMeta() {
  return {
    v: 1, dust: 0,
    upgrades: {},
    unlockedParts: [], seenParts: [],
    unlockedInventors: ['tinkerbot'],
    achievements: {},
    wins: {},
    stats: { runs: 0, wins: 0, bestTotal: 0, fires: 0, partsBought: 0 },
    daily: { lastPlayed: '', best: null, streak: 0 },
    tutorialDone: false,
    settings: {
      sound: true, music: true, quality: 'auto', reduceMotion: false, largeText: false,
      colorblind: false, haptics: true, reminders: true,
    },
  };
}
export function repairMeta(meta) {
  const base = defaultMeta();
  if (!meta || typeof meta !== 'object') return base;
  return Object.assign(base, meta);
}
