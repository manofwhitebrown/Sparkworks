// The bench: a row of compact part cards. Tap selects, dragging up onto the
// board drops the part on the cell under the finger.
// Owner: AI-7

import { makePartCard } from './partCard.js';

const DRAG_START_PX = 10;

function makeGhost(card) {
  const ghost = card.cloneNode(true);
  ghost.classList.add('dragGhost');
  document.body.appendChild(ghost);
  return ghost;
}

function moveGhost(ghost, x, y) {
  ghost.style.transform = 'translate(' + (x - 28) + 'px,' + (y - 60) + 'px)';
}

function wireCard(card, index, handlers) {
  let startX = 0;
  let startY = 0;
  let dragging = false;
  let ghost = null;

  function cleanup() {
    if (ghost) ghost.remove();
    ghost = null;
    dragging = false;
  }
  card.addEventListener('pointerdown', function (e) {
    startX = e.clientX;
    startY = e.clientY;
    dragging = false;
  });
  card.addEventListener('pointermove', function (e) {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const far = Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > DRAG_START_PX;
    if (!dragging && far && startX !== 0) {
      dragging = true;
      card.setPointerCapture(e.pointerId);
      ghost = makeGhost(card);
    }
    if (dragging && ghost) moveGhost(ghost, e.clientX, e.clientY);
  });
  card.addEventListener('pointerup', function (e) {
    const wasDragging = dragging;
    cleanup();
    if (wasDragging) handlers.onDrop(index, e.clientX, e.clientY);
    else handlers.onSelect(index);
  });
  card.addEventListener('pointercancel', cleanup);
  // keyboard: Enter or Space fire a click with no pointer position
  card.addEventListener('click', function (e) {
    if (e.detail === 0) handlers.onSelect(index);
  });
}

// handlers: { onSelect(index), onDrop(index, clientX, clientY) }
export function makeBenchRow(run, selectedIndex, benchSize, handlers) {
  const wrap = document.createElement('div');
  wrap.className = 'benchWrap';
  wrap.dataset.tut = 'bench';
  const label = document.createElement('div');
  label.className = 'dim benchLabel';
  label.textContent = 'Bench ' + run.bench.length + ' / ' + benchSize;
  const row = document.createElement('div');
  row.className = 'benchRow';
  if (run.bench.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dim benchEmpty';
    empty.textContent = 'Empty. Buy parts in the shop.';
    row.appendChild(empty);
  }
  for (let i = 0; i < run.bench.length; i++) {
    const item = run.bench[i];
    const card = makePartCard(item.partId, {
      level: item.level, compact: true, selected: i === selectedIndex
    });
    wireCard(card, i, handlers);
    row.appendChild(card);
  }
  wrap.append(label, row);
  return wrap;
}
