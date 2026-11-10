// Small pure helpers shared by the part files: boost maths, labels, directions.
// They never touch the board or the ctx, so parts stay deterministic.
// Owner: AI-3

const DIR_NAMES = ['right', 'down', 'left', 'up'];
const OPPOSITE = { right: 'left', left: 'right', up: 'down', down: 'up' };

// A multiplier m becomes 1 + (m - 1) * boost (contract section 6).
export function boostMult(m, boost) {
  return 1 + (m - 1) * boost;
}

// A flat bonus b becomes b * boost.
export function boostAdd(b, boost) {
  return b * boost;
}

// Round to at most 2 decimals and drop trailing zeros: 2.50 -> '2.5'.
function trimNumber(n) {
  const rounded = Math.round(n * 100) / 100;
  return String(rounded);
}

// Short labels for the spark; they stay within 6 characters.
export function addLabel(n) {
  return ('+' + trimNumber(n)).slice(0, 6);
}

export function multLabel(n) {
  return ('x' + trimNumber(n)).slice(0, 6);
}

// Direction name for a rotation number 0..3.
export function dirOfRot(rot) {
  return DIR_NAMES[((rot % 4) + 4) % 4];
}

export function oppositeDir(dir) {
  return OPPOSITE[dir] || dir;
}

export function isOdd(value) {
  return Math.floor(value) % 2 !== 0;
}

// Pick the level entry from a list of 3 numbers (level 1..3).
export function byLevel(list, level) {
  const index = Math.min(Math.max(level, 1), list.length) - 1;
  return list[index];
}
