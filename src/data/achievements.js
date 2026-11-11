// The achievement list. Each part that is NOT in the starting 12 is unlocked by exactly one
// achievement, so the Patent Book can always say how to get it.
// summary shape (from runSummary): { won, shiftReached, shiftsCleared, voltage, inventorId, daily,
//   bestFire, totalBanked, partsOwned: [ids], coinsLeft, partLevels: [numbers] (optional) }
// Owner: AI-5
//
// New parts and inventors: an achievement whose reward names a part or inventor that is not in the
// game yet is left out of the list (see the end of the file), so the list can be written before
// AI-3 and AI-4 push, and switches on by itself. tests/meta-achievements.test.js fails loudly if a
// part or inventor in the real game has no achievement.
//
// Every threshold (shift numbers, fire sizes, run counts...) is in TARGETS below, and every
// dust reward is in the reward of its achievement. The descriptions are built from TARGETS,
// so the text and the check can never disagree.

import { allPartIds, partsWithTag } from '../engine/parts/index.js';
import { INVENTORS } from './inventors.js';

const TARGETS = {
  firstShift: 1,
  steadyShift: 3,
  halfwayShift: 4,
  deepShift: 6,
  bigFire: 1000,
  surgeFire: 100000,
  megaFire: 1000000,
  trioParts: 3,
  distinctParts: 8,
  coinsLeft: 20,
  regularRuns: 10,
  veteranRuns: 25,
  rollWins: 5,
  mainsVoltage: 2,
  highVoltage: 3,
  overloadVoltage: 4,
  allVoltages: 4,
  steerShift: 5,
  bankerShift: 6,
  gentleShift: 3,
  routeParts: 3,
  tenKFire: 10000,
  giantFire: 10000000,
  bigHoard: 10
};

function plain(n) {
  return n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(n);
}

// A Gentle-mode win never counts as a win (manager contract 24).
function realWin(summary) {
  return summary.won === true && summary.gentle !== true;
}

function wonWith(summary, inventorId) {
  return realWin(summary) && summary.inventorId === inventorId;
}

// How many different parts with this tag the run owned.
function distinctWithTag(summary, tag) {
  const tagged = partsWithTag(tag).map(function (p) { return p.id; });
  const owned = distinctParts(summary);
  let count = 0;
  for (let i = 0; i < owned.length; i++) {
    if (tagged.indexOf(owned[i]) !== -1) count++;
  }
  return count;
}

function wonWithEveryInventor(meta) {
  for (let i = 0; i < INVENTORS.length; i++) {
    const won = meta.wins[INVENTORS[i].id];
    if (!won || Object.keys(won).length === 0) return false;
  }
  return true;
}

function wonVoltage(meta, voltage) {
  for (const id in meta.wins) {
    if (meta.wins[id][String(voltage)] === true) return true;
  }
  return false;
}

function wonEveryVoltage(meta) {
  for (let v = 1; v <= TARGETS.allVoltages; v++) {
    if (!wonVoltage(meta, v)) return false;
  }
  return true;
}

function countLevels(summary, level) {
  const levels = Array.isArray(summary.partLevels) ? summary.partLevels : [];
  let count = 0;
  for (let i = 0; i < levels.length; i++) {
    if (levels[i] >= level) count++;
  }
  return count;
}

function distinctParts(summary) {
  const list = Array.isArray(summary.partsOwned) ? summary.partsOwned : [];
  const seen = [];
  for (let i = 0; i < list.length; i++) {
    if (seen.indexOf(list[i]) === -1) seen.push(list[i]);
  }
  return seen;
}

