// Merging: 3 owned parts with the same id and level become 1 part of level + 1.
// Owned parts = parts on the board + parts on the bench.
// Owner: AI-4

import { getPart as realGetPart } from '../engine/parts/index.js';
import { placePart, removePart } from '../engine/board.js';

// Every owned part as a small record. Board parts come first (in cell order).
function listOwned(run) {
  const list = [];
  const cells = run.machine.cells;
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    list.push({ kind: 'board', x: c.x, y: c.y, rot: c.rot, partId: c.partId, level: c.level });
  }
  for (let i = 0; i < run.bench.length; i++) {
    const b = run.bench[i];
    list.push({ kind: 'bench', index: i, partId: b.partId, level: b.level });
  }
  return list;
}

// Groups of 3 owned parts with the same partId and level (below maxLevel).
// Each group is { partId, level, members: [3 records] }.
export function findMerges(run, deps) {
  const getPart = deps && deps.getPart ? deps.getPart : realGetPart;
  const owned = listOwned(run);
  const buckets = {};
  const order = [];
  for (let i = 0; i < owned.length; i++) {
    const key = owned[i].partId + '|' + owned[i].level;
    if (!buckets[key]) {
      buckets[key] = [];
      order.push(key);
    }
    buckets[key].push(owned[i]);
  }
  const groups = [];
  for (let k = 0; k < order.length; k++) {
    const members = buckets[order[k]];
    const part = getPart(members[0].partId);
    const maxLevel = part && part.maxLevel ? part.maxLevel : 3;
    if (members[0].level >= maxLevel) {
      continue;
    }
    for (let i = 0; i + 2 < members.length; i += 3) {
      groups.push({
        partId: members[0].partId,
        level: members[0].level,
        members: [members[i], members[i + 1], members[i + 2]]
      });
    }
  }
  return groups;
}

// Take the 3 parts of one group away and put the new part where it belongs.
function mergeOneGroup(run, group) {
  const benchIndexes = [];
  let firstBoard = null;
  for (let i = 0; i < group.members.length; i++) {
    const m = group.members[i];
    if (m.kind === 'board') {
      if (firstBoard === null) {
        firstBoard = m;
      }
      removePart(run.machine, m.x, m.y);
    } else {
      benchIndexes.push(m.index);
    }
  }
  // Remove from the back so the earlier indexes stay correct.
  benchIndexes.sort(function (a, b) { return b - a; });
  for (let i = 0; i < benchIndexes.length; i++) {
    run.bench.splice(benchIndexes[i], 1);
  }
  const newLevel = group.level + 1;
  if (firstBoard !== null) {
    placePart(run.machine, firstBoard.x, firstBoard.y, group.partId, newLevel, firstBoard.rot);
  } else {
    run.bench.push({ partId: group.partId, level: newLevel });
  }
  return { partId: group.partId, newLevel: newLevel };
}

// Merge until nothing is left to merge (a merge can make a new group).
// Returns { count, merges: [{ partId, newLevel }] } for the UI.
export function applyMerges(run, deps) {
  const merges = [];
  let groups = findMerges(run, deps);
  while (groups.length > 0) {
    merges.push(mergeOneGroup(run, groups[0]));
    groups = findMerges(run, deps);
  }
  return { count: merges.length, merges: merges };
}
