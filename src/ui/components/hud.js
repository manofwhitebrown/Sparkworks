// The top HUD of the run screen: shift, coins, target, progress bar, Fires left.
// Owner: AI-7

import { formatNumber } from '../../core/format.js';
import { getTarget } from '../../run/runState.js';
import { progressRatio, shiftText, totalText, firesLeftText } from '../flow.js';

const TOTAL_SHIFTS = 8;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Returns { element, update(run, shownTotal) }.
export function makeHud() {
  const element = el('div', 'panel hud');
  element.dataset.tut = 'hud';

  const top = el('div', 'row hudTop');
  const shift = el('div', 'hudShift');
  const coins = el('div', 'pill coin');
  top.append(shift, el('div', 'spacer'), coins);

  const targetRow = el('div', 'row hudTarget');
  targetRow.appendChild(el('div', 'dim', 'TARGET'));
  const total = el('div', 'num hudTotal');
  // On short screens "Fires left" sits on this row (CSS shows one of the two copies).
  const firesShort = el('div', 'dim hudFires hudFiresShort');
  targetRow.append(el('div', 'spacer'), total, firesShort);

  const bar = el('div', 'bar');
  const fill = el('div', 'fill');
  bar.appendChild(fill);

  const bottom = el('div', 'row hudBottom');
  const fires = el('div', 'dim hudFires');
  const twists = el('div', 'twistChips');
  bottom.append(fires, el('div', 'spacer'), twists);

  element.append(top, targetRow, bar, bottom);

  function update(run, shownTotal) {
    const target = getTarget(run);
    shift.textContent = shiftText(run.shift, TOTAL_SHIFTS);
    coins.textContent = formatNumber(run.coins) + ' coins';
    total.textContent = totalText(shownTotal, target);
    fill.style.transform = 'scaleX(' + progressRatio(shownTotal, target) + ')';
    bar.classList.toggle('done', shownTotal >= target);
    fires.textContent = firesLeftText(run.firesLeft);
    firesShort.textContent = fires.textContent;
    twists.textContent = '';
    const names = run.machine.flags && run.machine.flags.twistNames ? run.machine.flags.twistNames : [];
    for (let i = 0; i < names.length; i++) {
      twists.appendChild(el('span', 'pill twist', names[i]));
    }
    element.classList.toggle('noTwists', names.length === 0);
  }
  return { element: element, update: update };
}
