// Pure helpers that read an event log from simulate() and answer two questions
// for the UI: "which cells did the sparks walk through?" and "which parts acted?".
// No state, no DOM. The log is never changed.
// Owner: AI-2

// Adds the cell to the list the first time only. `seen` maps "x,y" to true.
function addCell(list, seen, x, y) {
  const key = x + ',' + y;
  if (seen[key]) {
    return;
  }
  seen[key] = true;
  list.push({ x: x, y: y });
}

// Every cell that any spark (source sparks and their children) entered, each
// cell once, in first-visit order. A portal jump counts: the partner cell the
// spark came out of is part of the path too, right after the portal it entered.
export function pathCells(events) {
  const list = [];
  const seen = {};
  const log = events || [];
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (e.type === 'enter') {
      addCell(list, seen, e.x, e.y);
    } else if (e.type === 'portal') {
      addCell(list, seen, e.toX, e.toY);
    }
  }
  return list;
}

// Every cell where a part really acted: at least one spark entered it while the
// part was active (not banned, not disabled, not on a blocked cell). In first-touch
// order. A portal pair counts as touched at both ends when a spark used it.
// The engine marks such an 'enter' event with a partId, so the log is enough.
export function touchedParts(events) {
  const list = [];
  const seen = {};
  const log = events || [];
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (e.type === 'enter' && typeof e.partId === 'string') {
      addCell(list, seen, e.x, e.y);
    } else if (e.type === 'portal') {
      addCell(list, seen, e.x, e.y);
      addCell(list, seen, e.toX, e.toY);
    }
  }
  return list;
}
