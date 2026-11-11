// How to Play: six swipe cards with a token picture each, and a Replay tutorial button.
// Back goes to the screen that opened it (the run is already saved).
// Owner: AI-7

import { go, replayTutorial } from '../ui.js';
import { makeButton } from '../components/button.js';
import { HOWTO_CARDS, cardCounter, cardIndexFromScroll } from '../howtoCards.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function makePicture(rows) {
  const picture = el('div', 'howtoPicture');
  rows.forEach(function (row) {
    const line = el('div', 'howtoRow');
    row.forEach(function (token) {
      const tok = el('div', 'howtoToken ' + token.kind, token.text);
      if (token.text === '') tok.classList.add('empty');
      line.appendChild(tok);
    });
    picture.appendChild(line);
  });
  return picture;
}

function makeCard(card) {
  const node = el('div', 'panel howtoCard');
  node.append(el('h2', 'howtoTitle', card.title), el('p', 'howtoText', card.text), makePicture(card.rows));
  return node;
}

let from = 'home';

export function mount(root, params) {
  from = params && params.from ? params.from : 'home';
  const screen = el('div', 'screen howtoScreen');
  screen.dataset.screen = 'howto';
  screen.appendChild(el('h1', '', 'How to play'));

  const strip = el('div', 'howtoStrip');
  HOWTO_CARDS.forEach(function (card) { strip.appendChild(makeCard(card)); });
  const counter = el('div', 'dim howtoCounter', cardCounter(0, HOWTO_CARDS.length));
  counter.setAttribute('aria-live', 'polite');
  strip.addEventListener('scroll', function () {
    const width = strip.firstElementChild ? strip.firstElementChild.clientWidth : 0;
    counter.textContent = cardCounter(cardIndexFromScroll(strip.scrollLeft, width, HOWTO_CARDS.length), HOWTO_CARDS.length);
  });
  screen.append(strip, counter);

  screen.appendChild(el('div', 'spacer'));
  screen.appendChild(makeButton('Replay tutorial', function () { replayTutorial(); }, { kind: 'secondary' }));
  screen.appendChild(makeButton(from === 'run' ? 'Back to my run' : 'Back', function () { go(from); },
    { kind: 'primary' }));
  root.appendChild(screen);
  requestAnimationFrame(function () { screen.classList.add('isShown'); });
}

export function unmount() {}
