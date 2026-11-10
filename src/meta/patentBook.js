// Patent Book logic: which parts are unlocked, which are new, and how to unlock the rest.
// Owner: AI-5
import { ACHIEVEMENTS } from '../data/achievements.js';

export function unlockedPartIds(meta) {
  return meta.unlockedParts.slice();
}

// 'locked' (show a silhouette), 'new' (unlocked, never opened) or 'seen'.
export function partStatus(meta, partId) {
  if (meta.unlockedParts.indexOf(partId) === -1) return 'locked';
  return meta.seenParts.indexOf(partId) === -1 ? 'new' : 'seen';
}

export function markSeen(meta, partId) {
  if (meta.unlockedParts.indexOf(partId) === -1) return;
  if (meta.seenParts.indexOf(partId) === -1) meta.seenParts.push(partId);
}

// The achievement text that unlocks this part, for example "Win a run with Tinkerbot."
export function unlockHint(partId, deps) {
  const list = deps && deps.achievements ? deps.achievements : ACHIEVEMENTS;
  for (let i = 0; i < list.length; i++) {
    const r = list[i].reward;
    if (r && r.type === 'part' && r.id === partId) return list[i].description;
  }
  return 'Keep playing to find this part.';
}

// How to unlock an inventor, from the achievement that rewards it ('' for the starting inventor).
export function inventorUnlockHint(inventorId, deps) {
  const list = deps && deps.achievements ? deps.achievements : ACHIEVEMENTS;
  for (let i = 0; i < list.length; i++) {
    const r = list[i].reward;
    if (r && r.type === 'inventor' && r.id === inventorId) return list[i].description;
  }
  return '';
}

// Every part the book shows: the parts library plus anything unlocked or promised by an achievement,
// so a locked silhouette still appears while the library is growing.
export function bookPartIds(meta, libraryIds, deps) {
  const list = deps && deps.achievements ? deps.achievements : ACHIEVEMENTS;
  const out = Array.isArray(libraryIds) ? libraryIds.slice() : [];
  for (let i = 0; i < meta.unlockedParts.length; i++) {
    if (out.indexOf(meta.unlockedParts[i]) === -1) out.push(meta.unlockedParts[i]);
  }
  for (let i = 0; i < list.length; i++) {
    const r = list[i].reward;
    if (r && r.type === 'part' && out.indexOf(r.id) === -1) out.push(r.id);
  }
  return out;
}
