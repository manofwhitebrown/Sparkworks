// The shop between shifts: offers, reroll, bench (to sell), mini board, Next shift.
// Owner: AI-7

import { go, getMeta, saveCurrentMeta, setCurrentRun } from '../ui.js';
import { makeButton, setButtonLabel } from '../components/button.js';
import { makePartCard } from '../components/partCard.js';
import { makeBenchRow } from '../components/benchRow.js';
import { makeSelectedPanel } from '../components/selectedPanel.js';
import { showToast } from '../components/toast.js';
import { createBoardView } from '../../render/boardView.js';
import { loadRun, saveRun } from '../../core/save.js';
import { emit, on, off } from '../../core/events.js';
import { formatNumber } from '../../core/format.js';
import { playSfx } from '../../audio/sfx.js';
import { buzz } from '../../platform/haptics.js';
import { getPart } from '../../engine/parts/index.js';
import { partStatus, markSeen } from '../../meta/patentBook.js';
import { buyOffer, sellPart, rerollOffers, rerollPrice } from '../../run/shop.js';
import { startNextShift } from '../../run/runState.js';
import { benchSizeOf } from '../../run/runRules.js';
import { reasonText, screenForPhase } from '../flow.js';

let run = null;
let view = null;
let selectedBench = -1;
let mergedPartId = '';
let els = null;
let timers = [];
let leaving = false; // a go() is already on its way

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function refuse(reason) {
  showToast(reasonText(reason));
  playSfx('error');
}

function markOffersSeen() {
  const meta = getMeta();
  let changed = false;
  run.offers.forEach(function (offer) {
    if (partStatus(meta, offer.partId) === 'new') { markSeen(meta, offer.partId); changed = true; }
  });
  if (changed) saveCurrentMeta();
}

// ---------- drawing ----------
function drawOffers() {
  els.offers.replaceChildren();
  if (run.offers.length === 0) {
    els.offers.appendChild(el('div', 'dim', 'No offers this shift.'));
    return;
  }
  run.offers.forEach(function (offer, index) {
    const card = makePartCard(offer.partId, {
      level: offer.level, price: offer.price, showDesc: true,
      onClick: function () { onBuy(index); }
    });
    card.classList.add('offerCard');
    if (offer.sold) card.classList.add('isSold');
    els.offers.appendChild(card);
  });
}

function drawBench() {
  const bench = makeBenchRow(run, selectedBench, benchSizeOf(run), {
    onSelect: function (index) {
      selectedBench = selectedBench === index ? -1 : index;
      playSfx('tap');
      draw();
    },
    onDrop: function () {}
  });
  if (mergedPartId) {
    const cards = bench.querySelectorAll('.partCard');
    cards.forEach(function (c) { if (c.dataset.partId === mergedPartId) c.classList.add('merged'); });
  }
  els.bench.replaceChildren(bench);
  const item = selectedBench >= 0 ? run.bench[selectedBench] : null;
  const info = item ? { partId: item.partId, level: item.level, where: 'bench' } : null;
  els.panel.replaceChildren(makeSelectedPanel(info, { onSell: onSell }));
}

function draw() {
  els.coins.textContent = formatNumber(run.coins) + ' coins';
  const price = rerollPrice(run);
  setButtonLabel(els.reroll, price === 0 ? 'Reroll (free)' : 'Reroll (' + formatNumber(price) + ')');
  drawOffers();
  drawBench();
  if (view) view.setMachine(run.machine);
}

// ---------- actions ----------
function onBuy(index) {
  const out = buyOffer(run, index);
  if (!out.ok) { refuse(out.reason); return; }
  buzz('light');
  mergedPartId = '';
  if (out.merged && out.merged.length > 0) {
    mergedPartId = out.merged[0].partId;
    playSfx('merge');
    buzz('medium');
    showToast(getPart(mergedPartId).name + ' reached level ' + out.merged[0].newLevel + '!');
    emit('ui:merged', { partId: mergedPartId });
  } else {
    playSfx('buy');
  }
  saveRun(run);
  emit('ui:bought', { index: index });
  draw();
}

function onSell() {
  if (selectedBench < 0) return;
  const out = sellPart(run, { kind: 'bench', index: selectedBench });
  if (!out.ok) { refuse(out.reason); return; }
  playSfx('sell');
  buzz('light');
  selectedBench = -1;
  mergedPartId = '';
  saveRun(run);
  emit('ui:sold', { coins: out.coins });
  draw();
}

function onReroll() {
  const out = rerollOffers(run);
  if (!out.ok) { refuse(out.reason); return; }
  playSfx('reroll');
  mergedPartId = '';
  saveRun(run);
  emit('ui:rerolled', {});
  draw();
}

function onNext() {
  const out = startNextShift(run);
  if (!out.ok) { refuse(out.reason); return; }
  saveRun(run);
  const moved = out.movedToBench ? out.movedToBench.length : 0;
  if (moved > 0) showToast(moved + ' part(s) moved to your bench.');
  go('run');
}

// ---------- cheat menu ----------
// A cheat changed the live run: save it and show whatever its phase needs.
function onCheatChanged() {
  if (!run || !els || leaving) return;
  saveRun(run);
  const next = screenForPhase(run.phase);
  if (next !== 'shop') { leaving = true; go(next); return; }
  if (selectedBench >= run.bench.length) selectedBench = -1;
  mergedPartId = '';
  draw();
}

// ---------- mount ----------
export function mount(root, params) {
  run = loadRun();
  if (!run || run.phase !== 'shop') {
    const target = !run ? 'home' : (run.phase === 'build' ? 'run' : 'results');
    timers.push(setTimeout(function () { go(target); }, 0));
    return;
  }
  selectedBench = -1;
  mergedPartId = '';
  leaving = false;
  setCurrentRun(run);
  on('cheat:changed', onCheatChanged);
  const screen = el('div', 'screen shopScreen');
  screen.dataset.screen = 'shop';
  const top = el('div', 'row');
  top.append(el('h1', '', 'Shop'), el('div', 'spacer'));
  const coins = el('div', 'pill coin');
  top.appendChild(coins);

  const offers = el('div', 'offerGrid');
  offers.dataset.tut = 'offers';
  const reroll = makeButton('Reroll', onReroll, { small: true });
  reroll.dataset.tut = 'reroll';
  const mini = el('div', 'miniBoard');
  const bench = el('div');
  const panel = el('div');
  const next = makeButton('Next shift', onNext, { kind: 'primary', big: true });
  next.dataset.tut = 'continue';
  next.classList.add('stickyBottom');
  screen.append(top, offers, reroll, mini, bench, panel, next);
  root.appendChild(screen);
  els = { coins: coins, offers: offers, reroll: reroll, bench: bench, panel: panel };

  view = createBoardView(mini, { onCellTap: function () {}, onCellDrag: function () {}, onEventPlayed: function () {} });
  markOffersSeen();
  draw();
  emit('ui:shopOpened', { shift: run.shift });
  requestAnimationFrame(function () { screen.classList.add('isShown'); });
}

export function unmount() {
  off('cheat:changed', onCheatChanged);
  setCurrentRun(null);
  timers.forEach(clearTimeout);
  timers = [];
  if (view) view.destroy();
  view = null;
  els = null;
}
