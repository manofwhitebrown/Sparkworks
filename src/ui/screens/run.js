// The run screen: HUD, board, bench, selected-part panel and the FIRE button.
// The run lives in the save (loadRun/saveRun), so a reload resumes it.
// Owner: AI-7

import { go, getMeta, saveCurrentMeta, setCurrentRun, getFireSpeed } from '../ui.js';
import { makeButton } from '../components/button.js';
import { showToast } from '../components/toast.js';
import { makeHud } from '../components/hud.js';
import { makeBenchRow } from '../components/benchRow.js';
import { makeSelectedPanel } from '../components/selectedPanel.js';
import { createBoardView } from '../../render/boardView.js';
import { loadRun, saveRun } from '../../core/save.js';
import { emit, on, off } from '../../core/events.js';
import { playSfx, playPass } from '../../audio/sfx.js';
import { buzz } from '../../platform/haptics.js';
import { getCellAt } from '../../engine/board.js';
import { partStatus, markSeen } from '../../meta/patentBook.js';
import { placeFromBench, moveOnBoard, rotatePart, returnToBench, fire } from '../../run/runState.js';
import { sellPart } from '../../run/shop.js';
import { benchSizeOf } from '../../run/runRules.js';
import { reasonText, shownTotalDuring, nextScreenAfterFire, fireBannerText, screenForPhase } from '../flow.js';

let run = null;
let view = null;
let alive = false;
let firing = false;
let selected = null; // null | { where: 'bench', index } | { where: 'board', x, y }
let ui = null;       // pointers to the elements we update
let timers = [];
let leaving = false; // a go() is already on its way

function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

function el(tag, className) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

// ---------- state helpers ----------
function save() { saveRun(run); }

function refuse(reason) {
  showToast(reasonText(reason));
  playSfx('error');
}

// Part cards the player now owns count as "seen" in the Patent Book.
function markPartsSeen() {
  const meta = getMeta();
  let changed = false;
  const ids = run.bench.map(function (b) { return b.partId; });
  run.machine.cells.forEach(function (c) { ids.push(c.partId); });
  ids.forEach(function (id) {
    if (partStatus(meta, id) === 'new') { markSeen(meta, id); changed = true; }
  });
  if (changed) saveCurrentMeta();
}

function selectedInfo() {
  if (!selected) return null;
  if (selected.where === 'bench') {
    const item = run.bench[selected.index];
    return item ? { partId: item.partId, level: item.level, where: 'bench' } : null;
  }
  const cell = getCellAt(run.machine, selected.x, selected.y);
  return cell ? { partId: cell.partId, level: cell.level, where: 'board' } : null;
}

// ---------- drawing ----------
function drawBoard() {
  view.setMachine(run.machine);
  view.setHighlightCells(run.machine.blocked);
  view.setSelectedCell(selected && selected.where === 'board' ? selected.x : null,
    selected && selected.where === 'board' ? selected.y : null);
}

function drawLower() {
  if (!selectedInfo()) selected = null;
  markPartsSeen();
  const bench = makeBenchRow(run, selected && selected.where === 'bench' ? selected.index : -1,
    benchSizeOf(run), { onSelect: onBenchSelect, onDrop: onBenchDrop });
  ui.benchSlot.replaceChildren(bench);
  ui.panelSlot.replaceChildren(makeSelectedPanel(selectedInfo(), {
    onRotate: onRotate, onToBench: onToBench, onSell: onSell
  }));
  ui.fireBtn.disabled = firing || run.firesLeft <= 0 || run.phase !== 'build';
  ui.fireLabel.textContent = 'FIRE';
}

function refresh() {
  ui.hud.update(run, run.shiftTotal);
  drawBoard();
  drawLower();
}

// ---------- building actions ----------
function afterAction(out, sfx, eventName, data) {
  if (!out.ok) { refuse(out.reason); return false; }
  playSfx(sfx);
  buzz('light');
  save();
  emit(eventName, data || {});
  return true;
}

function onBenchSelect(index) {
  if (firing) return;
  const same = selected && selected.where === 'bench' && selected.index === index;
  selected = same ? null : { where: 'bench', index: index };
  playSfx('tap');
  refresh();
}

function placeBenchAt(index, x, y) {
  const out = placeFromBench(run, index, x, y, 0);
  if (afterAction(out, 'place', 'ui:placed', { x: x, y: y })) selected = null;
  refresh();
}

function onBenchDrop(index, clientX, clientY) {
  if (firing) return;
  const cell = view.cellAtPoint(clientX, clientY);
  if (!cell) { selected = { where: 'bench', index: index }; refresh(); return; }
  placeBenchAt(index, cell.x, cell.y);
}

function onCellTap(x, y) {
  if (firing) { view.skip(); return; }
  const cell = getCellAt(run.machine, x, y);
  if (selected && selected.where === 'bench') {
    if (cell) { selected = { where: 'board', x: x, y: y }; refresh(); return; }
    placeBenchAt(selected.index, x, y);
    return;
  }
  if (selected && selected.where === 'board' && !cell) {
    const out = moveOnBoard(run, selected.x, selected.y, x, y);
    if (afterAction(out, 'place', 'ui:placed', { x: x, y: y })) selected = { where: 'board', x: x, y: y };
    refresh();
    return;
  }
  const same = selected && selected.x === x && selected.y === y;
  selected = cell && !same ? { where: 'board', x: x, y: y } : null;
  if (cell) playSfx('tap');
  refresh();
}

function onCellDrag(fromX, fromY, toX, toY) {
  if (firing) return;
  const out = moveOnBoard(run, fromX, fromY, toX, toY);
  if (afterAction(out, 'place', 'ui:placed', { x: toX, y: toY })) selected = { where: 'board', x: toX, y: toY };
  refresh();
}

