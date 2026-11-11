// Settings screen: toggles that save and apply at once, quality, tutorial replay, full reset.
// Owner: AI-5
import { go, getMeta, saveCurrentMeta, applySettingsFromMeta } from '../ui.js';
import { makeButton } from '../components/button.js';
import { openModal } from '../components/modal.js';
import { setMuted } from '../../audio/audio.js';
import { startMusic, stopMusic } from '../../audio/music.js';
import { playSfx } from '../../audio/sfx.js';
import { buzz } from '../../platform/haptics.js';
import { scheduleDailyReminder, cancelReminders } from '../../platform/notifications.js';
import { wipeAll } from '../../core/save.js';
import { el, makeHeader, makeScreen } from '../../meta/screenKit.js';

const TOGGLES = [
  { key: 'sound', label: 'Sound effects', hint: 'Clicks, sparks and chimes.' },
  { key: 'music', label: 'Music', hint: 'A quiet ambient bed.' },
  { key: 'haptics', label: 'Vibration', hint: 'Small buzzes on taps.' },
  { key: 'reminders', label: 'Daily reminder', hint: 'One gentle nudge a day (Android app).' },
  { key: 'reduceMotion', label: 'Reduce motion', hint: 'Less shaking, fewer particles.' },
  { key: 'largeText', label: 'Large text', hint: 'Bigger words everywhere.' },
  { key: 'colorblind', label: 'Colorblind mode', hint: 'Safer colors for the board.' }
];
const QUALITIES = ['auto', 'low', 'medium', 'high'];

let list = null;

// Side effects that must happen right after a setting changes.
function applyChange(meta, key) {
  applySettingsFromMeta();
  const on = meta.settings[key] === true;
  if (key === 'sound' || key === 'music') {
    setMuted(!meta.settings.sound && !meta.settings.music);
    if (key === 'music') {
      if (on) startMusic();
      else stopMusic();
    }
    if (key === 'sound' && on) playSfx('tap');
  } else if (key === 'haptics' && on) {
    buzz('light');
  } else if (key === 'reminders') {
    if (on) scheduleDailyReminder();
    else cancelReminders();
  }
}

function makeToggleRow(meta, item) {
  const on = meta.settings[item.key] === true;
  const row = el('div', 'metaCard');
  const text = el('div', 'grow');
  text.appendChild(el('div', 'metaName', item.label));
  text.appendChild(el('div', 'dim', item.hint));
  row.appendChild(text);
  const button = makeButton(on ? 'On' : 'Off', function () {
    meta.settings[item.key] = !on;
    saveCurrentMeta();
    applyChange(meta, item.key);
    render();
  }, { kind: on ? 'primary' : 'secondary', small: true });
  button.classList.add('metaSwitch');
  button.setAttribute('role', 'switch');
  button.setAttribute('aria-checked', on ? 'true' : 'false');
  row.appendChild(button);
  return row;
}

function makeQualityRow(meta) {
  const panel = el('div', 'metaCard');
  panel.style.flexDirection = 'column';
  panel.style.alignItems = 'stretch';
  panel.appendChild(el('div', 'metaName', 'Graphics quality'));
  panel.appendChild(el('div', 'dim', 'Auto picks for your phone. Lower = smoother on old devices.'));
  const tabs = el('div', 'metaTabs');
  for (let i = 0; i < QUALITIES.length; i++) {
    const q = QUALITIES[i];
    tabs.appendChild(makeButton(q, function () {
      meta.settings.quality = q;
      saveCurrentMeta();
      render();
    }, { kind: meta.settings.quality === q ? 'primary' : 'secondary', small: true }));
  }
  panel.appendChild(tabs);
  return panel;
}

// One modal, two steps (the content is swapped in place), so history is never raced.
function askReset() {
  const box = el('div', 'dialogBody');
  const modal = { close: null };
  function step1() {
    box.replaceChildren();
    box.appendChild(el('h1', '', 'Reset all progress?'));
    box.appendChild(el('p', 'dim', 'Parts, upgrades, Spark Dust and achievements will be erased.'));
    box.appendChild(makeButton('Continue', step2, { kind: 'danger' }));
    box.appendChild(makeButton('Cancel', function () { modal.close(); }, { kind: 'ghost' }));
  }
  function step2() {
    box.replaceChildren();
    box.appendChild(el('h1', '', 'Really erase everything?'));
    box.appendChild(el('p', 'dim', 'This cannot be undone.'));
    box.appendChild(makeButton('Erase everything', function () { wipeAll(); location.reload(); }, { kind: 'danger' }));
    box.appendChild(makeButton('Keep my progress', function () { modal.close(); }, { kind: 'ghost' }));
  }
  step1();
  modal.close = openModal(box).close;
}

function replayTutorial() {
  const meta = getMeta();
  meta.tutorialDone = false;
  saveCurrentMeta();
  location.reload();
}

function render() {
  const meta = getMeta();
  list.replaceChildren();
  for (let i = 0; i < TOGGLES.length; i++) {
    if (i === 0) list.appendChild(el('div', 'metaLabel', 'Sound and feel'));
    if (TOGGLES[i].key === 'reduceMotion') list.appendChild(el('div', 'metaLabel metaGroup', 'Easier to see'));
    list.appendChild(makeToggleRow(meta, TOGGLES[i]));
  }
  list.appendChild(el('div', 'metaLabel metaGroup', 'Graphics'));
  list.appendChild(makeQualityRow(meta));
  list.appendChild(el('div', 'metaLabel metaGroup', 'Other'));
  list.appendChild(makeButton('Replay tutorial', replayTutorial, { kind: 'secondary' }));
  list.appendChild(makeButton('Reset all progress', askReset, { kind: 'danger' }));
  list.appendChild(el('p', 'dim metaCenter', 'Sparkworks. Made from code, light and a lot of sparks. Font: Inter (OFL).'));
}

export function mount(root, params) {
  const screen = makeScreen(root);
  screen.appendChild(makeHeader('Settings', function () { saveCurrentMeta(); go('home'); }));
  list = el('div', 'metaList');
  screen.appendChild(list);
  render();
}

export function unmount() {
  list = null;
}
