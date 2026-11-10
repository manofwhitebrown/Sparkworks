// Makes a styled button element with tap sound and a tiny haptic buzz.
// Owner: AI-7

import { playSfx } from '../../audio/sfx.js';
import { buzz } from '../../platform/haptics.js';

// options: { kind: 'primary'|'secondary'|'ghost'|'danger', disabled, icon, small, big }
export function makeButton(label, onClick, options) {
  const opts = options || {};
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'btn ' + (opts.kind || 'secondary');
  if (opts.small) button.classList.add('small');
  if (opts.big) button.classList.add('big');
  if (opts.icon) {
    const icon = document.createElement('span');
    icon.className = 'icon';
    icon.textContent = opts.icon;
    button.appendChild(icon);
  }
  const text = document.createElement('span');
  text.className = 'btnLabel';
  text.textContent = label;
  button.appendChild(text);
  button.disabled = !!opts.disabled;
  button.addEventListener('click', function () {
    if (button.disabled) return;
    playSfx('tap');
    buzz('light');
    if (onClick) onClick();
  });
  return button;
}

// Changes the text of a button made by makeButton.
export function setButtonLabel(button, label) {
  const text = button.querySelector('.btnLabel');
  if (text) text.textContent = label;
}
