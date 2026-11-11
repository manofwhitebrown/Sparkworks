// Shared WebAudio context, master/sfx/music gains, mute, and a live-node budget.
// Everything here does NOTHING (no errors) when WebAudio is missing.
// Owner: AI-8

const MAX_LIVE_NODES = 12;

let context = null;
let masterGain = null;
let sfxGain = null;
let musicGain = null;
let muted = false;
let soundOn = true;
let musicOn = true;
let liveNodes = 0;

function findContextClass() {
  if (typeof globalThis === 'undefined') {
    return null;
  }
  return globalThis.AudioContext || globalThis.webkitAudioContext || null;
}

// Build the context and the three gains the first time they are needed.
function ensureContext() {
  if (context) {
    return context;
  }
  const ContextClass = findContextClass();
  if (!ContextClass) {
    return null;
  }
  try {
    context = new ContextClass();
    masterGain = context.createGain();
    sfxGain = context.createGain();
    musicGain = context.createGain();
    sfxGain.gain.value = 0.8;
    musicGain.gain.value = 0.5;
    sfxGain.connect(masterGain);
    musicGain.connect(masterGain);
    masterGain.connect(context.destination);
    applyMasterVolume();
  } catch (error) {
    context = null;
  }
  return context;
}

function applyMasterVolume() {
  if (!masterGain) {
    return;
  }
  masterGain.gain.value = muted ? 0 : 0.9;
}

// The reactions module imports sfx and music (which import this file), so it is loaded lazily.
let reactionsRequested = false;
function installReactions() {
  if (reactionsRequested) {
    return;
  }
  reactionsRequested = true;
  import('./reactions.js').then(function (m) { m.installAudioReactions(); }).catch(function () {});
}

// Call this on the FIRST tap: phones and browsers block sound before a tap.
export function initAudio() {
  installReactions();
  const ctx = ensureContext();
  if (!ctx) {
    return false;
  }
  if (ctx.state === 'suspended') {
    try {
      ctx.resume();
    } catch (error) {
      return false;
    }
  }
  return true;
}

export function setMuted(flag) {
  muted = !!flag;
  applyMasterVolume();
}

export function isMuted() {
  return muted;
}

// Copy meta.settings.sound and .music. The caller saves nothing; we only read.
export function applySettings(settings) {
  if (!settings) {
    return;
  }
  soundOn = settings.sound !== false;
  musicOn = settings.music !== false;
}

export function isSoundOn() {
  return soundOn && !muted;
}

export function isMusicOn() {
  return musicOn && !muted;
}

// The context only once initAudio() has run and the browser let it play.
export function getContext() {
  if (!context) {
    return null;
  }
  return context;
}

export function getSfxGain() {
  return sfxGain;
}

export function getMusicGain() {
  return musicGain;
}

// Ask for room for `count` nodes that will live for `seconds`.
// Returns false when the budget is full, so the caller skips the sound.
export function reserveNodes(count, seconds) {
  if (liveNodes + count > MAX_LIVE_NODES) {
    return false;
  }
  liveNodes += count;
  setTimeout(function release() {
    liveNodes -= count;
    if (liveNodes < 0) {
      liveNodes = 0;
    }
  }, Math.ceil(seconds * 1000) + 40);
  return true;
}

// Music uses long-lived nodes, so it keeps its own count outside the sfx budget.
export function liveNodeCount() {
  return liveNodes;
}
