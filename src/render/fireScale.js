// Pure helper: reads an event list and says how big this Fire is, so the effects can scale.
// Uses only the events. When AI-2's engine `fireStats` helper lands, it can replace this file's math.
// Never returns NaN. Owner: AI-6

var EMPTY = { biggestBank: 0, bankCount: 0, intensity: 0, bigBankN: -1 };

function safe(n) {
  if (typeof n !== 'number' || n !== n) { return 0; }
  return n > 1e300 ? 1e300 : n;
}

// intensity is 0..1: grows with the order of magnitude of the biggest bank and with how many sparks banked.
export function fireScale(events) {
  if (!Array.isArray(events) || events.length === 0) { return EMPTY; }
  var biggest = 0;
  var bigN = -1;
  var count = 0;
  for (var i = 0; i < events.length; i++) {
    var e = events[i];
    if (e && e.type === 'bank') {
      var v = safe(e.value);
      count++;
      if (v >= biggest) { biggest = v; bigN = e.n; }
    }
  }
  var mag = biggest >= 1 ? Math.log10(biggest) : 0;
  var raw = mag / 8 * 0.8 + Math.min(count, 10) / 10 * 0.2;
  var intensity = raw < 0 ? 0 : (raw > 1 ? 1 : raw);
  return { biggestBank: biggest, bankCount: count, intensity: intensity, bigBankN: bigN };
}

// Should this bank get the short slow-down? Only the biggest bank of the Fire, and only when it is large.
export function isHeroBank(scale, event) {
  return !!event && event.n === scale.bigBankN && safe(event.value) >= 1000;
}

// Stronger shake for a hero bank, still capped by maxPx.
export function heroShake(basePx, maxPx) {
  var px = safe(basePx) * 1.4;
  return px > maxPx * 1.4 ? maxPx * 1.4 : px;
}
