// Small DOM helpers shared by the four meta screens (workshop, patent book, daily, settings).
// Styles are added once from here, using only AI-7's CSS tokens, so AI-7's CSS files stay untouched.
// Owner: AI-5
import { makeButton } from '../ui/components/button.js';

const STYLE_ID = 'metaScreenStyles';

const CSS = [
  '.metaHead { display: flex; align-items: center; gap: var(--s3); margin-bottom: var(--s4); }',
  '.metaHead h1 { flex: 1; margin: 0; font-size: var(--fs-title); }',
  '.metaList { display: flex; flex-direction: column; gap: var(--s3); }',
  '.metaRow { display: flex; align-items: center; gap: var(--s3); }',
  '.metaRow .grow { flex: 1; min-width: 0; }',
  '.metaName { font-weight: 700; font-size: var(--fs-base); }',
  '.metaPips { display: flex; gap: var(--s1); margin-top: var(--s2); }',
  '.metaPips .mpip { width: 12px; height: 12px; border-radius: 50%; background: var(--panel); border: 1px solid var(--line); }',
  '.metaPips .mpip.on { background: var(--spark); border-color: var(--sparkHot); }',
  '.metaCard { display: flex; align-items: center; gap: var(--s3); padding: var(--s3); border: 1px solid var(--line);',
  '  border-radius: var(--r2); background: var(--surface-panel); box-shadow: var(--edge-light), var(--shadow-1); }',
  '.metaCard .grow { flex: 1; min-width: 0; }',
  '.metaCard.isDone { border-color: var(--spark); }',
  '.metaLabel { font-size: var(--fs-label); font-weight: 600; letter-spacing: var(--ls-label); text-transform: uppercase; color: var(--textDim); }',
  '.metaHero { padding: var(--s4); text-align: center; border: 1px solid var(--line); border-radius: var(--r3);',
  '  background: var(--warm-wash), var(--surface-raised); box-shadow: var(--edge-light), var(--shadow-1); }',
  '.metaHeroNum { font-family: var(--font-display); font-size: var(--fs-huge); line-height: var(--lh-tight); font-weight: 700;',
  '  letter-spacing: var(--ls-tight); color: var(--sparkHot); font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }',
  '.metaHeroNum.isHero { font-size: var(--fs-hero); }',
  '.metaHero .bar { background: var(--surface-inset); box-shadow: var(--edge-dark); }',
  '.metaHero .dim { font-size: var(--fs-small); margin-top: var(--s1); }',
  '.metaGroup { margin: var(--s3) 0 var(--s1); }',
  '.metaTabs { display: flex; gap: var(--s2); margin-bottom: var(--s3); }',
  '.metaTabs .btn { flex: 1; }',
  '.metaCenter { text-align: center; }',
  '.metaBig { font-size: var(--fs-big); font-weight: 700; color: var(--sparkHot); min-height: 1.2em; }',
  '.metaIntro { display: flex; align-items: center; gap: var(--s3); margin-bottom: var(--s3); padding: var(--s2) var(--s3);',
  '  border: 1px solid var(--line); border-radius: var(--r1); background: var(--panel); }',
  '.metaIntro p { flex: 1; margin: 0; font-size: var(--fs-small); }',
  '.metaSwitch { min-width: 64px; }',
  '.metaSwitch.isOn { color: var(--good); }'
].join('\n');

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

// Title row with a Back button on the left and an optional node (like a dust pill) on the right.
export function makeHeader(title, onBack, rightNode) {
  const head = el('div', 'metaHead');
  head.appendChild(makeButton('Back', onBack, { kind: 'ghost', small: true }));
  head.appendChild(el('h1', '', title));
  if (rightNode) head.appendChild(rightNode);
  return head;
}

export function makePips(level, maxLevel) {
  const pips = el('div', 'metaPips');
  for (let i = 1; i <= maxLevel; i++) {
    pips.appendChild(el('span', i <= level ? 'mpip on' : 'mpip'));
  }
  return pips;
}

// Mount a fresh .screen into root and fade it in. Returns the screen element.
export function makeScreen(root) {
  injectStyles();
  const screen = el('div', 'screen');
  root.appendChild(screen);
  requestAnimationFrame(function () { screen.classList.add('isShown'); });
  return screen;
}

// One plain help sentence under the title, shown until the player taps "Got it".
// key is 'workshop', 'patents' or 'daily' (meta.seenIntro). Returns null when it was already seen.
export function makeIntro(meta, key, text, onDone) {
  if (meta.seenIntro && meta.seenIntro[key] === true) return null;
  const box = el('div', 'metaIntro');
  box.appendChild(el('p', '', text));
  box.appendChild(makeButton('Got it', function () {
    if (!meta.seenIntro) meta.seenIntro = {};
    meta.seenIntro[key] = true;
    box.remove();
    if (onDone) onDone();
  }, { kind: 'secondary', small: true }));
  return box;
}
