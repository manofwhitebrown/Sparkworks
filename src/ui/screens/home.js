// Home screen: title, PLAY, Continue, inventor picker, Voltage stepper, links.
// Owner: AI-7 (covered by AI-1 in round 5: idle demo board)

import { go, getMeta } from '../ui.js';
import { makeButton } from '../components/button.js';
import { makeWordmark } from '../components/wordmark.js';
import { INVENTORS, getInventor } from '../../data/inventors.js';
import { VOLTAGES } from '../../data/voltage.js';
import { loadRun } from '../../core/save.js';
import { startNormalRun } from '../startRun.js';
import { continuableRun } from '../flow.js';
import { maxVoltageFor } from '../../meta/voltage.js';
import { formatNumber } from '../../core/format.js';
import { GOAL_LINE, VOLTAGE_LINE, GENTLE_TEXT } from '../teach.js';
import { createBoardView } from '../../render/boardView.js';
import { makeDemoMachine, demoEvents, shouldLoop, DEMO_PAUSE_MS } from '../homeDemo.js';

// Remembered while the app is open, so New run keeps the same choice.
let pickedInventor = 'tinkerbot';
let pickedVoltage = 1;
let pickedGentle = false;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// The logo mark: a bright core, a soft halo (a static radial gradient) and a thin
// four-point glint. Only transform and opacity are animated (see screens.css).
function makeSparkMark() {
  const mark = el('div', 'homeSpark');
  mark.setAttribute('aria-hidden', 'true');
  mark.append(el('div', 'sparkHalo'), el('div', 'sparkGlint'), el('div', 'sparkCore'));
  return mark;
}

function makeTitle() {
  const box = el('div', 'homeTitle');
  box.appendChild(makeSparkMark());
  box.appendChild(el('div', 'homeBoard'));
  box.appendChild(makeWordmark());
  box.appendChild(el('p', 'dim', 'Build the machine. Fire the sparks.'));
  box.appendChild(el('p', 'goalLine', GOAL_LINE));
  return box;
}

function makeInventorCard(inventor, onPick) {
  const card = el('button', 'inventorCard');
  card.type = 'button';
  if (inventor.id === pickedInventor) card.classList.add('isSelected');
  card.appendChild(el('div', 'invName', inventor.name));
  card.appendChild(el('div', 'invTag dim', inventor.tagline));
  card.addEventListener('click', function () { onPick(inventor.id); });
  return card;
}

// A small padlock drawn as SVG (one icon style, no emoji).
function makeLockIcon() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('class', 'lockIcon');
  svg.setAttribute('aria-hidden', 'true');
  const body = document.createElementNS(ns, 'rect');
  body.setAttribute('x', '3'); body.setAttribute('y', '7'); body.setAttribute('width', '10');
  body.setAttribute('height', '7'); body.setAttribute('rx', '2');
  const arc = document.createElementNS(ns, 'path');
  arc.setAttribute('d', 'M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7');
  arc.setAttribute('fill', 'none');
  svg.append(body, arc);
  return svg;
}

// Locked inventors are small tiles (still 44 px tall), so a fresh save has no wasted space.
function makeLockedTile(inventor) {
  const tile = el('div', 'lockedTile');
  tile.setAttribute('role', 'note');
  tile.setAttribute('aria-label', 'Locked inventor. Win a run to unlock.');
  tile.append(makeLockIcon(), el('div', 'lockedText dim', 'Win a run to unlock'));
  return tile;
}

function makePicker(meta, rebuild) {
  const box = el('div', 'inventorBox');
  const open = el('div', 'inventorRow');
  const locked = el('div', 'lockedRow');
  for (let i = 0; i < INVENTORS.length; i++) {
    const inventor = INVENTORS[i];
    if (meta.unlockedInventors.indexOf(inventor.id) !== -1) {
      open.appendChild(makeInventorCard(inventor, function (id) {
        pickedInventor = id;
        pickedVoltage = 1;
        rebuild();
      }));
    } else {
      locked.appendChild(makeLockedTile(inventor));
    }
  }
  box.appendChild(open);
  if (locked.children.length > 0) box.appendChild(locked);
  return box;
}

function makeVoltageStepper(meta, rebuild) {
  const max = maxVoltageFor(meta, pickedInventor);
  if (pickedVoltage > max) pickedVoltage = max;
  const row = el('div', 'panel voltageRow');
  const less = makeButton('-', function () { pickedVoltage -= 1; rebuild(); },
    { small: true, disabled: pickedVoltage <= 1 });
  const more = makeButton('+', function () { pickedVoltage += 1; rebuild(); },
    { small: true, disabled: pickedVoltage >= max });
  const mid = el('div', 'voltageMid');
  const volt = VOLTAGES[pickedVoltage - 1];
  mid.appendChild(el('div', 'dim', 'Voltage ' + pickedVoltage));
  mid.appendChild(el('div', 'num', volt ? volt.name : ''));
  mid.appendChild(el('div', 'dim tinyText', VOLTAGE_LINE));
  row.append(less, mid, more);
  return row;
}

