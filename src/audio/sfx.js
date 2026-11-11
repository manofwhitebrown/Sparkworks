// All the short game sounds, made in code. playPass is the signature rising pluck.
// Owner: AI-8

import { getContext, isSoundOn } from './audio.js';
import { playTone, playClick } from './voices.js';
import { noteFreq, scaleLength } from './scale.js';

// Sounds closer together than this (seconds) are dropped, so 20 in one frame do not stack.
const MIN_GAP = 0.035;
const lastPlayed = {};

// Facts the reactions module hands us: how big the current Fire is (0..1) and the level of the
// last merge. Sounds read these when the caller gives no options, so no other file has to change.
const soundContext = { intensity: 0, mergeLevel: 2 };

export function setSoundContext(parts) {
  if (!parts) {
    return;
  }
  if (typeof parts.intensity === 'number' && Number.isFinite(parts.intensity)) {
    soundContext.intensity = Math.max(0, Math.min(1, parts.intensity));
  }
  if (typeof parts.mergeLevel === 'number' && Number.isFinite(parts.mergeLevel)) {
    soundContext.mergeLevel = Math.max(2, Math.min(3, Math.floor(parts.mergeLevel)));
  }
}

export function getSoundContext() {
  return { intensity: soundContext.intensity, mergeLevel: soundContext.mergeLevel };
}

// Notes that start later are scheduled with a timer, so each one asks for its audio nodes only
// when it plays (the node budget is small: a long chord would otherwise be dropped).
function later(ms, fn) {
  setTimeout(fn, ms);
}

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
  const size = options && typeof options.size === 'number' ? sizeOf(options) : soundContext.intensity;
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
  // Level 2 is a short rising three-note lift. Level 3 (the top) adds a bright sparkle on top.
  merge: function merge(options) {
    const level = options && typeof options.level === 'number' ? options.level : soundContext.mergeLevel;
    playTone({ type: 'triangle', freq: noteFreq(0, 0), dur: 0.4, gain: 0.14 });
    playTone({ type: 'triangle', freq: noteFreq(2, 0), dur: 0.4, gain: 0.12, start: 0.08 });
    playTone({ type: 'sine', freq: noteFreq(5, 0), dur: 0.5, gain: 0.12, start: 0.16 });
    if (level >= 3) {
      later(240, function sparkle() {
        playTone({ type: 'sine', freq: noteFreq(7, 0), dur: 0.35, gain: 0.1 });
        playTone({ type: 'sine', freq: noteFreq(9, 0), dur: 0.5, gain: 0.09, start: 0.1 });
      });
    }
  },
  // A rising shimmer for the end of a big Fire. size 0..1 sets how long and how high it climbs.
  swell: function swell(options) {
    const size = options && typeof options.size === 'number' ? sizeOf(options) : soundContext.intensity;
    playTone({ type: 'sine', freq: noteFreq(0, 0), slideTo: noteFreq(5, 0), dur: 0.5 + size * 0.5, gain: 0.07 + size * 0.07, attack: 0.15, lowpass: 3000 });
    if (size > 0.6) {
      later(180, function top() {
        playTone({ type: 'triangle', freq: noteFreq(7, 0), dur: 0.8, gain: 0.07, attack: 0.05 });
      });
    }
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
  // A rising five-note run, a held chord, then a quiet sparkle. Notes are staggered with timers.
  win: function win() {
    const notes = [0, 2, 4, 5, 7];
    for (let i = 0; i < notes.length; i++) {
      const index = notes[i];
      later(i * 140, function note() {
        playTone({ type: 'triangle', freq: noteFreq(index, 0), dur: 0.6, gain: 0.13, lowpass: 3500 });
      });
    }
    later(720, function chord() {
      playTone({ type: 'sine', freq: noteFreq(5, 0), dur: 1.4, gain: 0.09 });
      playTone({ type: 'sine', freq: noteFreq(7, 0), dur: 1.4, gain: 0.09 });
      playTone({ type: 'triangle', freq: noteFreq(9, 0), dur: 1.2, gain: 0.07, start: 0.12 });
    });
  },
  // A slow, soft step down with a warm low note under it. Calm, not harsh.
  lose: function lose() {
    const notes = [4, 3, 1, 0];
    for (let i = 0; i < notes.length; i++) {
      const index = notes[i];
      later(i * 240, function note() {
        playTone({ type: 'sine', freq: noteFreq(index, -1), dur: 0.8, gain: 0.13, lowpass: 1400 });
      });
    }
    later(960, function low() {
      playTone({ type: 'sine', freq: noteFreq(0, -2), dur: 1.6, gain: 0.1, attack: 0.2, lowpass: 600 });
    });
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
