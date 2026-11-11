// The panel under the bench: shows the selected part and its actions.
// Owner: AI-7

import { getPart } from '../../engine/parts/index.js';
import { sellValueOf } from '../../run/runRules.js';
import { makeButton } from './button.js';
import { partDescribe, exampleLine, arrowGlyph, arrowWord } from '../teach.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// selected: null, or { partId, level, where: 'bench' | 'board', rot }
// handlers: { onRotate, onToBench, onSell }
// options (optional): { emptyText } the hint shown when nothing is selected
export function makeSelectedPanel(selected, handlers, options) {
  const panel = el('div', 'panel selectedPanel');
  const part = selected ? getPart(selected.partId) : null;
  if (!part) {
    const hint = options && options.emptyText ? options.emptyText : 'Tap a part, then tap a cell to place it.';
    panel.appendChild(el('div', 'dim selHint', hint));
    return panel;
  }
  const name = el('div', 'selName', part.name + ' (level ' + selected.level + ')');
  if (part.directional) {
    const arrow = el('span', 'selArrow', arrowGlyph(selected.rot));
    arrow.setAttribute('role', 'img');
    arrow.setAttribute('aria-label', 'points ' + arrowWord(selected.rot));
    name.appendChild(arrow);
  }
  panel.appendChild(name);
  const example = exampleLine(part, selected.level);
  const desc = el('div', 'dim selDesc', partDescribe(part, selected.level, selected.rot));
  if (example) desc.appendChild(el('span', 'selExample num', ' ' + example));
  panel.appendChild(desc);
  const actions = el('div', 'row selActions');
  if (selected.where === 'board') {
    if (part.directional) {
      actions.appendChild(makeButton('Rotate', handlers.onRotate, { small: true }));
    }
    actions.appendChild(makeButton('To bench', handlers.onToBench, { small: true }));
  }
  const value = sellValueOf(part, selected.level);
  actions.appendChild(makeButton('Sell +' + value, handlers.onSell, { small: true, kind: 'danger' }));
  panel.appendChild(actions);
  return panel;
}
