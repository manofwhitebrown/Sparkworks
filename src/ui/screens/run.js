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
import { FOOTER } from '../../render/layout.js';
import { loadRun, saveRun, getFlag, setFlag } from '../../core/save.js';
import { emit, on, off } from '../../core/events.js';
import { playSfx, playPass } from '../../audio/sfx.js';
import { buzz } from '../../platform/haptics.js';
import { getCellAt } from '../../engine/board.js';
import { partStatus, markSeen } from '../../meta/patentBook.js';
import { placeFromBench, moveOnBoard, rotatePart, returnToBench, fire } from '../../run/runState.js';
import { sellPart } from '../../run/shop.js';
import { benchSizeOf } from '../../run/runRules.js';
import { twistInfos, overloadText, recapText, untouchedParts, untouchedText, showPathDefault,
  DRAG_TIP, ROTATE_TIP } from '../teach.js';
import { suggestPlacement } from '../../tutorial/suggest.js';
import { getPart } from '../../engine/parts/index.js';
import { HINTS_PER_SHIFT, hintLabel, pathLabel, machineKey, previewCells, hintText, hintsLeftFor } from '../runHelp.js';
import { firesPerShiftOf } from '../../run/runRules.js';
import { reasonText, shownTotalDuring, nextScreenAfterFire, fireBannerText, screenForPhase,
  fitBoardSize, validDropCells } from '../flow.js';

let run = null;
let view = null;
let alive = false;
let firing = false;
let shownShift = 0; // the shift the screen last showed, so a jump to a new shift (cheat) still opens the Overload banner
let selected = null; // null | { where: 'bench', index } | { where: 'board', x, y }
let ui = null;       // pointers to the elements we update
let timers = [];
let leaving = false; // a go() is already on its way
let sizeWatcher = null; // ResizeObserver (or a window listener) that keeps the board fitted
let isTutorial = false; // the scripted tutorial run: no hints, no tips (the overlay teaches)
let showPath = false;   // the path preview toggle
let pathKey = '';       // layout the preview was last computed for
let hint = null;        // { index, x, y } while a hint is shown
let hintKey = '';       // run seed + shift the hints were counted for (kept when you come back from How to Play)
let hintsUsed = 0;

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
  return cell ? { partId: cell.partId, level: cell.level, where: 'board', rot: cell.rot } : null;
}

// ---------- drawing ----------
// The board takes the biggest box that fits the room left between HUD and bench.
// The slot gets its height from the flex layout, never from the board, so the
// board can never grow over the HUD or the bench.
function fitBoard() {
  if (!ui || !ui.slot) return;
  const m = run.machine;
  // The view makes square cells with half a cell on each side and a small footer,
  // so a box of (cols + 1) by (rows + FOOTER) wastes nothing.
  const size = fitBoardSize(ui.slot.clientWidth, ui.slot.clientHeight, m.cols + 1, m.rows + FOOTER);
  ui.wrap.style.width = size.width + 'px';
  ui.wrap.style.height = size.height + 'px';
}

// A hint shows ONE glowing cell. Any other choice by the player drops it.
function highlightList() {
  if (hint && selected && selected.where === 'bench' && selected.index === hint.index) {
    return [{ x: hint.x, y: hint.y }];
  }
  hint = null;
  return selected ? validDropCells(run.machine) : [];
}

// The path preview: only the way the sparks go, never the numbers. One simulate per change.
function drawPreview() {
  if (!view.setPreview) return;
  if (!showPath || firing) { view.setPreview([]); pathKey = ''; return; }
  const key = machineKey(run.machine);
  if (key === pathKey) return;
  pathKey = key;
  view.setPreview(previewCells(run.machine));
}

function drawBoard() {
  fitBoard();
  view.setMachine(run.machine);
  // Only show drop targets while a part is selected (the view skips blocked cells itself).
  view.setHighlightCells(highlightList());
  view.setSelectedCell(selected && selected.where === 'board' ? selected.x : null,
    selected && selected.where === 'board' ? selected.y : null);
  drawPreview();
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
  updateHintButton();
}

// ---------- building actions ----------
function afterAction(out, sfx, eventName, data) {
  if (!out.ok) { refuse(out.reason); return false; }
  playSfx(sfx);
  buzz('light');
  save();
  clearRecap();
  emit(eventName, data || {});
  return true;
}

// Each tiny tip shows once and is remembered. Never in the tutorial.
function tipOnce(flag, text) {
  if (isTutorial || getFlag(flag)) return;
  setFlag(flag, true);
  showToast(text);
}

