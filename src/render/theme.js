// All colors, fonts, sizes and timing numbers for the board renderer.
// The palette mirrors section 10 of the contract exactly.
// Owner: AI-6

export const THEME = {
  colors: {
    bg: '#0B0E14',
    panel: '#141A24',
    panel2: '#1C2432',
    line: '#2A3446',
    text: '#E8EDF5',
    textDim: '#8A97AD',
    spark: '#FFC857',
    sparkHot: '#FFF1C2',
    accent: '#4FD1C5',
    good: '#7BE495',
    bad: '#FF6B6B',
    common: '#9FB3C8',
    rare: '#5AA9FF',
    legendary: '#C77DFF'
  },
  tagColors: {
    add: '#FFC857',
    mult: '#4FD1C5',
    route: '#8A97AD',
    split: '#5AA9FF',
    state: '#C77DFF',
    boost: '#7BE495',
    risk: '#FF6B6B',
    economy: '#FFD166'
  },
  coinColor: '#FFD166',
  font: {
    family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    numbers: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace'
  },
  maxDpr: 2,
  // 'low' quality also draws fewer pixels (weak phones are limited by fill rate, not by JavaScript)
  mediumDpr: 1.5,
  lowDpr: 1.25,
  particleCaps: { low: 30, medium: 80, high: 150 },
  timing: {
    moveMs: 130,
    minMoveMs: 45,
    rampPerPass: 0.9,
    popMs: 260,
    numberMs: 700,
    bankMs: 420,
    fizzleMs: 300,
    blockedMs: 200,
    endMs: 350,
    shakeMs: 260,
    skipBurstMs: 4,
    reduceMotionSpeedUp: 1.5,
    autoQualityFrameMs: 24
  },
  dimWhilePlaying: 0.12,
  maxShakePx: 7
};
