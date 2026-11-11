// Plain-word helpers for the teaching texts, the recap line and the path preview.
// No DOM here, so node:test can check them. Words follow docs/manager/BEGINNER_REVIEW.md:
// "reaches the vault" (not banked), "lost" (not fizzle), short sentences.
// Owner: AI-7

import { formatNumber } from '../core/format.js';
import { getPart } from '../engine/parts/index.js';
import { TWISTS } from '../engine/twists.js';

export const GOAL_LINE = 'Clear 8 shifts to win.';
export const VOLTAGE_LINE = 'Higher Voltage = harder.';
export const GENTLE_TEXT = 'Easier: more Fires, smaller targets.';
export const SHOP_TIP = 'Tip: Reroll shows new parts. Tap a part on your bench to Sell it.';
export const DRAG_TIP = 'Tip: drag a part to move it.';
export const ROTATE_TIP = 'Tip: tap Rotate to change the arrow.';

// How many parts of the same kind and level the player owns (bench plus board).
// Three of a kind merge into the next level, so this is what the shop hint counts.
export function ownedCount(run, partId, level) {
  let count = 0;
  const bench = run && run.bench ? run.bench : [];
  for (let i = 0; i < bench.length; i++) {
    if (bench[i].partId === partId && bench[i].level === level) count += 1;
  }
  const cells = run && run.machine && run.machine.cells ? run.machine.cells : [];
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].partId === partId && cells[i].level === level) count += 1;
  }
  return count;
}

// "You have 2. Buy 1 more to level up." (empty text when the player owns none).
export function ownedHintText(count) {
  if (!(count >= 1)) return '';
  if (count >= 3) return 'You have ' + count + '.';
  return 'You have ' + count + '. Buy ' + (3 - count) + ' more to level up.';
}

// The line under the HUD after a Fire: "3 sparks reached the vault: 42. 1 lost."
export function recapText(result) {
  if (!result) return '';
  const banked = result.banked > 0 ? result.banked : 0;
  const lost = result.fizzled > 0 ? result.fizzled : 0;
  let text = '';
  if (banked === 0) {
    text = 'No spark reached the vault.';
  } else {
    text = banked + (banked === 1 ? ' spark reached the vault: ' : ' sparks reached the vault: ');
    text += formatNumber(result.total) + '.';
  }
  if (lost > 0) text += ' ' + lost + ' lost.';
  return text;
}

// Parts on the board that no spark ever entered during this Fire.
export function untouchedParts(machine, events) {
  const entered = {};
  for (let i = 0; i < events.length; i++) {
    if (events[i].type === 'enter') entered[events[i].x + ',' + events[i].y] = true;
  }
  const banned = machine.banned || [];
  const list = [];
  for (let i = 0; i < machine.cells.length; i++) {
    const cell = machine.cells[i];
    if (banned.indexOf(cell.partId) !== -1) continue;
    if (!entered[cell.x + ',' + cell.y]) list.push({ x: cell.x, y: cell.y, partId: cell.partId });
  }
  return list;
}

// "Not touched: Coil. The spark never went there. Try the Path button."
export function untouchedText(parts, deps) {
  const lookup = deps && deps.getPart ? deps.getPart : getPart;
  const names = [];
  for (let i = 0; i < parts.length; i++) {
    const part = lookup(parts[i].partId);
    const name = part ? part.name : parts[i].partId;
    if (names.indexOf(name) === -1) names.push(name);
  }
  if (names.length === 0) return '';
  return 'Not touched: ' + names.join(', ') + '. The spark never went there. Try the Path button.';
}

// The cells the SOURCE sparks entered, in order, without repeats. Path only, never numbers.
export function sourcePathCells(events) {
  const sources = {};
  for (let i = 0; i < events.length; i++) {
    if (events[i].type === 'spawn' && events[i].parent === 0) sources[events[i].spark] = true;
  }
  const seen = {};
  const cells = [];
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    if (e.type !== 'enter' || !sources[e.spark]) continue;
    const key = e.x + ',' + e.y;
    if (seen[key]) continue;
    seen[key] = true;
    cells.push({ x: e.x, y: e.y });
  }
  return cells;
}

// Path preview starts ON for the first 3 runs and always in Gentle mode.
export function showPathDefault(runsPlayed, gentle) {
  return !!gentle || !(runsPlayed >= 3);
}

// The friendly tip on the results screen. `tipId` comes from AI-4's run summary.
const LOSS_TIPS = {
  steer: 'Tip: Bend and Splitter can send sparks to the side. The Path button shows where they go.',
  merge: 'Tip: buy 3 of the same part to level it up.',
  coins: 'Tip: spend your coins. Coins do not score.',
  order: 'Tip: try the Amplifier AFTER the Coil.'
};

export function lossTipText(tipId) {
  return LOSS_TIPS[tipId] || '';
}

// "You needed 120. Your best Fire was 85." Empty when either number is missing.
export function neededText(needed, best) {
  if (!(needed > 0) || !(best >= 0)) return '';
  return 'You needed ' + formatNumber(needed) + '. Your best Fire was ' + formatNumber(best) + '.';
}

// Name and plain description of each active twist. The run only stores the names
// (machine.flags.twistNames), so we look the description up by name.
export function twistInfos(names, deps) {
  const table = deps && deps.twists ? deps.twists : TWISTS;
  const list = [];
  const wanted = names || [];
  for (let i = 0; i < wanted.length; i++) {
    let description = '';
    for (const id in table) {
      if (table[id].name === wanted[i]) description = table[id].description || '';
    }
    list.push({ name: wanted[i], description: description });
  }
  return list;
}

// The Overload banner: a short title and the plain description of every active twist.
export function overloadText(infos) {
  if (!infos || infos.length === 0) return { title: '', body: '' };
  const parts = [];
  for (let i = 0; i < infos.length; i++) {
    parts.push(infos[i].description ? infos[i].name + ': ' + infos[i].description : infos[i].name);
  }
  return { title: 'Overload!', body: parts.join(' ') };
}

// ---------- part texts ----------
const ARROWS = ['\u2192', '\u2193', '\u2190', '\u2191']; // right, down, left, up (rot 0..3)
const ARROW_WORDS = ['right', 'down', 'left', 'up'];

// The arrow glyph for a rotation (0..3). Anything else counts as 0 (right).
export function arrowGlyph(rot) {
  return ARROWS[rot >= 0 && rot <= 3 ? Math.floor(rot) : 0];
}

export function arrowWord(rot) {
  return ARROW_WORDS[rot >= 0 && rot <= 3 ? Math.floor(rot) : 0];
}

// The plain text of a part for a level and rotation (directional parts name the way in words).
export function partDescribe(part, level, rot) {
  if (!part || typeof part.describe !== 'function') return '';
  return part.describe(level, rot >= 0 ? rot : 0);
}

// "2 -> 5" from the part's own example(level), or '' when it has none (for example Bend).
export function exampleLine(part, level) {
  if (!part || typeof part.example !== 'function') return '';
  let ex = null;
  try {
    ex = part.example(level);
  } catch (err) {
    return '';
  }
  if (!ex || !isFinite(ex.before) || !isFinite(ex.after)) return '';
  return formatNumber(ex.before) + ' -> ' + formatNumber(ex.after);
}