function onRotate() {
  if (!selected || selected.where !== 'board') return;
  afterAction(rotatePart(run, selected.x, selected.y), 'rotate', 'ui:rotated', {});
  refresh();
}

function onToBench() {
  if (!selected || selected.where !== 'board') return;
  const out = returnToBench(run, selected.x, selected.y);
  if (afterAction(out, 'tap', 'ui:placed', {})) selected = null;
  refresh();
}

function onSell() {
  if (!selected) return;
  const where = selected.where === 'bench'
    ? { kind: 'bench', index: selected.index }
    : { kind: 'board', x: selected.x, y: selected.y };
  const out = sellPart(run, where);
  if (afterAction(out, 'sell', 'ui:sold', { coins: out.coins })) selected = null;
  refresh();
}

// ---------- firing ----------
function showBanner(text, kind) {
  ui.banner.textContent = text;
  ui.banner.className = 'fireBanner ' + kind;
  requestAnimationFrame(function () { ui.banner.classList.add('isShown'); });
}

function makePlayHandler(totalBefore, counter) {
  return function (event) {
    if (event.type === 'enter') { playPass(counter.step); counter.step += 1; }
    if (event.type === 'bank') {
      ui.hud.update(run, shownTotalDuring(totalBefore, event.runningTotal));
      playSfx('bank');
      buzz('light');
    }
    if (event.type === 'fizzle') playSfx('fizzle');
  };
}

async function onFire() {
  if (firing) return;
  const totalBefore = run.shiftTotal;
  const out = fire(run);
  if (!out.ok) { refuse(out.reason); return; }
  firing = true;
  selected = null;
  save(); // fire() already moved the run on; a reload now lands in shop/results
  emit('ui:fired', {});
  playSfx('fire');
  ui.skipBtn.hidden = false;
  drawLower();
  const meta = getMeta();
  // The run's shiftTotal already includes this Fire, so show the earlier total first.
  ui.hud.update(run, totalBefore);
  ui.onEvent = makePlayHandler(totalBefore, { step: 0 });
  const pace = getFireSpeed(); // cheat menu speed; 'instant' means skip at once
  const playing = view.play(out.result.events, { speed: pace.speed, reduceMotion: !!meta.settings.reduceMotion });
  if (pace.instant) view.skip();
  await playing;
  if (!alive) return;
  finishFire(out);
}

function finishFire(out) {
  ui.skipBtn.hidden = true;
  ui.hud.update(run, run.shiftTotal);
  const text = fireBannerText(run);
  const good = out.passed || run.phase === 'won';
  showBanner(text, good ? 'good' : 'bad');
  playSfx(good ? 'bank' : 'fizzle');
  emit('ui:fireDone', { total: out.result.total, passed: out.passed });
  const next = nextScreenAfterFire(run);
  later(function () {
    ui.banner.classList.remove('isShown');
    firing = false;
    if (next === 'run') { refresh(); } else { go(next); }
  }, getMeta().settings.reduceMotion ? 500 : 1300);
}

// ---------- cheat menu ----------
// A cheat changed the live run: save it and show whatever its phase needs.
function onCheatChanged() {
  if (!alive || !run || leaving) return;
  if (firing) return; // finishFire() refreshes the screen when the Fire ends
  save();
  const next = screenForPhase(run.phase);
  if (next !== 'run') { leaving = true; go(next); return; }
  refresh();
}

// ---------- mount ----------
export function mount(root, params) {
  // The tutorial hands over its own scripted run in params.run.
  run = params && params.run ? params.run : loadRun();
  if (!run) { later(function () { go('home'); }, 0); return; }
  if (run.phase === 'shop') { later(function () { go('shop'); }, 0); return; }
  if (run.phase === 'won' || run.phase === 'lost') { later(function () { go('results'); }, 0); return; }
  alive = true;
  firing = false;
  leaving = false;
  selected = null;
  setCurrentRun(run);
  on('cheat:changed', onCheatChanged);

  const screen = el('div', 'screen runScreen');
  screen.dataset.screen = 'run';
  const hud = makeHud();
  const slot = el('div', 'boardSlot');
  const wrap = el('div', 'boardWrap');
  wrap.dataset.tut = 'board';
  const banner = el('div', 'fireBanner');
  wrap.appendChild(banner);
  slot.appendChild(wrap);
  const benchSlot = el('div');
  const panelSlot = el('div');
  const fireRow = el('div', 'fireRow');
  const fireBtn = makeButton('FIRE', onFire, { kind: 'primary', big: true });
  fireBtn.dataset.tut = 'fire';
  const skipBtn = makeButton('Skip', function () { view.skip(); }, { kind: 'ghost' });
  skipBtn.hidden = true;
  fireRow.append(fireBtn, skipBtn);
  screen.append(hud.element, slot, benchSlot, panelSlot, fireRow);
  root.appendChild(screen);
  ui = { hud: hud, benchSlot: benchSlot, panelSlot: panelSlot, fireBtn: fireBtn,
    fireLabel: fireBtn.querySelector('.btnLabel'), skipBtn: skipBtn, banner: banner };

  view = createBoardView(wrap, {
    onCellTap: onCellTap, onCellDrag: onCellDrag, onEventPlayed: function (e) { if (ui) ui.onEvent(e); }
  });
  ui.onEvent = function () {};
  const quality = getMeta().settings.quality;
  if (quality && quality !== 'auto') view.setQuality(quality);
  refresh();
  requestAnimationFrame(function () { screen.classList.add('isShown'); });
}

export function unmount() {
  alive = false;
  off('cheat:changed', onCheatChanged);
  setCurrentRun(null);
  timers.forEach(clearTimeout);
  timers = [];
  if (view) view.destroy();
  view = null;
  ui = null;
}