// Every achievement, including ones whose reward is not in the game yet (tests use this).
export const ALL_ACHIEVEMENTS = [
  // Easy: your first steps
  { id: 'firstLight', name: 'First Light', description: 'Clear shift ' + TARGETS.firstShift + '.',
    check: (meta, s) => s.shiftsCleared >= TARGETS.firstShift, reward: { type: 'dust', amount: 5 } },
  { id: 'steadyHands', name: 'Steady Hands', description: 'Clear shift ' + TARGETS.steadyShift + '.',
    check: (meta, s) => s.shiftsCleared >= TARGETS.steadyShift, reward: { type: 'inventor', id: 'clockmaker' } },
  { id: 'halfway', name: 'Halfway There', description: 'Clear shift ' + TARGETS.halfwayShift + '.',
    check: (meta, s) => s.shiftsCleared >= TARGETS.halfwayShift, reward: { type: 'part', id: 'ember' } },
  { id: 'bigSpark', name: 'Big Spark', description: 'Bank ' + plain(TARGETS.bigFire) + ' in one Fire.',
    check: (meta, s) => s.bestFire >= TARGETS.bigFire, reward: { type: 'part', id: 'compounder' } },
  { id: 'firstWin', name: 'Shift Supervisor', description: 'Win a run.',
    check: (meta, s) => realWin(s), reward: { type: 'inventor', id: 'drvolt' } },
  { id: 'tinkerWin', name: 'Tinkerer', description: 'Win a run with Tinkerbot.',
    check: (meta, s) => wonWith(s, 'tinkerbot'), reward: { type: 'part', id: 'reverser' } },
  { id: 'clockWin', name: 'On the Dot', description: 'Win a run with the Clockmaker.',
    check: (meta, s) => wonWith(s, 'clockmaker'), reward: { type: 'part', id: 'fuse' } },
  { id: 'voltWin', name: 'Shocking Result', description: 'Win a run with Dr. Volt.',
    check: (meta, s) => wonWith(s, 'drvolt'), reward: { type: 'part', id: 'triplet' } },
  // Medium: build skill
  { id: 'sixthShift', name: 'Deep Shift', description: 'Reach shift ' + TARGETS.deepShift + '.',
    check: (meta, s) => s.shiftReached >= TARGETS.deepShift, reward: { type: 'dust', amount: 8 } },
  { id: 'trio', name: 'Triple Trouble', description: 'Have ' + TARGETS.trioParts + ' parts of level 2 at once.',
    check: (meta, s) => countLevels(s, 2) >= TARGETS.trioParts, reward: { type: 'dust', amount: 10 } },
  { id: 'levelThree', name: 'Fully Tuned', description: 'Level a part to 3.',
    check: (meta, s) => countLevels(s, 3) >= 1, reward: { type: 'part', id: 'turnstile' } },
  { id: 'collector', name: 'Parts Hoarder', description: 'Own ' + TARGETS.distinctParts + ' different parts at once.',
    check: (meta, s) => distinctParts(s).length >= TARGETS.distinctParts, reward: { type: 'dust', amount: 10 } },
  { id: 'splitFamily', name: 'Split Family', description: 'Own a Splitter and a Triplet at once.',
    check: (meta, s) => distinctParts(s).indexOf('splitter') !== -1 && distinctParts(s).indexOf('triplet') !== -1,
    reward: { type: 'dust', amount: 8 } },
  { id: 'frugal', name: 'Penny Pincher', description: 'Finish a run with ' + TARGETS.coinsLeft + ' coins left.',
    check: (meta, s) => s.coinsLeft >= TARGETS.coinsLeft, reward: { type: 'dust', amount: 8 } },
  { id: 'dailyDone', name: 'Clocked In', description: 'Finish the daily contract.',
    check: (meta, s) => !!s.daily, reward: { type: 'part', id: 'mint' } },
  { id: 'dailyWin', name: 'Daily Grind', description: 'Win the daily contract.',
    check: (meta, s) => !!s.daily && realWin(s), reward: { type: 'part', id: 'echo' } },
  // Long game: runs and wins over time
  { id: 'tenRuns', name: 'Regular', description: 'Finish ' + TARGETS.regularRuns + ' runs.',
    check: (meta) => meta.stats.runs >= TARGETS.regularRuns, reward: { type: 'dust', amount: 10 } },
  { id: 'twentyFiveRuns', name: 'Veteran', description: 'Finish ' + TARGETS.veteranRuns + ' runs.',
    check: (meta) => meta.stats.runs >= TARGETS.veteranRuns, reward: { type: 'dust', amount: 15 } },
  { id: 'fiveWins', name: 'On a Roll', description: 'Win ' + TARGETS.rollWins + ' runs.',
    check: (meta) => meta.stats.wins >= TARGETS.rollWins, reward: { type: 'dust', amount: 15 } },
  // Hard: higher voltage and huge fires
  { id: 'hundredK', name: 'Power Surge', description: 'Bank ' + plain(TARGETS.surgeFire) + ' in one Fire.',
    check: (meta, s) => s.bestFire >= TARGETS.surgeFire, reward: { type: 'part', id: 'flywheel' } },
  { id: 'million', name: 'Megawatt', description: 'Bank ' + plain(TARGETS.megaFire) + ' in one Fire.',
    check: (meta, s) => s.bestFire >= TARGETS.megaFire, reward: { type: 'dust', amount: 20 } },
  { id: 'mainsWin', name: 'Mains Master', description: 'Win at Voltage ' + TARGETS.mainsVoltage + '.',
    check: (meta, s) => realWin(s) && s.voltage >= TARGETS.mainsVoltage, reward: { type: 'part', id: 'rectifier' } },
  { id: 'highWin', name: 'High Voltage Hero', description: 'Win at Voltage ' + TARGETS.highVoltage + '.',
    check: (meta, s) => realWin(s) && s.voltage >= TARGETS.highVoltage, reward: { type: 'part', id: 'overdrive' } },
  { id: 'overloadWin', name: 'Overloaded', description: 'Win at Voltage ' + TARGETS.overloadVoltage + '.',
    check: (meta, s) => realWin(s) && s.voltage >= TARGETS.overloadVoltage, reward: { type: 'part', id: 'prism' } },
  { id: 'allInventors', name: 'Whole Crew', description: 'Win a run with every inventor.',
    check: (meta) => wonWithEveryInventor(meta),
    reward: { type: 'dust', amount: 25 } },
  { id: 'allVoltages', name: 'Fully Charged', description: 'Win at every voltage.',
    check: (meta) => wonEveryVoltage(meta),
    reward: { type: 'dust', amount: 30 } },
  // New in round 4: the two new inventors, Gentle mode, and rewards for the new parts
  { id: 'steerer', name: 'Steady Steering', description: 'Clear shift ' + TARGETS.steerShift + '.',
    check: (meta, s) => s.shiftsCleared >= TARGETS.steerShift, reward: { type: 'inventor', id: 'msbounce' } },
  { id: 'banker', name: 'Big Saver', description: 'Clear shift ' + TARGETS.bankerShift + '.',
    check: (meta, s) => s.shiftsCleared >= TARGETS.bankerShift, reward: { type: 'inventor', id: 'banker' } },
  { id: 'bounceWin', name: 'Bounce Back', description: 'Win a run with Ms. Bounce.',
    check: (meta, s) => wonWith(s, 'msbounce'), reward: { type: 'part', id: 'spring' } },
  { id: 'bankerWin', name: 'Paid in Full', description: 'Win a run with The Banker.',
    check: (meta, s) => wonWith(s, 'banker'), reward: { type: 'part', id: 'workbench' } },
  { id: 'gentleStart', name: 'Easy Does It', description: 'Clear shift ' + TARGETS.gentleShift + ' in Gentle mode.',
    check: (meta, s) => s.gentle === true && s.shiftsCleared >= TARGETS.gentleShift, reward: { type: 'part', id: 'starter' } },
  { id: 'routes', name: 'Road Builder', description: 'Own ' + TARGETS.routeParts + ' different steering parts at once.',
    check: (meta, s) => distinctWithTag(s, 'route') >= TARGETS.routeParts, reward: { type: 'part', id: 'sideamp' } },
  { id: 'tenK', name: 'Ten Thousand', description: 'Bank ' + plain(TARGETS.tenKFire) + ' in one Fire.',
    check: (meta, s) => s.bestFire >= TARGETS.tenKFire, reward: { type: 'part', id: 'bouncer' } },
  { id: 'spendAll', name: 'Spent It All', description: 'Win a run with 0 coins left.',
    check: (meta, s) => realWin(s) && s.coinsLeft === 0, reward: { type: 'part', id: 'finisher' } },
  { id: 'giant', name: 'Giant Spark', description: 'Bank ' + plain(TARGETS.giantFire) + ' in one Fire.',
    check: (meta, s) => s.bestFire >= TARGETS.giantFire, reward: { type: 'part', id: 'jackpot' } },
  { id: 'bigHoard', name: 'Packed Bench', description: 'Own ' + TARGETS.bigHoard + ' different parts at once.',
    check: (meta, s) => distinctParts(s).length >= TARGETS.bigHoard, reward: { type: 'part', id: 'portal' } }
];

// Keep an achievement only when its reward exists in the game right now.
function rewardExists(achievement) {
  const r = achievement.reward;
  if (!r) return true;
  if (r.type === 'part') return allPartIds().indexOf(r.id) !== -1;
  if (r.type === 'inventor') {
    for (let i = 0; i < INVENTORS.length; i++) {
      if (INVENTORS[i].id === r.id) return true;
    }
    return false;
  }
  return true;
}

export const ACHIEVEMENTS = ALL_ACHIEVEMENTS.filter(rewardExists);
