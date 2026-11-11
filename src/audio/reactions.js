// Listens to the game's ui:* events and makes the sound follow the game: louder banks for big
// Fires, a swell at the end of a big Fire, a bigger merge sound at level 3, and a tenser music
// bed on Overload shifts. Lives in src/audio so no screen has to call it. Installed once from
// initAudio(). Never throws.
// Owner: AI-8
import { on } from '../core/events.js';
import { fireStats } from '../engine/fireStats.js';
import { playSfx, setSoundContext } from './sfx.js';
import { setMusicMood } from './music.js';
import { moodForShift, wantsSwell } from './mood.js';

let installed = false;
let lastIntensity = 0;

function safe(fn) {
  return function handler(data) {
    try {
      fn(data || {});
    } catch (error) {
      // Sound must never break the game.
    }
  };
}

function onFired(data) {
  const stats = Array.isArray(data.events) ? fireStats(data.events) : null;
  lastIntensity = stats ? stats.intensity : 0;
  setSoundContext({ intensity: lastIntensity });
}

function onFireDone(data) {
  if (wantsSwell(lastIntensity, data.passed)) {
    playSfx('swell', { size: lastIntensity });
  }
  setSoundContext({ intensity: 0 });
}

function onMerged(data) {
  setSoundContext({ mergeLevel: data.level });
}

function onRunStarted() {
  setMusicMood(moodForShift(1));
}

// The shop opens after a cleared shift, so the next shift is shift + 1.
function onShopOpened(data) {
  setMusicMood(moodForShift((Number(data.shift) || 0) + 1));
}

function onRunEnded() {
  setMusicMood(moodForShift(1));
}

export function installAudioReactions() {
  if (installed) {
    return false;
  }
  installed = true;
  on('ui:fired', safe(onFired));
  on('ui:fireDone', safe(onFireDone));
  on('ui:merged', safe(onMerged));
  on('ui:runStarted', safe(onRunStarted));
  on('ui:shopOpened', safe(onShopOpened));
  on('ui:runEnded', safe(onRunEnded));
  return true;
}
