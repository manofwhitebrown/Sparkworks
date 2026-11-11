// The app shell: mounts screens, fades between them, handles the Back button,
// keeps the one loaded meta object, applies accessibility settings.
// Owner: AI-7

import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens.css';

import * as home from './screens/home.js';
import * as run from './screens/run.js';
import * as shop from './screens/shop.js';
import * as results from './screens/results.js';
import * as workshop from './screens/workshop.js';
import * as patentBook from './screens/patentBook.js';
import * as daily from './screens/daily.js';
import * as settings from './screens/settings.js';
import * as howto from './screens/howto.js';

import { loadMeta, saveMeta } from '../core/save.js';
import { initAudio, applySettings as applyAudioSettings } from '../audio/audio.js';
import { startMusic } from '../audio/music.js';
import { setHapticsEnabled } from '../platform/haptics.js';
import { shouldShowTutorial, startTutorial, tutorialRun, markTutorialDone } from '../tutorial/tutorial.js';
import { saveRun, loadRun, clearRun } from '../core/save.js';
import { openModal, isModalOpen } from './components/modal.js';
import { makeButton } from './components/button.js';
import { backAction, fireSpeedFrom, isTutorialRun } from './flow.js';
import { on } from '../core/events.js';

const SCREENS = { home, run, shop, results, workshop, patentBook, daily, settings, howto };
const FADE_MS = 160;

let meta = null;
let current = null;
let currentName = '';
let audioStarted = false;
let tutorialHandle = null;
let liveRun = null;   // the run object the run and shop screens work on (cheats change it)
let fireSpeed = 1;    // from the cheat menu; never saved, back to 1 on every app start

// ---------- meta access (AI-5 screens use these) ----------
export function getMeta() { return meta; }
export function saveCurrentMeta() { if (meta) saveMeta(meta); }

// ---------- live run (the cheat menu uses these) ----------
export function getCurrentRun() { return liveRun; }
export function setCurrentRun(run) { liveRun = run || null; }

// Fire animation speed set by the cheat menu: { speed, instant }.
export function getFireSpeed() { return fireSpeedFrom(fireSpeed); }

// Applies largeText / reduceMotion / colorblind classes and audio + haptics flags.
// Screens that change a setting call this afterwards.
export function applySettingsFromMeta() {
  const s = meta.settings;
  const html = document.documentElement;
  html.classList.toggle('largeText', !!s.largeText);
  html.classList.toggle('reduceMotion', !!s.reduceMotion);
  html.classList.toggle('colorblind', !!s.colorblind);
  applyAudioSettings(s);
  setHapticsEnabled(s.haptics !== false);
}

// ---------- screen switching ----------
function showScreen(name, params) {
  const root = document.getElementById('app');
  if (current) current.unmount();
  root.innerHTML = '';
  current = SCREENS[name] || SCREENS.home;
  currentName = SCREENS[name] ? name : 'home';
  current.mount(root, params);
}

export function go(screenName, params) {
  const root = document.getElementById('app');
  const old = root.firstElementChild;
  const reduce = document.documentElement.classList.contains('reduceMotion');
  history.pushState({ screen: screenName }, '');
  if (old && !reduce) {
    old.classList.remove('isShown'); // fade out (opacity only)
    setTimeout(function () { showScreen(screenName, params); }, FADE_MS);
  } else {
    showScreen(screenName, params);
  }
}

export function currentScreenName() { return currentName; }

// ---------- Back button ----------
function askLeaveRun() {
  history.pushState({ screen: currentName }, ''); // undo the pop, stay here
  const box = document.createElement('div');
  box.className = 'dialogBody';
  const title = document.createElement('h1');
  title.textContent = 'Leave this run?';
  const text = document.createElement('p');
  text.className = 'dim';
  text.textContent = 'It is saved.';
  const modal = { close: null };
  const stay = makeButton('Keep playing', function () { modal.close(); }, { kind: 'primary' });
  const leave = makeButton('Leave', function () {
    modal.close();
    setTimeout(function () { go('home'); }, 260);
  }, { kind: 'secondary' });
  box.append(title, text, stay, leave);
  modal.close = openModal(box).close;
}

function onPopState() {
  if (isModalOpen()) return; // the modal handles its own Back
  const action = backAction(currentName);
  if (action === 'confirm') askLeaveRun();
  else if (action === 'home') showScreen('home');
  else history.pushState({ screen: 'home' }, ''); // already home: stay
}

// ---------- tutorial end ----------
// The tutorial announces that it is over (last step or Skip). We own the live meta,
// so we mark it done, drop the scripted run from the save slot and go home.
function onTutorialFinished() {
  markTutorialDone(meta);
  saveCurrentMeta();
  if (isTutorialRun(loadRun())) clearRun();
  stopTutorial();
  go('home');
}

// ---------- start ----------
function onFirstTap() {
  if (audioStarted) return;
  audioStarted = true;
  initAudio();
  if (meta.settings.music) startMusic();
}

export function startApp() {
  meta = loadMeta();
  fireSpeed = 1;
  liveRun = null;
  applySettingsFromMeta();
  on('cheat:speed', function (data) { fireSpeed = data ? data.speed : 1; });
  window.addEventListener('popstate', onPopState);
  // main.js says the page is being hidden: write the meta now (runs save after every action).
  on('core:flush', saveCurrentMeta);
  on('tutorial:finished', onTutorialFinished);
  document.addEventListener('pointerdown', onFirstTap, { once: true });
  history.replaceState({ screen: 'home' }, '');

  const root = document.getElementById('app');
  if (shouldShowTutorial(meta)) {
    tutorialHandle = startTutorial(root);
    const scripted = tutorialRun();
    if (scripted) {
      saveRun(scripted);
      showScreen('run', { run: scripted, tutorial: true });
      return;
    }
  }
  showScreen('home');
}

// "Replay tutorial" on the How to Play screen: same steps as a first start.
export function replayTutorial() {
  stopTutorial();
  meta.tutorialDone = false;
  saveCurrentMeta();
  const root = document.getElementById('app');
  tutorialHandle = startTutorial(root);
  const scripted = tutorialRun();
  if (scripted) {
    saveRun(scripted);
    history.pushState({ screen: 'run' }, '');
    showScreen('run', { run: scripted, tutorial: true });
  }
}

export function stopTutorial() {
  if (tutorialHandle) tutorialHandle.stop();
  tutorialHandle = null;
}