function rotateTipIfNeeded() {
  const info = selectedInfo();
  const part = info ? getPart(info.partId) : null;
  if (part && part.directional) tipOnce('rotateTip', ROTATE_TIP);
}

function onBenchSelect(index) {
  if (firing) return;
  const same = selected && selected.where === 'bench' && selected.index === index;
  selected = same ? null : { where: 'bench', index: index };
  playSfx('tap');
  refresh();
  rotateTipIfNeeded();
}

function placeBenchAt(index, x, y) {
  const out = placeFromBench(run, index, x, y, 0);
  const placed = afterAction(out, 'place', 'ui:placed', { x: x, y: y });
  if (placed) selected = null;
  refresh();
  if (placed) tipOnce('dragTip', DRAG_TIP);
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
  rotateTipIfNeeded();
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

// ---------- Overload banner ----------
// Shows the name and plain description of the shift's twists for 3 seconds.
// It opens by itself when a shift with a twist starts, and again when a twist chip is tapped.
const BANNER_MS = 3000;

function hideTwistBanner() {
  if (ui) ui.twistBanner.classList.remove('isShown');
}

function showTwistBanner() {
  if (!ui) return;
  const names = run.machine.flags && run.machine.flags.twistNames ? run.machine.flags.twistNames : [];
  const text = overloadText(twistInfos(names));
  if (!text.title) return;
  ui.twistBanner.replaceChildren();
  const title = el('div', 'twistTitle');
  title.textContent = text.title;
  const body = el('div', 'twistBody');
  body.textContent = text.body;
  ui.twistBanner.append(title, body);
  ui.twistBanner.classList.add('isShown');
  if (ui.twistTimer) clearTimeout(ui.twistTimer);
  ui.twistTimer = setTimeout(hideTwistBanner, BANNER_MS);
  timers.push(ui.twistTimer);
}

// A shift has just started when no Fire has been used yet.
function shiftJustStarted() {
  return run.phase === 'build' && run.firesLeft === firesPerShiftOf(run);
}

// ---------- recap line (under the HUD, after a Fire) ----------
function clearRecap() {
  if (!ui) return;
  ui.recap.textContent = '';
  ui.recap.hidden = true;
  if (view && view.setDim) view.setDim([]);
}

function showRecap(out) {
  const events = out.result.events || [];
  const missed = untouchedParts(run.machine, events);
  let text = recapText(out.result);
  const extra = untouchedText(missed);
  if (extra) text += ' ' + extra;
  ui.recap.textContent = text;
  ui.recap.hidden = text === '';
  if (view.setDim) view.setDim(missed.map(function (m) { return { x: m.x, y: m.y }; }));
}

// ---------- Path and Hint buttons ----------
function togglePath() {
  showPath = !showPath;
  setFlag('showPath', showPath ? 'on' : 'off');
  ui.pathBtn.querySelector('.btnLabel').textContent = pathLabel(showPath);
  pathKey = '';
  emit('ui:previewToggled', { on: showPath });
  playSfx('tap');
  drawPreview();
}

function updateHintButton() {
  const key = run.seed + ':' + run.shift;
  if (hintKey !== key) { hintKey = key; hintsUsed = 0; }
  const left = hintsLeftFor(hintsUsed);
  ui.hintBtn.querySelector('.btnLabel').textContent = hintLabel(left);
  ui.hintBtn.disabled = left <= 0 || firing || run.phase !== 'build';
}

// The Hint button suggests where one bench part could go. The player still decides.
function onHint() {
  if (firing || hintsLeftFor(hintsUsed) <= 0) return;
  const suggestion = suggestPlacement(run);
  const text = hintText(run, suggestion);
  if (!text) { showToast('Hint: no better spot right now.'); return; }
  hintsUsed += 1;
  hint = { index: suggestion.partIndex, x: suggestion.x, y: suggestion.y };
  selected = { where: 'bench', index: suggestion.partIndex };
  playSfx('hint');
  showToast(text);
  emit('ui:hintUsed', { left: hintsLeftFor(hintsUsed) });
  refresh();
}

function onHelp() {
  if (firing) return;
  go('howto', { from: 'run' });
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
    if (event.type === 'fizzle') {
      playSfx('fizzle');
      // A spark that left by an edge: the renderer draws the marker, the sound is AI-8's.
      if (event.reason === 'edge') emit('ui:sparkLost', { x: event.x, y: event.y, value: event.value });
    }
  };
}

