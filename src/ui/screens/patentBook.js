// Patent Book screen: a codex of all parts (with unlock hints) and an Inventors tab.
// Owner: AI-5
import { go, getMeta, saveCurrentMeta } from '../ui.js';
import { makeButton } from '../components/button.js';
import { makePartCard } from '../components/partCard.js';
import { openModal } from '../components/modal.js';
import { allPartIds, getPart } from '../../engine/parts/index.js';
import { INVENTORS } from '../../data/inventors.js';
import { VOLTAGES } from '../../data/voltage.js';
import { partStatus, markSeen, unlockHint, bookPartIds, inventorUnlockHint } from '../../meta/patentBook.js';
import { el, makeHeader, makeScreen, injectStyles, makeIntro } from '../../meta/screenKit.js';

const CSS = [
  '.pbGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); gap: var(--s2); }',
  '.pbCell { position: relative; display: flex; flex-direction: column; gap: var(--s1); min-width: 0; }',
  '.pbNew { position: absolute; top: var(--s1); right: var(--s1); padding: 0 var(--s2); border-radius: var(--r1);',
  '  background: var(--spark); color: var(--bg); font-size: var(--fs-tiny); font-weight: 700; z-index: 1; }',
  '.pbHint { font-size: var(--fs-small); color: var(--textDim); text-align: center; }',
  '.pbLevel { margin-top: var(--s2); }',
  '.pbChips { display: flex; flex-wrap: wrap; gap: var(--s2); margin-top: var(--s2); }',
  '.pbChip { padding: var(--s1) var(--s2); border: 1px solid var(--line); border-radius: var(--r1); font-size: var(--fs-small); }',
  '.pbChip.won { border-color: var(--good); color: var(--good); }',
  '.pbExample { font-size: var(--fs-small); color: var(--spark); }'
].join('\n');

const PASSIVE_TEXT = {
  benchSize: function (n) { return '+' + n + ' bench slot'; },
  shopSlots: function (n) { return '+' + n + ' shop offer'; },
  firesPerShift: function (n) { return '+' + n + ' Fire per shift'; },
  sparkCount: function (n) { return n + ' sparks per Fire'; },
  startValue: function (n) { return 'Sparks start at ' + n; }
};

let tab = 'parts';
let body = null;
let tabRow = null;

function passiveLine(inventor) {
  const texts = [];
  for (const key in inventor.passive || {}) {
    texts.push(PASSIVE_TEXT[key] ? PASSIVE_TEXT[key](inventor.passive[key]) : key);
  }
  return texts.length > 0 ? 'Passive: ' + texts.join(', ') : 'Passive: none';
}

function partName(id) {
  const part = getPart(id);
  return part ? part.name : id;
}

// The plain text for one level. Directional parts name a direction, so show the DOWN version.
function describeAt(part, level) {
  try {
    return part.describe(level, 1);
  } catch (e) {
    return '';
  }
}

// "Example: 2 -> 5" from the part's own example(level), or '' when the part has none.
function exampleAt(part, level) {
  if (typeof part.example !== 'function') return '';
  try {
    const ex = part.example(level);
    if (!ex || typeof ex.before !== 'number' || typeof ex.after !== 'number') return '';
    return 'Example: ' + ex.before + ' \u2192 ' + ex.after;
  } catch (e) {
    return '';
  }
}

function openPartModal(meta, partId) {
  const part = getPart(partId);
  if (!part) return;
  const box = el('div', 'dialogBody');
  box.appendChild(el('h1', '', part.name));
  box.appendChild(el('p', 'dim', part.rarity + ' | cost ' + part.cost));
  const tags = el('div', 'pbChips');
  for (let i = 0; i < part.tags.length; i++) tags.appendChild(el('span', 'pbChip', part.tags[i]));
  box.appendChild(tags);
  for (let level = 1; level <= (part.maxLevel || 3); level++) {
    const row = el('div', 'pbLevel');
    row.appendChild(el('div', 'metaName', 'Level ' + level));
    row.appendChild(el('div', 'dim', describeAt(part, level)));
    const example = exampleAt(part, level);
    if (example) row.appendChild(el('div', 'pbExample num', example));
    box.appendChild(row);
  }
  const how = el('div', 'pbLevel');
  how.appendChild(el('div', 'metaName', 'How you got it'));
  how.appendChild(el('div', 'dim', unlockHint(partId)));
  box.appendChild(how);
  const modal = { close: null };
  box.appendChild(el('div', 'pbLevel')).appendChild(makeButton('Close', function () { modal.close(); }, { kind: 'primary' }));
  modal.close = openModal(box).close;
}

