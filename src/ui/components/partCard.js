// Makes one part card: icon, name, rarity border + label, level pips, price.
// Owner: AI-7

import { getPart } from '../../engine/parts/index.js';
import { getPartIconUrl } from '../../render/partIcons.js';
import { formatNumber } from '../../core/format.js';
import { partDescribe, exampleLine, arrowGlyph, arrowWord } from '../teach.js';

const RARITY_LABEL = { common: 'Common', rare: 'Rare', legendary: 'Legendary' };

function makeIcon(partId) {
  const box = document.createElement('div');
  box.className = 'pcIcon';
  try {
    const img = document.createElement('img');
    img.className = 'pcIcon';
    img.alt = '';
    img.draggable = false;
    img.src = getPartIconUrl(partId, 96, '#E8EDF5');
    img.addEventListener('error', function () { img.replaceWith(box); });
    return img;
  } catch (err) {
    return box; // fallback: a plain empty box
  }
}

function makePips(level, maxLevel) {
  const pips = document.createElement('div');
  pips.className = 'pcPips';
  for (let i = 1; i <= maxLevel; i++) {
    const pip = document.createElement('span');
    pip.className = i <= level ? 'pip on' : 'pip';
    pips.appendChild(pip);
  }
  return pips;
}

function addText(card, className, text) {
  const el = document.createElement('div');
  el.className = className;
  el.textContent = text;
  card.appendChild(el);
}

// options: { level, price, selected, compact, locked, onClick, showDesc, rot, note }
// rot (0..3) names the way a directional part points; note is one small extra line (for example "You have 2.").
export function makePartCard(partId, options) {
  const opts = options || {};
  const part = getPart(partId);
  const level = opts.level || 1;
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'partCard';
  if (opts.compact) card.classList.add('compact');
  if (opts.selected) card.classList.add('isSelected');

  if (opts.locked || !part) {
    card.classList.add('locked');
    card.appendChild(makeIcon('locked'));
    addText(card, 'pcName', '???');
  } else {
    card.classList.add(part.rarity);
    card.dataset.partId = partId;
    card.appendChild(makeIcon(partId));
    addText(card, 'pcName', part.name);
    addText(card, 'pcRarity', RARITY_LABEL[part.rarity] || part.rarity);
    card.appendChild(makePips(level, part.maxLevel || 3));
    if (part.directional) {
      const arrow = document.createElement('div');
      arrow.className = 'pcArrow';
      arrow.textContent = arrowGlyph(opts.rot);
      arrow.setAttribute('role', 'img');
      arrow.setAttribute('aria-label', 'points ' + arrowWord(opts.rot));
      card.appendChild(arrow);
    }
    if (opts.showDesc) {
      addText(card, 'pcDesc', partDescribe(part, level, opts.rot));
      const example = exampleLine(part, level);
      if (example) addText(card, 'pcExample num', example);
    }
    if (opts.note) addText(card, 'pcOwned', opts.note);
    if (typeof opts.price === 'number') addText(card, 'pcPrice', formatNumber(opts.price));
  }
  if (opts.onClick) card.addEventListener('click', opts.onClick);
  return card;
}
