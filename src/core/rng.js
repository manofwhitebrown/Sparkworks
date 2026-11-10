// Seeded random numbers. Same seed gives the same numbers on every device. Owner: AI-1

// mulberry32: small, fast, and good enough for a game. Returns numbers in [0, 1).
export function makeRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A simple string hash (FNV-1a) to a 32-bit unsigned number. Handy for turning
// a date like '2026-11-10' into a seed.
export function hashString(text) {
  const s = String(text);
  let hash = 2166136261;
  for (let i = 0; i < s.length; i++) {
    hash ^= s.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
