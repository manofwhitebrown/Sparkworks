// The Parts Bin: lists every part by hand (no dynamic imports) and gives lookups.
// Owner: AI-3
import coil from './coil.js';
import dynamo from './dynamo.js';
import ember from './ember.js';
import amplifier from './amplifier.js';
import compounder from './compounder.js';
import overdrive from './overdrive.js';
import bend from './bend.js';
import switchPart from './switch.js';
import reverser from './reverser.js';
import splitter from './splitter.js';
import triplet from './triplet.js';
import capacitor from './capacitor.js';
import counter from './counter.js';
import anvil from './anvil.js';
import flywheel from './flywheel.js';
import battery from './battery.js';
import gambler from './gambler.js';
import fuse from './fuse.js';
import rectifier from './rectifier.js';
import tollgate from './tollgate.js';
import prism from './prism.js';
import turnstile from './turnstile.js';
import echo from './echo.js';
import mint from './mint.js';

// The fixed order of this list is the order of allPartIds().
const LIST = [
  coil, dynamo, ember, amplifier, compounder, overdrive,
  bend, switchPart, reverser, splitter, triplet,
  capacitor, counter, anvil, flywheel, battery,
  gambler, fuse, rectifier, tollgate,
  prism, turnstile, echo, mint
];

export const PARTS = {};
for (let i = 0; i < LIST.length; i++) {
  PARTS[LIST[i].id] = LIST[i];
}

export function getPart(id) {
  if (Object.prototype.hasOwnProperty.call(PARTS, id)) {
    return PARTS[id];
  }
  return null;
}

export function allPartIds() {
  const ids = [];
  for (let i = 0; i < LIST.length; i++) {
    ids.push(LIST[i].id);
  }
  return ids;
}

export function partsWithTag(tag) {
  const found = [];
  for (let i = 0; i < LIST.length; i++) {
    if (LIST[i].tags.indexOf(tag) >= 0) {
      found.push(LIST[i]);
    }
  }
  return found;
}
