// The shop between shifts: offers, reroll, bench (to sell), mini board, Next shift.
// Owner: AI-7 (covered by AI-4 in round 5: buy, sell and reroll animations, shift cleared strip)

import { go, getMeta, saveCurrentMeta, setCurrentRun } from '../ui.js';
import { makeButton, setButtonLabel } from '../components/button.js';
import { makePartCard } from '../components/partCard.js';
import { makeBenchRow } from '../components/benchRow.js';
import { makeSelectedPanel } from '../components/selectedPanel.js';
import { showToast } from '../components/toast.js';
import { createBoardView } from '../../render/boardView.js';
import { loadRun, saveRun, getFlag, setFlag } from '../../core/save.js';
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
import { ownedCount, ownedHintText, SHOP_TIP } from '../teach.js';
import { currentTier } from './fxBase.js';
import { makeGhost, flyGhost, dealOffers, dimSold, pulse, floatLabel, tickCoins } from './shopFx.js';
import { makeClearedStrip } from './resultsFx.js';
import { starsForShift } from '../../run/celebration.js';

let run = null;
let view = null;
let selectedBench = -1;
let mergedPartId = '';
let els = null;
let timers = [];
let leaving = false; // a go() is already on its way
let celebrated = ''; // the shift whose cleared strip was already shown in this session

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
      level: offer.level, price: offer.price, showDesc: true, rot: 0,
      note: offer.sold ? '' : ownedHintText(ownedCount(run, offer.partId, offer.level)),
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
  const info = item ? { partId: item.partId, level: item.level, where: 'bench', rot: 0 } : null;
  els.panel.replaceChildren(makeSelectedPanel(info, { onSell: onSell },
    { emptyText: 'Parts you buy go to your bench. You place them on the next shift.' }));
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
// The card that just arrived on the bench (the merged one after a level up).
function benchArrival(partId, merged) {
  const cards = els.bench.querySelectorAll('.partCard');
  let found = null;
  cards.forEach(function (c) {
    if (merged && c.classList.contains('merged')) found = c;
    if (!merged && c.dataset.partId === partId) found = c;
  });
  return found || els.bench;
}

function onBuy(index) {
  const tier = currentTier();
  const oldCoins = run.coins;
  const partId = run.offers[index] ? run.offers[index].partId : '';
  const ghost = makeGhost(els.offers.children[index]);
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
  dimSold(els.offers.children[index], tier);
  tickCoins(els.coins, oldCoins, run.coins, tier);
  const target = benchArrival(partId, !!(out.merged && out.merged.length > 0));
  if (target !== els.bench) target.style.opacity = '0';
  flyGhost(ghost, target, tier).then(function () {
    target.style.opacity = '';
    pulse(els.coins, tier);
  });
}

function onSell() {
  if (selectedBench < 0) return;
  const tier = currentTier();
  const oldCoins = run.coins;
  const ghost = makeGhost(els.bench.querySelector('.partCard.isSelected'));
  const out = sellPart(run, { kind: 'bench', index: selectedBench });
  if (!out.ok) { refuse(out.reason); return; }
  playSfx('sell');
  buzz('light');
  selectedBench = -1;
  mergedPartId = '';
  saveRun(run);
  emit('ui:sold', { coins: out.coins });
  draw();
  tickCoins(els.coins, oldCoins, run.coins, tier);
  flyGhost(ghost, els.coins, tier).then(function () {
    pulse(els.coins, tier);
    floatLabel(els.coins, '+' + formatNumber(out.coins), tier);
  });
}

function onReroll() {
  const tier = currentTier();
  const oldCoins = run.coins;
  const out = rerollOffers(run);
  if (!out.ok) { refuse(out.reason); return; }
  playSfx('reroll');
  mergedPartId = '';
  saveRun(run);
  emit('ui:rerolled', {});
  draw();
  dealOffers(els.offers, tier);
  tickCoins(els.coins, oldCoins, run.coins, tier);
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

// The "Shift N cleared" strip, shown once per shift in a session (not after a cheat or a reload mid-shop).
function clearedStripFor(current) {
  const history = current.history || [];
  const entry = history.length > 0 ? history[history.length - 1] : null;
  if (!entry || entry.shift !== current.shift || !(entry.total >= entry.target)) return null;
  const key = current.seed + ':' + current.shift;
  if (celebrated === key) return null;
  celebrated = key;
  const coins = current.lastFire && current.lastFire.coinsEarned ? current.lastFire.coinsEarned : 0;
  return makeClearedStrip(entry, starsForShift(entry.total, entry.target), coins, currentTier());
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
  // The offers, bench and so on scroll inside the body; Next shift stays below it,
  // always reachable, with the screen's own padding as the space under it.
  const body = el('div', 'shopBody');
  // One short tip the very first time the shop opens, then never again (remembered in the flags).
  if (!getFlag('shopTip')) {
    body.appendChild(el('div', 'tipLine', SHOP_TIP));
    setFlag('shopTip', true);
  }
  body.append(offers, reroll, mini, bench, panel);
  const strip = clearedStripFor(run);
  if (strip) body.insertBefore(strip, body.firstChild);
  screen.append(top, body, next);
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