function onPartTap(meta, partId) {
  markSeen(meta, partId);
  saveCurrentMeta();
  openPartModal(meta, partId);
  renderBody();
}

function makeCell(meta, partId) {
  const status = partStatus(meta, partId);
  const cell = el('div', 'pbCell');
  if (status === 'locked') {
    cell.appendChild(makePartCard(partId, { locked: true }));
    cell.appendChild(el('div', 'pbHint', unlockHint(partId)));
    return cell;
  }
  if (status === 'new') cell.appendChild(el('div', 'pbNew', 'NEW'));
  cell.appendChild(makePartCard(partId, { onClick: function () { onPartTap(meta, partId); } }));
  return cell;
}

function buildParts(meta) {
  const ids = bookPartIds(meta, allPartIds());
  let found = 0;
  for (let i = 0; i < ids.length; i++) {
    if (partStatus(meta, ids[i]) !== 'locked') found++;
  }
  const top = el('div', 'panel');
  top.appendChild(el('div', 'metaName num', found + ' of ' + ids.length + ' found'));
  const bar = el('div', 'bar');
  const fill = el('div', 'fill');
  fill.style.transform = 'scaleX(' + (ids.length > 0 ? found / ids.length : 0) + ')';
  bar.appendChild(fill);
  top.appendChild(bar);
  body.appendChild(top);
  const grid = el('div', 'pbGrid');
  for (let i = 0; i < ids.length; i++) grid.appendChild(makeCell(meta, ids[i]));
  body.appendChild(grid);
}

function makeInventorCard(meta, inventor) {
  const unlocked = meta.unlockedInventors.indexOf(inventor.id) !== -1;
  const card = el('div', 'panel');
  card.appendChild(el('div', 'metaName', unlocked ? inventor.name : 'Locked inventor'));
  if (!unlocked) {
    card.appendChild(el('div', 'dim', 'To unlock: ' + (inventorUnlockHint(inventor.id) || 'keep playing')));
    return card;
  }
  card.appendChild(el('div', 'dim', inventor.tagline));
  const kit = [];
  for (let i = 0; i < inventor.startParts.length; i++) kit.push(partName(inventor.startParts[i]));
  card.appendChild(el('div', 'dim', 'Kit: ' + kit.join(', ') + ' | ' + inventor.startCoins + ' coins'));
  card.appendChild(el('div', 'dim', passiveLine(inventor)));
  const wins = meta.wins[inventor.id] || {};
  const chips = el('div', 'pbChips');
  for (let i = 0; i < VOLTAGES.length; i++) {
    const won = wins[String(VOLTAGES[i].level)] === true;
    chips.appendChild(el('span', won ? 'pbChip won' : 'pbChip', 'V' + VOLTAGES[i].level + (won ? ': won' : ': not yet')));
  }
  card.appendChild(chips);
  return card;
}

function buildInventors(meta) {
  const list = el('div', 'metaList');
  for (let i = 0; i < INVENTORS.length; i++) list.appendChild(makeInventorCard(meta, INVENTORS[i]));
  body.appendChild(list);
}

function renderBody() {
  const meta = getMeta();
  body.replaceChildren();
  if (tab === 'parts') buildParts(meta);
  else buildInventors(meta);
}

function renderTabs() {
  tabRow.replaceChildren();
  const names = [['parts', 'Parts'], ['inventors', 'Inventors']];
  for (let i = 0; i < names.length; i++) {
    const key = names[i][0];
    tabRow.appendChild(makeButton(names[i][1], function () { tab = key; renderTabs(); renderBody(); },
      { kind: key === tab ? 'primary' : 'secondary', small: true }));
  }
}

export function mount(root, params) {
  injectStyles();
  if (!document.getElementById('patentBookStyles')) {
    const style = el('style');
    style.id = 'patentBookStyles';
    style.textContent = CSS;
    document.head.appendChild(style);
  }
  const screen = makeScreen(root);
  screen.appendChild(makeHeader('Patent Book', function () { saveCurrentMeta(); go('home'); }));
  const intro = makeIntro(getMeta(), 'patents', 'Every part you find is saved here.', saveCurrentMeta);
  if (intro) screen.appendChild(intro);
  tabRow = el('div', 'metaTabs');
  body = el('div', 'metaList');
  screen.appendChild(tabRow);
  screen.appendChild(body);
  renderTabs();
  renderBody();
}

export function unmount() {
  body = null;
  tabRow = null;
}
