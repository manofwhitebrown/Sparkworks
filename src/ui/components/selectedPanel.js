// The panel under the bench: shows the selected part and its actions.
// Owner: AI-7

import { getPart } from '../../engine/parts/index.js';
import { sellValueOf } from '../../run/runRules.js';
import { makeButton } from './button.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// selected: null, or { partId, level, where: 'bench' | 'board' }
// handlers: { onRotate, onToBench, onSell }
export function makeSelectedPanel(selected, handlers) {
  const panel = el('div', 'panel selectedPanel');
  const part = selected ? getPart(selected.partId) : null;
  if (!part) {
    panel.appendChild(el('div', 'dim', 'Tap a part, then tap a cell to place it.'));
    return panel;
  }
  panel.appendChild(el('div', 'selName', part.name + ' (level ' + selected.level + ')'));
  panel.appendChild(el('div', 'dim selDesc', part.describe(selected.level)));
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
