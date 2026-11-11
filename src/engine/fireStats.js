// fireStats(events): a few plain numbers about one Fire, so the renderer and the
// audio can scale their effects ("how big was this Fire?"). It reads the event
// list only, changes nothing, makes no NaN and no Infinity.
// Owner: AI-2

// Events that CHANGE a spark; a long run of them on one spark is a "chain".
function isChainEvent(type) {
  return type === 'value' || type === 'turn' || type === 'split' ||
    type === 'bonus' || type === 'portal';
}

// A value event is a "multiplier" unless its label says it added or took away
// ('+3', '-1'): adding 3 to a 1 is not a x4. A bonus tile counts only when it is 'mult'.
function isMultiplyEvent(e) {
  if (e.type === 'bonus') {
    return e.kind === 'mult';
  }
  if (e.type !== 'value') {
    return false;
  }
  if (typeof e.label === 'string' && (e.label.charAt(0) === '+' || e.label.charAt(0) === '-')) {
    return false;
  }
  return true;
}

function goodNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

function clamp01(v) {
  if (!(v > 0)) {
    return 0;
  }
  return v > 1 ? 1 : v;
}

// 0..1 from the five facts. Logs keep huge numbers readable:
// bank 1e6 or more, a x64 jump, a 12-step chain or 10 splits each fill one share.
function intensityOf(biggestBank, biggestMultiplier, chainLength, splitCount) {
  const bankScore = clamp01(Math.log10(biggestBank + 1) / 6);
  const multScore = clamp01(Math.log2(biggestMultiplier) / 6);
  const chainScore = clamp01(chainLength / 12);
  const splitScore = clamp01(splitCount / 10);
  return clamp01(0.4 * bankScore + 0.25 * multScore + 0.2 * chainScore + 0.15 * splitScore);
}

// Returns { chainLength, biggestMultiplier, biggestBank, bankedCount, lostCount,
//           splitCount, intensity }
// - chainLength: most changes (value, turn, split, bonus, portal events) any ONE spark had.
// - biggestMultiplier: largest after / before of a value event (not one labelled '+n' or '-n')
//   or of a 'mult' bonus tile (1 when none).
// - biggestBank: largest single banked value (0 when nothing banked).
// - bankedCount / lostCount: bank and fizzle events. splitCount: split events.
// - intensity: 0..1 overall size of the Fire.
export function fireStats(events) {
  const log = Array.isArray(events) ? events : [];
  const perSpark = [];
  let chainLength = 0;
  let biggestMultiplier = 1;
  let biggestBank = 0;
  let bankedCount = 0;
  let lostCount = 0;
  let splitCount = 0;
  for (let i = 0; i < log.length; i++) {
    const e = log[i];
    if (!e || typeof e.type !== 'string') {
      continue;
    }
    const type = e.type;
    if (type === 'bank') {
      bankedCount++;
      if (goodNumber(e.value) && e.value > biggestBank) {
        biggestBank = e.value;
      }
    } else if (type === 'fizzle') {
      lostCount++;
    } else if (type === 'split') {
      splitCount++;
    }
    if (isChainEvent(type) && Number.isInteger(e.spark)) {
      const count = (perSpark[e.spark] || 0) + 1;
      perSpark[e.spark] = count;
      if (count > chainLength) {
        chainLength = count;
      }
    }
    if (isMultiplyEvent(e) && goodNumber(e.before) && goodNumber(e.after) && e.before > 0) {
      const ratio = e.after / e.before;
      if (goodNumber(ratio) && ratio > biggestMultiplier) {
        biggestMultiplier = ratio;
      }
    }
  }
  return {
    chainLength: chainLength,
    biggestMultiplier: biggestMultiplier,
    biggestBank: biggestBank,
    bankedCount: bankedCount,
    lostCount: lostCount,
    splitCount: splitCount,
    intensity: intensityOf(biggestBank, biggestMultiplier, chainLength, splitCount)
  };
}
