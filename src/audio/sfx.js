// All the short game sounds, made in code. playPass is the signature rising pluck.
// Owner: AI-8

import { getContext, isSoundOn } from './audio.js';
import { playTone, playClick } from './voices.js';
import { noteFreq, scaleLength } from './scale.js';

// Sounds closer together than this (seconds) are dropped, so 20 in one frame do not stack.
const MIN_GAP = 0.035;
const lastPlayed = {};

function tooSoon(name) {
  const ctx = getContext();
  if (!ctx) {
    return true;
  }
  const last = lastPlayed[name];
  if (last !== undefined && ctx.currentTime - last < MIN_GAP) {
    return true;
  }
  lastPlayed[name] = ctx.currentTime;
  return false;
}

function sizeOf(options) {
  if (!options || typeof options.size !== 'number') {
    return 0;
  }
  return Math.max(0, Math.min(1, options.size));
}

// A pluck for each part the spark passes. The pitch climbs the scale with `step`.
export function playPass(step) {
  if (!isSoundOn() || tooSoon('pass')) {
    return;
  }
  const index = Math.max(0, Math.floor(step || 0));
  const high = index >= scaleLength();
  const freq = noteFreq(index, 0);
  playTone({ type: 'triangle', freq: freq, dur: 0.28, gain: 0.16, attack: 0.006, lowpass: high ? 6000 : 3200 });
  if (high) {
    // Up on the top notes: a quiet bright overtone instead of getting louder.
    playTone({ type: 'sine', freq: freq * 2, dur: 0.18, gain: 0.05, attack: 0.004, lowpass: 7000 });
  }
}

// A chord-like hit. Bigger banked numbers are a little louder and lower.
function playBank(options) {
  const size = sizeOf(options);
  const shift = size > 0.6 ? -1 : 0;
  const gain = 0.12 + size * 0.1;
  playTone({ type: 'triangle', freq: noteFreq(0, shift), dur: 0.5, gain: gain, lowpass: 2600 });
  playTone({ type: 'sine', freq: noteFreq(2, shift), dur: 0.45, gain: gain * 0.8, start: 0.02 });
  playTone({ type: 'sine', freq: noteFreq(4, shift), dur: 0.4, gain: gain * 0.7, start: 0.04 });
}

function playLost() {
  playTone({ type: 'sine', freq: 330, slideTo: 250, dur: 0.16, gain: 0.08, lowpass: 1100 });
  playTone({ type: 'sine', freq: 250, slideTo: 170, dur: 0.22, gain: 0.07, start: 0.09, lowpass: 900 });
}

// Each entry plays one named sound. Kept as small functions so each is easy to tune.
const SOUNDS = {
  tap: function tap() {
    playClick({ freq: 2200, dur: 0.025, gain: 0.07 });
    playTone({ type: 'sine', freq: 520, dur: 0.06, gain: 0.08 });
  },
  place: function place() {
    playClick({ freq: 900, dur: 0.05, gain: 0.12 });
    playTone({ type: 'triangle', freq: 220, slideTo: 140, dur: 0.14, gain: 0.2, lowpass: 1500 });
  },
  rotate: function rotate() {
    playTone({ type: 'triangle', freq: 360, slideTo: 540, dur: 0.1, gain: 0.12, lowpass: 2500 });
  },
  buy: function buy() {
    playTone({ type: 'triangle', freq: noteFreq(2, 0), dur: 0.18, gain: 0.14 });
    playTone({ type: 'triangle', freq: noteFreq(5, 0), dur: 0.3, gain: 0.14, start: 0.07 });
  },
  sell: function sell() {
    playTone({ type: 'triangle', freq: noteFreq(5, 0), dur: 0.14, gain: 0.12 });
    playTone({ type: 'triangle', freq: noteFreq(2, 0), dur: 0.22, gain: 0.12, start: 0.06 });
  },
  reroll: function reroll() {
    playClick({ freq: 1500, dur: 0.04, gain: 0.08 });
    playClick({ freq: 1900, dur: 0.04, gain: 0.08, start: 0.06 });
    playClick({ freq: 2400, dur: 0.04, gain: 0.08, start: 0.12 });
  },
  merge: function merge() {
    playTone({ type: 'triangle', freq: noteFreq(0, 0), dur: 0.4, gain: 0.14 });
    playTone({ type: 'triangle', freq: noteFreq(2, 0), dur: 0.4, gain: 0.12, start: 0.08 });
    playTone({ type: 'sine', freq: noteFreq(5, 0), dur: 0.5, gain: 0.12, start: 0.16 });
  },
  fire: function fire() {
    playTone({ type: 'sine', freq: 140, slideTo: 420, dur: 0.35, gain: 0.2, attack: 0.04, lowpass: 1800 });
    playClick({ freq: 3000, dur: 0.06, gain: 0.06 });
  },
  bank: playBank,
  // A soft two-note sigh when a spark is lost. Quiet on purpose: losing a spark is not an error.
  lost: playLost,
  fizzle: playLost,
  // A little pop when a spark picks up a bonus tile.
  bonus: function bonus() {
    playTone({ type: 'sine', freq: 520, slideTo: 1040, dur: 0.12, gain: 0.13, attack: 0.004, lowpass: 4000 });
    playClick({ freq: 2600, dur: 0.03, gain: 0.05 });
  },
  // A bright, gentle chime for the Hint button.
  hint: function hint() {
    playTone({ type: 'sine', freq: noteFreq(7, 0), dur: 0.35, gain: 0.1 });
    playTone({ type: 'sine', freq: noteFreq(9, 0), dur: 0.45, gain: 0.1, start: 0.1 });
  },
  win: function win() {
    const notes = [0, 2, 4, 5, 7];
    for (let i = 0; i < notes.length; i++) {
      playTone({ type: 'triangle', freq: noteFreq(notes[i], 0), dur: 0.6, gain: 0.13, start: i * 0.14, lowpass: 3500 });
    }
    playTone({ type: 'sine', freq: noteFreq(7, 0), dur: 1.4, gain: 0.1, start: 0.7 });
  },
  lose: function lose() {
    const notes = [4, 3, 1, 0];
    for (let i = 0; i < notes.length; i++) {
      playTone({ type: 'sine', freq: noteFreq(notes[i], -1), dur: 0.7, gain: 0.14, start: i * 0.22, lowpass: 1400 });
    }
  },
  unlock: function unlock() {
    playTone({ type: 'sine', freq: noteFreq(4, 0), dur: 0.5, gain: 0.12 });
    playTone({ type: 'sine', freq: noteFreq(7, 0), dur: 0.6, gain: 0.12, start: 0.12 });
    playTone({ type: 'triangle', freq: noteFreq(9, 0), dur: 1.2, gain: 0.1, start: 0.24 });
  },
  error: function error() {
    playTone({ type: 'triangle', freq: 200, dur: 0.12, gain: 0.14, lowpass: 900 });
    playTone({ type: 'triangle', freq: 170, dur: 0.16, gain: 0.14, start: 0.1, lowpass: 900 });
  },
  overload: function overload() {
    playTone({ type: 'triangle', freq: 110, slideTo: 90, dur: 0.55, gain: 0.2, lowpass: 700 });
    playTone({ type: 'sine', freq: 165, dur: 0.5, gain: 0.1, start: 0.05, lowpass: 900 });
  }
};

export function playSfx(name, options) {
  if (!isSoundOn()) {
    return;
  }
  if (name === 'pass') {
    playPass(options && options.step ? options.step : 0);
    return;
  }
  const sound = SOUNDS[name];
  if (!sound || tooSoon(name)) {
    return;
  }
  sound(options);
}
