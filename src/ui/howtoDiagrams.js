// Small real boards for the How to Play cards. The events come from the real engine, so the
// picture always shows what the game really does. No DOM here, so node:test can check it.
// Owner: AI-7

import { makeMachine, placePart } from '../engine/board.js';
import { simulate as realSimulate } from '../engine/simulate.js';

function small(cols, rows, sourceRow) {
  return makeMachine({ cols: cols, rows: rows, sourceRow: sourceRow, sparkCount: 1, seed: 5 });
}

// One diagram per card number (0 to 4). Card 5 (level up) has no board, so it returns null.
// Each item is { machine, events }. A card may show two boards (the Order card does).
export function diagramsFor(cardIndex, deps) {
  const simulate = deps && deps.simulate ? deps.simulate : realSimulate;
  const boards = [];
  if (cardIndex === 0) {
    boards.push(small(4, 2, 0));
  } else if (cardIndex === 1) {
    const m = small(4, 2, 0);
    placePart(m, 1, 0, 'coil', 1, 0);
    boards.push(m);
  } else if (cardIndex === 2) {
    const a = small(4, 2, 0);
    placePart(a, 1, 0, 'coil', 1, 0);
    placePart(a, 2, 0, 'amplifier', 1, 0);
    const b = small(4, 2, 0);
    placePart(b, 1, 0, 'amplifier', 1, 0);
    placePart(b, 2, 0, 'coil', 1, 0);
    boards.push(a, b);
  } else if (cardIndex === 3) {
    const m = small(4, 3, 0);
    placePart(m, 1, 0, 'bend', 1, 1);
    placePart(m, 1, 1, 'bend', 1, 0);
    boards.push(m);
  } else if (cardIndex === 4) {
    const m = small(3, 2, 1);
    placePart(m, 1, 1, 'bend', 1, 3);
    boards.push(m);
  }
  return boards.map(function (machine) {
    return { machine: machine, events: simulate(machine).events };
  });
}
