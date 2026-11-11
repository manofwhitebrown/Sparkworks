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
export function trimNumber(n) {
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

// Direction word for texts: 'DOWN'. When the rotation is unknown (undefined), say it in plain words.
export function dirWord(rot) {
  if (rot === undefined || rot === null) {
    return 'the way it points';
  }
  return dirOfRot(rot).toUpperCase();
}

// '+3' style numbers for texts.
export function plus(n) {
  return '+' + trimNumber(n);
}

// 'x2.5' style numbers for texts.
export function times(n) {
  return 'x' + trimNumber(n);
}

// Join words for a text: ['x1', 'x2', 'x4'] -> 'x1, x2 or x4'.
export function orList(items) {
  if (items.length < 2) {
    return items.join('');
  }
  return items.slice(0, items.length - 1).join(', ') + ' or ' + items[items.length - 1];
}

// Sample spark for the card text "2 -> 5". Runs the part's real onPass on a tiny fake ctx so the
// example can never disagree with the real numbers. Returns null when nothing happens to the number.
export function makeExample(part, level, options) {
  const opts = options || {};
  const before = opts.value === undefined ? 2 : opts.value;
  const ctx = {
    value: before,
    dir: opts.dir || 'right',
    level: level,
    rot: 0,
    boost: 1,
    x: opts.x === undefined ? 1 : opts.x,
    y: 1,
    cols: 5,
    rows: 4,
    state: opts.state || {},
    fire: opts.fire || { sparkNumber: 1, bankedTotal: 0, bankedCount: 0, partsOnBoard: 5 },
    rng() { return opts.rng === undefined ? 0.5 : opts.rng; },
    setValue(v) { ctx.value = Math.min(Math.max(v, 0), 1e300); },
    setDir() {},
    turnToFacing() {},
    split() {},
    addCoins() {},
    disable() {},
    note() {}
  };
  part.onPass(ctx);
  if (ctx.value === before) {
    return null;
  }
  return { before: before, after: Math.round(ctx.value * 100) / 100 };
}
