// Pure helpers: which mood the music has for a shift, and how big a Fire sounds.
// No audio here, so tests can check the numbers without WebAudio.
// Owner: AI-8
import { SHIFT_RULES } from '../data/shifts.js';

export function isOverloadShift(shift) {
  return SHIFT_RULES.overloadShifts.indexOf(shift) !== -1;
}

// shift is 1..shiftsPerRun. Later shifts get a slightly brighter bed; Overloads are tense.
export function moodForShift(shift) {
  const total = SHIFT_RULES.shiftsPerRun;
  const n = Math.max(1, Math.min(total, Math.floor(Number(shift) || 1)));
  return { tense: isOverloadShift(n), bright: (n - 1) / (total - 1) };
}

// A Fire sounds "big" from this intensity (fireStats) up: it gets the end-of-Fire swell.
export const SWELL_FROM = 0.45;

export function wantsSwell(intensity, passed) {
  return passed === true && typeof intensity === 'number' && intensity >= SWELL_FROM;
}
