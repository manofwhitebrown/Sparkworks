// Audio must never throw: not without WebAudio, and not with a fake one.
// Owner: AI-8

import test from 'node:test';
import assert from 'node:assert/strict';

const SFX_NAMES = ['tap', 'place', 'rotate', 'buy', 'sell', 'reroll', 'merge', 'fire', 'pass',
  'bank', 'fizzle', 'win', 'lose', 'unlock', 'error', 'overload'];

// A fake node that accepts any call, so we can check nothing throws.
function fakeNode() {
  const param = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {}, cancelScheduledValues() {} };
  return { gain: param, frequency: param, connect() {}, disconnect() {}, start() {}, stop() {},
    buffer: null, getChannelData() { return new Float32Array(10000); } };
}

class FakeContext {
  constructor() { this.currentTime = 0; this.sampleRate = 44100; this.state = 'suspended'; this.destination = {}; }
  resume() { this.state = 'running'; }
  createGain() { return fakeNode(); }
  createOscillator() { return fakeNode(); }
  createBiquadFilter() { return fakeNode(); }
  createBufferSource() { return fakeNode(); }
  createBuffer() { return fakeNode(); }
}

test('everything is silent and safe when WebAudio is missing', async () => {
  const audio = await import('../src/audio/audio.js');
  const sfx = await import('../src/audio/sfx.js');
  const music = await import('../src/audio/music.js');
  assert.equal(audio.initAudio(), false);
  for (const name of SFX_NAMES) {
    sfx.playSfx(name, { size: 0.5 });
  }
  sfx.playPass(3);
  music.startMusic();
  music.setMusicVolume(0.5);
  music.stopMusic();
});

test('every sound plays with a fake WebAudio and the node budget holds', async () => {
  globalThis.AudioContext = FakeContext;
  const audio = await import('../src/audio/audio.js');
  const sfx = await import('../src/audio/sfx.js');
  const music = await import('../src/audio/music.js');
  assert.equal(audio.initAudio(), true);
  for (const name of SFX_NAMES) {
    sfx.playSfx(name, { size: 1 });
  }
  for (let step = 0; step < 25; step++) {
    sfx.playPass(step);
  }
  assert.ok(audio.liveNodeCount() <= 12);
  audio.setMuted(true);
  assert.equal(audio.isMuted(), true);
  sfx.playSfx('win');
  audio.setMuted(false);
  music.startMusic();
  music.stopMusic();
  delete globalThis.AudioContext;
});
