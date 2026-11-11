// Daily Contract screen: one shared run per date, the best result of the day, the streak.
// Owner: AI-5
import { go, getMeta, saveCurrentMeta } from '../ui.js';
import { makeButton } from '../components/button.js';
import { showToast } from '../components/toast.js';
import { openModal } from '../components/modal.js';
import { getInventor } from '../../data/inventors.js';
import { formatNumber } from '../../core/format.js';
import { loadRun, saveRun } from '../../core/save.js';
import { emit } from '../../core/events.js';
import { newRun } from '../../run/runState.js';
import { scheduleDailyReminder } from '../../platform/notifications.js';
import { bonusesFor } from '../../meta/workshop.js';
import { unlockedPartIds } from '../../meta/patentBook.js';
import { todayString, yesterdayOf, dailyConfig, hasPlayedDaily, shareCode } from '../../meta/daily.js';
import { el, makeHeader, makeScreen, makeIntro } from '../../meta/screenKit.js';

function fallbackCopy(text) {
  try {
    const box = document.createElement('textarea');
    box.value = text;
    box.style.position = 'fixed';
    box.style.opacity = '0';
    document.body.appendChild(box);
    box.select();
    const ok = document.execCommand('copy');
    box.remove();
    return ok;
  } catch (err) {
    return false;
  }
}

function copyText(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
  }
  return Promise.resolve(fallbackCopy(text));
}

// The streak only counts while it is alive: played today or yesterday.
function liveStreak(meta, today) {
  const last = meta.daily.lastPlayed;
  return last === today || last === yesterdayOf(today) ? meta.daily.streak : 0;
}

function startDaily(meta, today) {
  const config = dailyConfig(today);
  const run = newRun({
    inventorId: config.inventorId,
    voltage: config.voltage,
    seed: config.seed,
    poolIds: unlockedPartIds(meta),
    bonuses: bonusesFor(meta),
    daily: today
  });
  saveRun(run);
  emit('ui:runStarted', { inventorId: config.inventorId, voltage: config.voltage, daily: today });
  go('run', { daily: today });
}

// A saved run in progress would be lost, so ask first.
function onPlay(meta, today) {
  const saved = loadRun();
  const busy = saved && (saved.phase === 'build' || saved.phase === 'shop');
  if (!busy) {
    startDaily(meta, today);
    return;
  }
  const box = el('div', 'dialogBody');
  box.appendChild(el('h1', '', 'Replace your run?'));
  box.appendChild(el('p', 'dim', 'You have a run in progress. Starting the daily contract replaces it.'));
  const modal = { close: null };
  box.appendChild(makeButton('Start daily', function () { modal.close(); startDaily(meta, today); }, { kind: 'primary' }));
  box.appendChild(makeButton('Keep my run', function () { modal.close(); }, { kind: 'ghost' }));
  modal.close = openModal(box).close;
}

function makeContractPanel(today) {
  const config = dailyConfig(today);
  const inventor = getInventor(config.inventorId);
  const panel = el('div', 'panel');
  panel.appendChild(el('div', 'dim num', today));
  panel.appendChild(el('div', 'metaBig', inventor ? inventor.name : config.inventorId));
  panel.appendChild(el('div', '', 'Voltage ' + config.voltage));
  panel.appendChild(el('div', 'dim', 'Same machine seed for everyone today.'));
  return panel;
}

function makeResultPanel(meta, today) {
  const panel = el('div', 'panel');
  const best = meta.daily.best;
  if (hasPlayedDaily(meta, today) && best) {
    panel.appendChild(el('div', 'metaName', 'Best today'));
    panel.appendChild(el('div', 'num', (best.won ? 'Won' : 'Shift ' + best.shiftReached + ' of 8') + ' | best fire ' + formatNumber(best.bestFire)));
  } else {
    panel.appendChild(el('div', 'dim', 'You have not played today yet.'));
  }
  panel.appendChild(el('div', 'dim num', 'Streak: ' + liveStreak(meta, today) + ' day(s)'));
  return panel;
}

export function mount(root, params) {
  const meta = getMeta();
  const today = todayString();
  const played = hasPlayedDaily(meta, today);
  const screen = makeScreen(root);
  screen.appendChild(makeHeader('Daily Contract', function () { saveCurrentMeta(); go('home'); }));
  const intro = makeIntro(meta, 'daily', 'Everybody gets the same run today. Beat your best.', saveCurrentMeta);
  if (intro) screen.appendChild(intro);
  const list = el('div', 'metaList');
  list.appendChild(makeContractPanel(today));
  list.appendChild(makeResultPanel(meta, today));
  list.appendChild(makeButton(played ? 'Come back tomorrow' : 'Play today', function () { onPlay(meta, today); },
    { kind: 'primary', big: true, disabled: played }));
  if (played && meta.daily.best) {
    list.appendChild(makeButton('Copy result', function () {
      copyText(shareCode(today, meta.daily.best)).then(function (ok) {
        showToast(ok ? 'Copied' : 'Could not copy');
      });
    }, { kind: 'secondary' }));
  }
  screen.appendChild(list);
  if (meta.settings.reminders) scheduleDailyReminder();
}

export function unmount() {}
