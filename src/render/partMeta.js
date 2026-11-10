// Looks up how a part should be drawn (rarity, tag, directional).
// Uses the engine's getPart when it knows the part, else small safe defaults.
// Owner: AI-6
import { getPart } from '../engine/parts/index.js';

var FALLBACK_TAG = {
  coil: 'add', dynamo: 'add', ember: 'add', amplifier: 'mult', compounder: 'mult', overdrive: 'mult',
  bend: 'route', switch: 'route', reverser: 'route', splitter: 'split', triplet: 'split',
  capacitor: 'state', counter: 'state', anvil: 'boost', flywheel: 'state', battery: 'boost',
  gambler: 'risk', fuse: 'risk', rectifier: 'route', tollgate: 'economy'
};
var FALLBACK_DIRECTIONAL = { bend: true, switch: true, reverser: true, splitter: true, triplet: true,
  rectifier: true, amplifier: true };
var FALLBACK_RARITY = { overdrive: 'rare', triplet: 'rare', flywheel: 'rare', anvil: 'rare',
  gambler: 'legendary', compounder: 'rare' };

export function partMeta(partId, lookup) {
  var find = lookup || getPart;
  var part = null;
  try {
    part = find(partId);
  } catch (e) {
    part = null;
  }
  var tag = FALLBACK_TAG[partId] || 'add';
  var rarity = FALLBACK_RARITY[partId] || 'common';
  var directional = !!FALLBACK_DIRECTIONAL[partId];
  if (part) {
    if (part.tags && part.tags.length > 0) { tag = part.tags[0]; }
    if (part.rarity) { rarity = part.rarity; }
    directional = !!part.directional;
  }
  return { tag: tag, rarity: rarity, directional: directional };
}
