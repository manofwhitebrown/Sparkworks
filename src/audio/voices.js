// Tiny sound builders: one soft tone, one noise click. Each cleans itself up.
// Owner: AI-8

import { getContext, getSfxGain, reserveNodes } from './audio.js';

let noiseBuffer = null;

// One short buffer of white noise, built once and reused for every click.
function getNoiseBuffer(ctx) {
  if (noiseBuffer) {
    return noiseBuffer;
  }
  const length = Math.floor(ctx.sampleRate * 0.1);
  noiseBuffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  // Fixed pseudo-random numbers so the click sounds the same every time.
  let seed = 12345;
  for (let i = 0; i < length; i++) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    data[i] = (seed / 2147483648) * 2 - 1;
  }
  return noiseBuffer;
}

// opts: type, freq, slideTo, start (seconds from now), dur, gain, attack, lowpass
export function playTone(opts) {
  const ctx = getContext();
  const out = getSfxGain();
  if (!ctx || !out) {
    return false;
  }
  const start = ctx.currentTime + (opts.start || 0);
  const attack = opts.attack === undefined ? 0.01 : opts.attack;
  const dur = opts.dur || 0.2;
  if (!reserveNodes(3, dur + (opts.start || 0))) {
    return false;
  }
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  osc.type = opts.type || 'sine';
  osc.frequency.setValueAtTime(opts.freq, start);
  if (opts.slideTo) {
    osc.frequency.exponentialRampToValueAtTime(opts.slideTo, start + dur);
  }
  filter.type = 'lowpass';
  filter.frequency.value = opts.lowpass || 4000;
  // Soft attack, then a smooth fade to near zero: no clicks, nothing harsh.
  env.gain.setValueAtTime(0.0001, start);
  env.gain.linearRampToValueAtTime(opts.gain || 0.2, start + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(filter);
  filter.connect(env);
  env.connect(out);
  osc.onended = function cleanUp() {
    osc.disconnect();
    filter.disconnect();
    env.disconnect();
  };
  osc.start(start);
  osc.stop(start + dur + 0.02);
  return true;
}

// A very short burst of filtered noise: the "click" part of taps and placing.
export function playClick(opts) {
  const ctx = getContext();
  const out = getSfxGain();
  if (!ctx || !out) {
    return false;
  }
  const dur = opts.dur || 0.04;
  if (!reserveNodes(3, dur + (opts.start || 0))) {
    return false;
  }
  const start = ctx.currentTime + (opts.start || 0);
  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const env = ctx.createGain();
  source.buffer = getNoiseBuffer(ctx);
  filter.type = 'bandpass';
  filter.frequency.value = opts.freq || 1800;
  env.gain.setValueAtTime(opts.gain || 0.1, start);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  source.connect(filter);
  filter.connect(env);
  env.connect(out);
  source.onended = function cleanUp() {
    source.disconnect();
    filter.disconnect();
    env.disconnect();
  };
  source.start(start);
  source.stop(start + dur + 0.02);
  return true;
}
