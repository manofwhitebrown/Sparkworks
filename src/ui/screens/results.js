// The results screen: win/lose, stats, Spark Dust earned, unlocks, next steps.
// recordRunEnd runs ONCE per finished run, then the saved run is cleared.
// Owner: AI-7

import { go, getMeta, saveCurrentMeta } from '../ui.js';
import { makeButton } from '../components/button.js';
import { showToast } from '../components/toast.js';
import { tickNumber } from '../components/numberTicker.js';
import { loadRun, clearRun } from '../../core/save.js';
import { emit } from '../../core/events.js';
import { formatNumber } from '../../core/format.js';
import { playSfx } from '../../audio/sfx.js';
import { buzz } from '../../platform/haptics.js';
import { runSummary } from '../../run/runState.js';
import { recordRunEnd } from '../../meta/stats.js';
import { shareCode } from '../../meta/daily.js';
import { getPart } from '../../engine/parts/index.js';
import { getInventor } from '../../data/inventors.js';
import { startNormalRun } from '../startRun.js';
import { CHEATED_TEXT } from '../flow.js';
import { lossTipText, neededText } from '../teach.js';

let timers = [];

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function statRow(label, value) {
  const row = el('div', 'row statRow');
  row.append(el('div', 'dim', label), el('div', 'spacer'), el('div', 'num', value));
  return row;
}

function unlockName(reward) {
  if (reward.type === 'part') {
    const part = getPart(reward.id);
    return 'New part: ' + (part ? part.name : reward.id);
  }
  const inventor = getInventor(reward.id);
  return 'New inventor: ' + (inventor ? inventor.name : reward.id);
}

// Items slide in one after another (opacity + transform only).
function revealList(items) {
  const list = el('div', 'revealList');
  items.forEach(function (text, i) {
    const row = el('div', 'panel revealItem', text);
    row.style.transitionDelay = (i * 160) + 'ms';
    list.appendChild(row);
    timers.push(setTimeout(function () { row.classList.add('isShown'); }, 60));
  });
  return list;
}

function copyShare(summary) {
  const text = shareCode(summary.daily, {
    shiftReached: summary.shiftReached, bestFire: summary.bestFire, won: summary.won
  });
  const done = function () { showToast('Copied to clipboard.'); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, function () { showToast(text); });
  } else {
    showToast(text);
  }
}

export function mount(root, params) {
  const run = loadRun();
  if (!run || (run.phase !== 'won' && run.phase !== 'lost')) {
    const target = !run ? 'home' : (run.phase === 'shop' ? 'shop' : 'run');
    timers.push(setTimeout(function () { go(target); }, 0));
    return;
  }
  const meta = getMeta();
  const summary = runSummary(run);
  // Count the run once, save, then drop the saved run so a reload cannot count it twice.
  const gains = recordRunEnd(meta, run);
  saveCurrentMeta();
  clearRun();

  const won = summary.won;
  const screen = el('div', 'screen resultsScreen');
  screen.dataset.screen = 'results';
  screen.appendChild(el('h1', 'resultsTitle ' + (won ? 'good' : 'bad'), won ? 'RUN COMPLETE' : 'RUN OVER'));

  const stats = el('div', 'panel');
  stats.append(
    statRow('Shifts cleared', summary.shiftsCleared + ' / 8'),
    statRow('Best Fire', formatNumber(summary.bestFire || 0)),
    statRow('Parts owned', String(summary.partsOwned.length))
  );
  screen.appendChild(stats);

  // A friendly tip after a loss. Never blames the player.
  if (!won && run.cheated !== true) {
    const needed = neededText(summary.neededTotal, summary.bestFireLastShift);
    const tip = lossTipText(summary.tipId);
    if (needed || tip) {
      const box = el('div', 'panel tipBox');
      if (needed) box.appendChild(el('div', 'tipNeeded', needed));
      if (tip) box.appendChild(el('div', 'dim tipText', tip));
      screen.appendChild(box);
    }
  }

  // A cheated run earns nothing, so there is no dust panel and no reveal animation.
  const cheated = run.cheated === true;
  const dust = el('div', 'panel row');
  dust.appendChild(el('div', 'dim', cheated ? CHEATED_TEXT : 'Spark Dust earned'));
  const dustNum = el('div', 'num dustNum', '0');
  dust.append(el('div', 'spacer'));
  if (!cheated) dust.appendChild(dustNum);
  screen.appendChild(dust);

  const lines = [];
  if (!cheated) {
    gains.newAchievements.forEach(function (a) { lines.push(a.name + ': ' + a.description); });
    gains.newUnlocks.forEach(function (u) { lines.push(unlockName(u)); });
  }
  if (lines.length > 0) {
    screen.appendChild(el('h2', '', 'Unlocked'));
    screen.appendChild(revealList(lines));
  }

  screen.appendChild(el('div', 'spacer'));
  const isDaily = typeof summary.daily === 'string' && summary.daily !== '';
  if (isDaily) {
    screen.appendChild(makeButton('Share result', function () { copyShare(summary); }, { kind: 'secondary' }));
  } else {
    screen.appendChild(makeButton('New run', function () {
      startNormalRun(getMeta(), summary.inventorId, summary.voltage);
    }, { kind: 'primary', big: true }));
  }
  screen.appendChild(makeButton('Home', function () { go('home'); }, { kind: isDaily ? 'primary' : 'secondary' }));
  root.appendChild(screen);

  playSfx(won ? 'win' : 'lose');
  buzz(won ? 'heavy' : 'medium');
  emit('ui:runEnded', { won: won });
  if (!cheated) {
    timers.push(setTimeout(function () {
      tickNumber(dustNum, 0, gains.dustEarned, 900);
      if (lines.length > 0) playSfx('unlock');
    }, 400));
  }
  requestAnimationFrame(function () { screen.classList.add('isShown'); });
}

export function unmount() {
  timers.forEach(clearTimeout);
  timers = [];
}
