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

// A twist chip is a real button, so it can be tapped to read the twist again.
function makeChip(name, onTap) {
  const chip = el('button', 'pill twist twistChip', name);
  chip.type = 'button';
  chip.addEventListener('click', function () { if (onTap) onTap(name); });
  return chip;
}

// Returns { element, update(run, shownTotal) }.
// options.onTwistTap(name) is called when a twist chip is tapped (it shows the twist text again).
// options.onHelp() adds the "?" button that opens How to Play.
export function makeHud(options) {
  const opts = options || {};
  const element = el('div', 'panel hud');
  element.dataset.tut = 'hud';

  const top = el('div', 'row hudTop');
  const shift = el('div', 'hudShift');
  const coins = el('div', 'pill coin');
  const gentle = el('div', 'pill gentlePill', 'Gentle');
  gentle.hidden = true;
  top.append(shift, gentle, el('div', 'spacer'), coins);
  if (opts.onHome) {
    const home = el('button', 'helpBtn homeBtn', '\u2302');
    home.type = 'button';
    home.setAttribute('aria-label', 'Go Home (your run is saved)');
    home.addEventListener('click', opts.onHome);
    top.appendChild(home);
  }
  if (opts.onHelp) {
    const help = el('button', 'helpBtn', '?');
    help.type = 'button';
    help.setAttribute('aria-label', 'How to play');
    help.addEventListener('click', opts.onHelp);
    top.appendChild(help);
  }

  const targetRow = el('div', 'row hudTarget');
  targetRow.appendChild(el('div', 'labelCaps', 'TARGET'));
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
      twists.appendChild(makeChip(names[i], opts.onTwistTap));
    }
    gentle.hidden = !(run.bonuses && run.bonuses.gentle);
    element.classList.toggle('noTwists', names.length === 0);
  }
  return { element: element, update: update };
}
