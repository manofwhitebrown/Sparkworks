// Sound follows the game: Fire intensity, merge level and the music mood. Never throws.
// Owner: AI-8

import test from 'node:test';
import assert from 'node:assert/strict';
import { emit } from '../src/core/events.js';
import { makeMachine, placePart } from '../src/engine/board.js';
import { simulate } from '../src/engine/simulate.js';
import { fireStats } from '../src/engine/fireStats.js';
import { moodForShift, isOverloadShift, wantsSwell, SWELL_FROM } from '../src/audio/mood.js';
import { installAudioReactions } from '../src/audio/reactions.js';
import { getSoundContext, setSoundContext, playSfx } from '../src/audio/sfx.js';
import { getMusicMood, setMusicMood, startMusic, stopMusic } from '../src/audio/music.js';

function realFireEvents() {
  const machine = makeMachine({ seed: 7 });
  for (let x = 0; x < 5; x++) {
    placePart(machine, x, machine.sourceRow, x % 2 === 0 ? 'coil' : 'amplifier', 1, 0);
  }
  return simulate(machine).events;
}

test('moodForShift: Overload shifts 4 and 8 are tense, brightness grows from 0 to 1', () => {
  assert.equal(isOverloadShift(4), true);
  assert.equal(isOverloadShift(8), true);
  assert.equal(isOverloadShift(3), false);
  assert.equal(moodForShift(4).tense, true);
  assert.equal(moodForShift(5).tense, false);
  assert.equal(moodForShift(1).bright, 0);
  assert.equal(moodForShift(8).bright, 1);
  for (let shift = 1; shift <= 8; shift++) {
    const m = moodForShift(shift);
    assert.ok(m.bright >= 0 && m.bright <= 1);
  }
});

test('moodForShift survives garbage input', () => {
  for (const bad of [undefined, null, NaN, -5, 99, 'x', {}]) {
    const m = moodForShift(bad);
    assert.ok(m.bright >= 0 && m.bright <= 1);
    assert.equal(typeof m.tense, 'boolean');
  }
});

test('wantsSwell: only a passed, big Fire', () => {
  assert.equal(wantsSwell(SWELL_FROM, true), true);
  assert.equal(wantsSwell(0.2, true), false);
  assert.equal(wantsSwell(0.9, false), false);
  assert.equal(wantsSwell(undefined, true), false);
});

test('reactions: installs once, ui:fired sets the sound intensity, ui:fireDone resets it', () => {
  assert.equal(installAudioReactions(), true);
  assert.equal(installAudioReactions(), false);
  const events = realFireEvents();
  const expected = fireStats(events).intensity;
  emit('ui:fired', { events: events });
  assert.equal(getSoundContext().intensity, expected);
  emit('ui:fireDone', { total: 10, passed: true });
  assert.equal(getSoundContext().intensity, 0);
});

test('reactions: bad event data never throws', () => {
  emit('ui:fired', undefined);
  emit('ui:fired', { events: 'nope' });
  emit('ui:fireDone', null);
  emit('ui:merged', { level: 'x' });
  emit('ui:shopOpened', {});
  assert.equal(getSoundContext().intensity, 0);
});

test('reactions: merge level is kept between 2 and 3', () => {
  emit('ui:merged', { level: 3 });
  assert.equal(getSoundContext().mergeLevel, 3);
  emit('ui:merged', { level: 99 });
  assert.equal(getSoundContext().mergeLevel, 3);
  emit('ui:merged', { level: 0 });
  assert.equal(getSoundContext().mergeLevel, 2);
});

test('reactions: the music mood follows the shift (shop after shift 3 means Overload next)', () => {
  emit('ui:runStarted', { inventorId: 'tinkerbot', voltage: 1 });
  assert.equal(getMusicMood().tense, false);
  emit('ui:shopOpened', { shift: 3 });
  assert.equal(getMusicMood().tense, true);
  emit('ui:shopOpened', { shift: 4 });
  assert.equal(getMusicMood().tense, false);
  emit('ui:runEnded', { won: false });
  assert.equal(getMusicMood().bright, 0);
});

test('reactions: ui:runShown sets the mood for a resumed run (shift 4 is tense)', () => {
  installAudioReactions();
  emit('ui:runShown', { shift: 4 });
  assert.equal(getMusicMood().tense, true);
  emit('ui:runShown', { shift: 5 });
  assert.equal(getMusicMood().tense, false);
  emit('ui:runShown', {});
  assert.equal(getMusicMood().bright, 0);
});

test('setSoundContext and setMusicMood clamp and ignore garbage', () => {
  setSoundContext({ intensity: 5 });
  assert.equal(getSoundContext().intensity, 1);
  setSoundContext({ intensity: NaN });
  assert.equal(getSoundContext().intensity, 1);
  setSoundContext({ intensity: 0 });
  setMusicMood({ tense: true, bright: 7 });
  assert.deepEqual(getMusicMood(), { tense: true, bright: 1 });
  setMusicMood(null);
  assert.deepEqual(getMusicMood(), { tense: false, bright: 0 });
});

// With a fake WebAudio the richer sounds and the mood must not throw either.
function fakeNode() {
  const param = { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} };
  return { gain: param, frequency: param, connect() {}, disconnect() {}, start() {}, stop() {},
    buffer: null, getChannelData() { return new Float32Array(10000); } };
}

class FakeContext {
  constructor() { this.currentTime = 0; this.sampleRate = 44100; this.state = 'running'; this.destination = {}; }
  resume() {}
  createGain() { return fakeNode(); }
  createOscillator() { return fakeNode(); }
  createBiquadFilter() { return fakeNode(); }
  createBufferSource() { return fakeNode(); }
  createBuffer() { return fakeNode(); }
}

test('with a fake WebAudio: swell, merge level 3, win, lose and the tense mood do not throw', async () => {
  globalThis.AudioContext = FakeContext;
  const audio = await import('../src/audio/audio.js');
  assert.equal(audio.initAudio(), true);
  audio.applySettings({ sound: true, music: true });
  startMusic();
  setMusicMood({ tense: true, bright: 0.5 });
  for (const name of ['swell', 'merge', 'win', 'lose', 'bank']) {
    playSfx(name, { size: 1, level: 3 });
  }
  stopMusic();
  // let the staggered notes finish before the test ends
  await new Promise((resolve) => setTimeout(resolve, 1200));
  delete globalThis.AudioContext;
});