async function onFire() {
  if (firing) return;
  const totalBefore = run.shiftTotal;
  const out = fire(run);
  if (!out.ok) { refuse(out.reason); return; }
  firing = true;
  selected = null;
  clearRecap();
  drawPreview();
  save(); // fire() already moved the run on; a reload now lands in shop/results
  emit('ui:fired', { events: out.result.events });
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
    if (next === 'run') { refresh(); showRecap(out); } else { go(next); }
  }, getMeta().settings.reduceMotion ? 500 : 1300);
}

// Refit the board whenever the slot changes size (rotation, largeText, window resize).
function watchSize() {
  if (typeof ResizeObserver !== 'undefined') {
    sizeWatcher = new ResizeObserver(function () { fitBoard(); });
    sizeWatcher.observe(ui.slot);
  } else {
    sizeWatcher = { disconnect: function () { window.removeEventListener('resize', fitBoard); } };
    window.addEventListener('resize', fitBoard);
  }
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
  if (run.shift !== shownShift) {
    shownShift = run.shift;
    if (shiftJustStarted()) showTwistBanner();
  }
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
  hint = null;
  pathKey = '';
  isTutorial = !!(params && params.tutorial) || run.tutorial === true;
  const saved = getFlag('showPath');
  const gentle = !!(run.bonuses && run.bonuses.gentle);
  showPath = !isTutorial && (gentle || (saved ? saved === 'on' : showPathDefault(getMeta().stats.runs, false)));
  setCurrentRun(run);
  on('cheat:changed', onCheatChanged);

  const screen = el('div', 'screen runScreen');
  screen.dataset.screen = 'run';
  const hud = makeHud({ onTwistTap: showTwistBanner, onHelp: onHelp });
  const recap = el('div', 'recapLine');
  recap.hidden = true;
  const slot = el('div', 'boardSlot');
  const wrap = el('div', 'boardWrap');
  wrap.dataset.tut = 'board';
  const banner = el('div', 'fireBanner');
  wrap.appendChild(banner);
  slot.appendChild(wrap);
  const twistBanner = el('div', 'twistBanner');
  twistBanner.addEventListener('click', hideTwistBanner);
  slot.appendChild(twistBanner);
  const benchSlot = el('div');
  const panelSlot = el('div');
  const fireRow = el('div', 'fireRow');
  const fireBtn = makeButton('FIRE', onFire, { kind: 'primary', big: true });
  fireBtn.dataset.tut = 'fire';
  const skipBtn = makeButton('Skip', function () { view.skip(); }, { kind: 'ghost' });
  skipBtn.hidden = true;
  // Path and Hint are small and secondary and sit beside FIRE. Not in the scripted tutorial.
  const pathBtn = makeButton(pathLabel(showPath), togglePath, { kind: 'ghost', small: true });
  const hintBtn = makeButton(hintLabel(HINTS_PER_SHIFT), onHint, { kind: 'ghost', small: true });
  pathBtn.hidden = isTutorial;
  hintBtn.hidden = isTutorial;
  fireRow.append(fireBtn, skipBtn, pathBtn, hintBtn);
  screen.append(hud.element, recap, slot, benchSlot, panelSlot, fireRow);
  root.appendChild(screen);
  ui = { slot: slot, wrap: wrap, hud: hud, benchSlot: benchSlot, panelSlot: panelSlot, fireBtn: fireBtn,
    fireLabel: fireBtn.querySelector('.btnLabel'), skipBtn: skipBtn, banner: banner,
    twistBanner: twistBanner, twistTimer: null, recap: recap, pathBtn: pathBtn, hintBtn: hintBtn };

  view = createBoardView(wrap, {
    onCellTap: onCellTap, onCellDrag: onCellDrag, onEventPlayed: function (e) { if (ui) ui.onEvent(e); }
  });
  ui.onEvent = function () {};
  const quality = getMeta().settings.quality;
  if (quality && quality !== 'auto') view.setQuality(quality);
  view.setReduceMotion(!!getMeta().settings.reduceMotion); // legendary shimmer and effects respect it
  watchSize();
  refresh();
  shownShift = run.shift;
  if (shiftJustStarted()) showTwistBanner();
  // Tells the music which shift is on screen (also after Continue run, when no other event is sent).
  emit('ui:runShown', { shift: run.shift });
  requestAnimationFrame(function () { screen.classList.add('isShown'); });
}

export function unmount() {
  alive = false;
  off('cheat:changed', onCheatChanged);
  setCurrentRun(null);
  if (sizeWatcher) sizeWatcher.disconnect();
  sizeWatcher = null;
  timers.forEach(clearTimeout);
  timers = [];
  if (view) view.destroy();
  view = null;
  ui = null;
}
