// Voltage progress: winning at voltage V with an inventor opens V + 1 for that inventor.
// Owner: AI-5
import { VOLTAGES } from '../data/voltage.js';

function voltageCount(deps) {
  const list = deps && deps.voltages ? deps.voltages : VOLTAGES;
  return list && list.length > 0 ? list.length : 4;
}

export function maxVoltageFor(meta, inventorId, deps) {
  const wins = meta.wins && meta.wins[inventorId] ? meta.wins[inventorId] : {};
  let best = 0;
  for (const key in wins) {
    const v = Number(key);
    if (wins[key] === true && v > best) best = v;
  }
  const open = best + 1;
  const top = voltageCount(deps);
  return open > top ? top : open;
}

export function recordWin(meta, inventorId, voltage) {
  if (!meta.wins[inventorId]) meta.wins[inventorId] = {};
  meta.wins[inventorId][String(voltage)] = true;
}
