// A very quiet generative ambient bed: slow detuned drones, a low-pass filter, a slow LFO
// and an occasional soft bell from the shared pentatonic scale. Low CPU.
// Owner: AI-8

import { getContext, getMusicGain, isMusicOn } from './audio.js';
import { noteFreq } from './scale.js';

const FADE_SECONDS = 1;
const BED_LEVEL = 0.05; // very quiet so it never fights the playPass melody

let running = false;
let volume = 1;
let bed = null;
let bellTimer = null;
let stopTimer = null;
let mood = { tense: false, bright: 0 };
const BASE_C2 = noteFreq(0, -2);

function makeBed(ctx, out) {
  const level = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  const lfo = ctx.createOscillator();
  const lfoDepth = ctx.createGain();
  const oscillators = [];
  // Drones sit in a low register: C2, G2 and a slightly detuned C2.
  const freqs = [noteFreq(0, -2), noteFreq(3, -2), noteFreq(0, -2) * 1.004];
  filter.type = 'lowpass';
  filter.frequency.value = 500;
  lfo.frequency.value = 0.07;
  lfoDepth.gain.value = 180;
  lfo.connect(lfoDepth);
  lfoDepth.connect(filter.frequency);
  level.gain.value = 0.0001;
  for (let i = 0; i < freqs.length; i++) {
    const osc = ctx.createOscillator();
    osc.type = i === 1 ? 'sine' : 'triangle';
    osc.frequency.value = freqs[i];
    osc.connect(filter);
    osc.start();
    oscillators.push(osc);
  }
  filter.connect(level);
  level.connect(out);
  lfo.start();
  return { level: level, filter: filter, lfo: lfo, lfoDepth: lfoDepth, oscillators: oscillators };
}

function setBedLevel(ctx, target, seconds) {
  if (!bed) {
    return;
  }
  const now = ctx.currentTime;
  bed.level.gain.cancelScheduledValues(now);
  bed.level.gain.setValueAtTime(bed.level.gain.value, now);
  bed.level.gain.linearRampToValueAtTime(target, now + seconds);
}

// One soft bell, then schedule the next one a random-ish while later.
function ringBell() {
  const ctx = getContext();
  const out = getMusicGain();
  if (!running || !ctx || !out) {
    return;
  }
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const now = ctx.currentTime;
  const index = Math.floor(Math.random() * 5);
  osc.type = 'sine';
  osc.frequency.value = noteFreq(index, -1);
  env.gain.setValueAtTime(0.0001, now);
  env.gain.linearRampToValueAtTime(0.03 * volume, now + 0.05);
  env.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
  osc.connect(env);
  env.connect(out);
  osc.onended = function cleanUp() {
    osc.disconnect();
    env.disconnect();
  };
  osc.start(now);
  osc.stop(now + 2.6);
  bellTimer = setTimeout(ringBell, mood.tense ? 2500 + Math.random() * 3000 : 5000 + Math.random() * 7000);
}

// Push the current mood onto the live bed: a brighter filter as the run goes on, and on a tense
// (Overload) shift a clashing detune on the third drone and a faster LFO. Smooth, never a jump.
function applyMood() {
  const ctx = getContext();
  if (!ctx || !bed) {
    return;
  }
  const now = ctx.currentTime;
  const cutoff = 500 + mood.bright * 450 + (mood.tense ? 150 : 0);
  bed.filter.frequency.setTargetAtTime(cutoff, now, 0.8);
  bed.lfo.frequency.setTargetAtTime(mood.tense ? 0.16 : 0.07, now, 0.8);
  bed.oscillators[2].frequency.setTargetAtTime(BASE_C2 * (mood.tense ? 1.0595 : 1.004), now, 0.8);
}

// mood: { tense: true on Overload shifts, bright: 0..1 how far into the run we are }.
export function setMusicMood(next) {
  const bright = next && typeof next.bright === 'number' && Number.isFinite(next.bright) ? next.bright : 0;
  mood = { tense: !!(next && next.tense), bright: Math.max(0, Math.min(1, bright)) };
  applyMood();
}

export function getMusicMood() {
  return { tense: mood.tense, bright: mood.bright };
}

export function startMusic() {
  const ctx = getContext();
  const out = getMusicGain();
  if (!ctx || !out || !isMusicOn()) {
    return;
  }
  if (stopTimer) {
    clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (!bed) {
    bed = makeBed(ctx, out);
  }
  applyMood();
  setBedLevel(ctx, BED_LEVEL * volume, FADE_SECONDS);
  if (!running) {
    running = true;
    bellTimer = setTimeout(ringBell, 3000);
  }
}

// Fade out over about a second, then shut the oscillators down to save CPU.
export function stopMusic() {
  const ctx = getContext();
  if (!running || !ctx || !bed) {
    running = false;
    return;
  }
  running = false;
  if (bellTimer) {
    clearTimeout(bellTimer);
    bellTimer = null;
  }
  setBedLevel(ctx, 0.0001, FADE_SECONDS);
  const old = bed;
  bed = null;
  stopTimer = setTimeout(function shutDown() {
    for (let i = 0; i < old.oscillators.length; i++) {
      old.oscillators[i].stop();
      old.oscillators[i].disconnect();
    }
    old.lfo.stop();
    old.lfo.disconnect();
    old.lfoDepth.disconnect();
    old.filter.disconnect();
    old.level.disconnect();
    stopTimer = null;
  }, FADE_SECONDS * 1000 + 100);
}

// v is 0..1.
export function setMusicVolume(v) {
  const ctx = getContext();
  volume = Math.max(0, Math.min(1, Number(v) || 0));
  if (ctx && bed && running) {
    setBedLevel(ctx, BED_LEVEL * volume, 0.2);
  }
}
