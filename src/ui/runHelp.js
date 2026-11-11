// Small helpers for the run screen's teaching tools: the path preview, the Hint button and
// the recap line. No DOM here, so node:test can check them.
// Owner: AI-7

import { simulate as realSimulate } from '../engine/simulate.js';
import { getPart as realGetPart } from '../engine/parts/index.js';
import { sourcePathCells, arrowWord } from './teach.js';

export const HINTS_PER_SHIFT = 3;

// "Hint 3" on the button, "Hint 0" when they are used up.
export function hintLabel(left) {
  return 'Hint ' + (left > 0 ? left : 0);
}

// "Path: on" / "Path: off" for the toggle button.
export function pathLabel(on) {
  return on ? 'Path: on' : 'Path: off';
}

// A short key for the board layout, so the path is only recomputed when something changed.
export function machineKey(machine) {
  let key = '';
  const cells = machine && machine.cells ? machine.cells : [];
  for (let i = 0; i < cells.length; i++) {
    const c = cells[i];
    key += c.x + ',' + c.y + ',' + c.partId + ',' + c.level + ',' + c.rot + ';';
  }
  const blocked = machine && machine.blocked ? machine.blocked : [];
  for (let i = 0; i < blocked.length; i++) key += 'b' + blocked[i].x + ',' + blocked[i].y + ';';
  const banned = machine && machine.banned ? machine.banned : [];
  return key + 'x' + banned.join(',');
}

// The cells the source sparks will enter, for view.setPreview. One simulate call.
// deps (for tests): { simulate }.
export function previewCells(machine, deps) {
  const simulate = deps && deps.simulate ? deps.simulate : realSimulate;
  const result = simulate(machine, { recordEvents: true });
  if (!result || !result.events) return [];
  return sourcePathCells(result.events);
}

// The Hint text: which part, which cell, and the arrow way for parts that point somewhere.
// Returns '' when there is no suggestion. deps (for tests): { getPart }.
export function hintText(run, suggestion, deps) {
  if (!run || !suggestion) return '';
  const lookup = deps && deps.getPart ? deps.getPart : realGetPart;
  const item = run.bench[suggestion.partIndex];
  if (!item) return '';
  const part = lookup(item.partId);
  const name = part ? part.name : item.partId;
  let text = 'Hint: try ' + name + ' in the glowing cell.';
  if (part && part.directional) text += ' Point it ' + arrowWord(suggestion.rot) + '.';
  return text;
}

// Whether the shift changed, so the hints come back (3 per shift).
export function hintsLeftFor(used) {
  const left = HINTS_PER_SHIFT - (used > 0 ? used : 0);
  return left > 0 ? left : 0;
}