// The Gentle mode switch: one big tap target with a short plain explanation.
function makeGentleSwitch(rebuild) {
  const row = el('button', 'panel gentleRow');
  row.type = 'button';
  row.setAttribute('role', 'switch');
  row.setAttribute('aria-checked', pickedGentle ? 'true' : 'false');
  if (pickedGentle) row.classList.add('isOn');
  const words = el('div', 'gentleWords');
  words.appendChild(el('div', 'gentleName', 'Gentle mode'));
  words.appendChild(el('div', 'dim tinyText', GENTLE_TEXT));
  const track = el('div', 'switchTrack');
  track.appendChild(el('div', 'switchKnob'));
  row.append(words, track);
  row.addEventListener('click', function () { pickedGentle = !pickedGentle; rebuild(); });
  return row;
}

function makeNav() {
  const row = el('div', 'navRow');
  row.appendChild(makeButton('Workshop', function () { go('workshop'); }, { small: true }));
  row.appendChild(makeButton('Patents', function () { go('patentBook'); }, { small: true }));
  row.appendChild(makeButton('Daily', function () { go('daily'); }, { small: true }));
  row.appendChild(makeButton('Settings', function () { go('settings'); }, { small: true }));
  return row;
}

function build(screen) {
  const meta = getMeta();
  stopIdle();
  screen.innerHTML = '';
  const top = el('div', 'row');
  top.appendChild(el('div', 'spacer'));
  top.appendChild(el('div', 'pill dust', 'Spark Dust ' + formatNumber(meta.dust)));
  const help = el('button', 'helpBtn', '?');
  help.type = 'button';
  help.setAttribute('aria-label', 'How to play');
  help.addEventListener('click', function () { go('howto', { from: 'home' }); });
  top.appendChild(help);
  screen.appendChild(top);
  screen.appendChild(makeTitle());

  const rebuild = function () { build(screen); };
  screen.appendChild(makePicker(meta, rebuild));
  screen.appendChild(makeVoltageStepper(meta, rebuild));
  screen.appendChild(makeGentleSwitch(rebuild));

  // A saved tutorial run is not a real run: no Continue button for it.
  const saved = continuableRun(loadRun());
  if (saved) {
    const label = 'Continue run (shift ' + saved.shift + ')';
    screen.appendChild(makeButton(label, function () {
      go(saved.phase === 'shop' ? 'shop' : 'run');
    }, { kind: 'secondary' }));
  }
  const playLabel = saved ? 'NEW RUN' : 'PLAY';
  screen.appendChild(makeButton(playLabel, function () { startNormalRun(meta, pickedInventor, pickedVoltage, pickedGentle); },
    { kind: 'primary', big: true }));
  screen.appendChild(makeNav());
  // The screen may not be in the page yet on the first build; mount starts the demo then.
  if (screen.isConnected) startIdle(screen.querySelector('.homeBoard'));
}

let screenEl = null;
let idleView = null;
let idleTimer = 0;
let idleActive = false;

// ---------- idle demo board ----------
// A spark loops through a tiny machine. It only shows on tall phones (CSS), is a still picture
// with reduce motion or low quality, and waits while the page is hidden.
function stopIdle() {
  idleActive = false;
  clearTimeout(idleTimer);
  idleTimer = 0;
  if (idleView) idleView.destroy();
  idleView = null;
}

function playIdle(events) {
  if (!idleActive || !idleView) return;
  if (document.hidden) { idleTimer = setTimeout(function () { playIdle(events); }, 600); return; }
  idleView.setMachine(makeDemoMachine());
  idleView.play(events, { speed: 1 }).then(function () {
    if (idleActive) idleTimer = setTimeout(function () { playIdle(events); }, DEMO_PAUSE_MS);
  });
}

function startIdle(box) {
  stopIdle();
  if (!box || window.getComputedStyle(box).display === 'none') return;
  const settings = getMeta().settings || {};
  idleView = createBoardView(box, { onCellTap: function () {}, onCellDrag: function () {}, onEventPlayed: function () {} });
  if (settings.quality && settings.quality !== 'auto') idleView.setQuality(settings.quality);
  idleView.setReduceMotion(!!settings.reduceMotion);
  idleView.setMachine(makeDemoMachine());
  if (!shouldLoop(settings)) return;
  idleActive = true;
  const events = demoEvents();
  idleTimer = setTimeout(function () { playIdle(events); }, 700);
}

export function mount(root, params) {
  if (!getInventor(pickedInventor)) pickedInventor = 'tinkerbot';
  screenEl = el('div', 'screen homeScreen');
  screenEl.dataset.screen = 'home';
  build(screenEl);
  root.appendChild(screenEl);
  startIdle(screenEl.querySelector('.homeBoard'));
  requestAnimationFrame(function () { screenEl.classList.add('isShown'); });
}

export function unmount() {
  stopIdle();
  screenEl = null;
}
