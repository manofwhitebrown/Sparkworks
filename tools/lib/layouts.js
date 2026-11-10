// Layout helpers for the bot: random layouts, hill climbing, and putting a layout on the real run.
// A layout is a list of { partId, level, x, y, rot }.
// Owner: AI-8

// All parts the player owns right now: on the board and on the bench.
export function ownedParts(run) {
  const parts = [];
  for (let i = 0; i < run.machine.cells.length; i++) {
    const cell = run.machine.cells[i];
    parts.push({ partId: cell.partId, level: cell.level });
  }
  for (let i = 0; i < run.bench.length; i++) {
    parts.push({ partId: run.bench[i].partId, level: run.bench[i].level });
  }
  return parts;
}

function isBlocked(machine, x, y) {
  for (let i = 0; i < machine.blocked.length; i++) {
    if (machine.blocked[i].x === x && machine.blocked[i].y === y) {
      return true;
    }
  }
  return false;
}

export function freeCellList(machine) {
  const list = [];
  for (let y = 0; y < machine.rows; y++) {
    for (let x = 0; x < machine.cols; x++) {
      if (!isBlocked(machine, x, y)) {
        list.push({ x: x, y: y });
      }
    }
  }
  return list;
}

function shuffle(list, rng) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = list[i];
    list[i] = list[j];
    list[j] = temp;
  }
}

function pickRot(partId, rng, getPart) {
  const part = getPart(partId);
  if (part && part.directional) {
    return Math.floor(rng() * 4);
  }
  return 0;
}

// Random cells and rotations. Most of the time one part sits on the source row, so
// the spark always meets something.
export function randomLayout(parts, machine, rng, getPart) {
  const cells = freeCellList(machine);
  shuffle(cells, rng);
  if (rng() < 0.6) {
    for (let i = 0; i < cells.length; i++) {
      if (cells[i].y === machine.sourceRow) {
        const swap = cells[0];
        cells[0] = cells[i];
        cells[i] = swap;
        break;
      }
    }
  }
  const order = parts.slice();
  shuffle(order, rng);
  const layout = [];
  const count = Math.min(order.length, cells.length);
  for (let i = 0; i < count; i++) {
    layout.push({
      partId: order[i].partId,
      level: order[i].level,
      x: cells[i].x,
      y: cells[i].y,
      rot: pickRot(order[i].partId, rng, getPart)
    });
  }
  return layout;
}

function copyLayout(layout) {
  const copy = [];
  for (let i = 0; i < layout.length; i++) {
    copy.push({ partId: layout[i].partId, level: layout[i].level, x: layout[i].x, y: layout[i].y, rot: layout[i].rot });
  }
  return copy;
}

function emptyCellFor(layout, machine, rng) {
  const cells = freeCellList(machine);
  shuffle(cells, rng);
  for (let i = 0; i < cells.length; i++) {
    let used = false;
    for (let j = 0; j < layout.length; j++) {
      if (layout[j].x === cells[i].x && layout[j].y === cells[i].y) {
        used = true;
      }
    }
    if (!used) {
      return cells[i];
    }
  }
  return null;
}

// One small random change: rotate a part, swap two parts, or move a part to an empty cell.
function tweak(layout, machine, rng, getPart) {
  const next = copyLayout(layout);
  if (next.length === 0) {
    return next;
  }
  const a = Math.floor(rng() * next.length);
  const kind = Math.floor(rng() * 3);
  if (kind === 0) {
    next[a].rot = pickRot(next[a].partId, rng, getPart);
  } else if (kind === 1 && next.length > 1) {
    const b = Math.floor(rng() * next.length);
    const x = next[a].x;
    const y = next[a].y;
    next[a].x = next[b].x;
    next[a].y = next[b].y;
    next[b].x = x;
    next[b].y = y;
  } else {
    const cell = emptyCellFor(next, machine, rng);
    if (cell) {
      next[a].x = cell.x;
      next[a].y = cell.y;
    }
  }
  return next;
}

// Keep a change only when the score does not get worse.
export function hillClimb(layout, machine, scoreOf, rng, steps, getPart) {
  let best = layout;
  let bestScore = scoreOf(best);
  for (let i = 0; i < steps; i++) {
    const candidate = tweak(best, machine, rng, getPart);
    const score = scoreOf(candidate);
    if (score >= bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

// A text fingerprint, so we can tell whether the board already matches a layout.
export function layoutKey(layout) {
  const parts = [];
  for (let i = 0; i < layout.length; i++) {
    const p = layout[i];
    parts.push(p.x + ',' + p.y + ',' + p.partId + ',' + p.level + ',' + p.rot);
  }
  parts.sort();
  return parts.join('|');
}

export function boardKey(machine) {
  return layoutKey(machine.cells);
}

// Put a layout on the REAL run with the real run functions.
export function applyLayout(run, layout, api) {
  const old = run.machine.cells.slice();
  for (let i = 0; i < old.length; i++) {
    api.returnToBench(run, old[i].x, old[i].y);
  }
  for (let i = 0; i < layout.length; i++) {
    const item = layout[i];
    for (let b = 0; b < run.bench.length; b++) {
      if (run.bench[b].partId === item.partId && run.bench[b].level === item.level) {
        api.placeFromBench(run, b, item.x, item.y, item.rot);
        break;
      }
    }
  }
}
