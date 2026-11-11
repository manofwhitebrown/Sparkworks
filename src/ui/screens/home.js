// Home screen: title, PLAY, Continue, inventor picker, Voltage stepper, links.
// Owner: AI-7

import { go, getMeta } from '../ui.js';
import { makeButton } from '../components/button.js';
import { INVENTORS, getInventor } from '../../data/inventors.js';
import { VOLTAGES } from '../../data/voltage.js';
import { loadRun } from '../../core/save.js';
import { startNormalRun } from '../startRun.js';
import { continuableRun } from '../flow.js';
import { maxVoltageFor } from '../../meta/voltage.js';
import { formatNumber } from '../../core/format.js';

// Remembered while the app is open, so New run keeps the same choice.
let pickedInventor = 'tinkerbot';
let pickedVoltage = 1;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makeTitle() {
  const box = el('div', 'homeTitle');
  const spark = el('div', 'homeSpark');
  box.appendChild(spark);
  box.appendChild(el('h1', 'homeLogo', 'SPARKWORKS'));
  box.appendChild(el('p', 'dim', 'Build the machine. Fire the sparks.'));
  return box;
}

function makeInventorCard(inventor, meta, onPick) {
  const unlocked = meta.unlockedInventors.indexOf(inventor.id) !== -1;
  const card = el('button', 'inventorCard');
  card.type = 'button';
  if (inventor.id === pickedInventor) card.classList.add('isSelected');
  if (!unlocked) card.classList.add('locked');
  card.appendChild(el('div', 'invName', unlocked ? inventor.name : 'Locked'));
  card.appendChild(el('div', 'invTag dim', unlocked ? inventor.tagline : 'Win a run to unlock.'));
  card.addEventListener('click', function () { if (unlocked) onPick(inventor.id); });
  return card;
}

function makePicker(meta, rebuild) {
  const row = el('div', 'inventorRow');
  for (let i = 0; i < INVENTORS.length; i++) {
    row.appendChild(makeInventorCard(INVENTORS[i], meta, function (id) {
      pickedInventor = id;
      pickedVoltage = 1;
      rebuild();
    }));
  }
  return row;
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
  row.append(less, mid, more);
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
  screen.innerHTML = '';
  const top = el('div', 'row');
  top.appendChild(el('div', 'spacer'));
  top.appendChild(el('div', 'pill dust', 'Spark Dust ' + formatNumber(meta.dust)));
  screen.appendChild(top);
  screen.appendChild(makeTitle());

  const rebuild = function () { build(screen); };
  screen.appendChild(makePicker(meta, rebuild));
  screen.appendChild(makeVoltageStepper(meta, rebuild));

  // A saved tutorial run is not a real run: no Continue button for it.
  const saved = continuableRun(loadRun());
  if (saved) {
    const label = 'Continue run (shift ' + saved.shift + ')';
    screen.appendChild(makeButton(label, function () {
      go(saved.phase === 'shop' ? 'shop' : 'run');
    }, { kind: 'secondary' }));
  }
  const playLabel = saved ? 'NEW RUN' : 'PLAY';
  screen.appendChild(makeButton(playLabel, function () { startNormalRun(meta, pickedInventor, pickedVoltage); },
    { kind: 'primary', big: true }));
  screen.appendChild(makeNav());
}

let screenEl = null;

export function mount(root, params) {
  if (!getInventor(pickedInventor)) pickedInventor = 'tinkerbot';
  screenEl = el('div', 'screen homeScreen');
  screenEl.dataset.screen = 'home';
  build(screenEl);
  root.appendChild(screenEl);
  requestAnimationFrame(function () { screenEl.classList.add('isShown'); });
}

export function unmount() {
  screenEl = null;
}
