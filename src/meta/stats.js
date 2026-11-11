// Called once when a run ends: updates stats, awards Spark Dust, checks achievements.
// Owner: AI-5
import { runSummary } from '../run/runState.js';
import { checkAchievements } from './achievements.js';
import { recordWin } from './voltage.js';
import { upgradeLevel } from './workshop.js';
import { DUST_RULES } from '../data/workshop.js';
import { recordDaily } from './daily.js';

// The numbers come from DUST_RULES in data/workshop.js (see the formula there).
// Whole numbers only, so there is no floating point rounding surprise.
export function dustFor(meta, summary) {
  const r = DUST_RULES;
  const base = r.base + r.perShiftCleared * summary.shiftsCleared + (summary.won ? r.winBonus : 0) +
    r.perVoltage * (summary.voltage - 1);
  const boost = upgradeLevel(meta, 'dustBoost');
  return Math.floor(base * (100 + r.boostPercentPerLevel * boost) / 100);
}

function updateStats(meta, run, summary) {
  const stats = meta.stats;
  stats.runs += 1;
  if (summary.won) stats.wins += 1;
  if (summary.totalBanked > stats.bestTotal) stats.bestTotal = summary.totalBanked;
  stats.fires += typeof run.firesUsed === 'number' ? run.firesUsed : (Array.isArray(run.history) ? run.history.length : 0);
  stats.partsBought += typeof run.partsBought === 'number' ? run.partsBought : 0;
}

function unlocksFrom(newAchievements) {
  const out = [];
  for (let i = 0; i < newAchievements.length; i++) {
    const r = newAchievements[i].reward;
    if (r && (r.type === 'part' || r.type === 'inventor')) out.push(r);
  }
  return out;
}

// run: a FINISHED run (phase 'won' or 'lost'). A run counts only once: it gets run.recorded = true.
export function recordRunEnd(meta, run, deps) {
  const empty = { dustEarned: 0, newAchievements: [], newUnlocks: [] };
  if (!run || run.recorded === true) return empty;
  // Contract item 16: a cheated run earns NOTHING (no dust, stats, wins, achievements or daily result).
  if (run.cheated === true) return empty;
  if (run.phase !== 'won' && run.phase !== 'lost') return empty;
  const getSummary = deps && deps.runSummary ? deps.runSummary : runSummary;
  const summary = normalizeForStats(getSummary(run), run);
  run.recorded = true;
  updateStats(meta, run, summary);
  if (summary.won) recordWin(meta, summary.inventorId, summary.voltage);
  // A daily run keeps its date string in summary.daily: record the result of the day here.
  if (typeof summary.daily === 'string' && summary.daily !== '') {
    recordDaily(meta, summary.daily, { won: summary.won, shiftReached: summary.shiftReached, bestFire: summary.bestFire || 0 });
  }
  const dustEarned = dustFor(meta, summary);
  meta.dust += dustEarned;
  const newAchievements = checkAchievements(meta, summary, deps);
  return { dustEarned: dustEarned, newAchievements: newAchievements, newUnlocks: unlocksFrom(newAchievements) };
}

// The summary may miss fields while AI-4 is still building: fall back to the run itself.
function normalizeForStats(summary, run) {
  const s = summary && typeof summary === 'object' ? Object.assign({}, summary) : {};
  if (typeof s.won !== 'boolean') s.won = run.phase === 'won';
  if (typeof s.voltage !== 'number') s.voltage = typeof run.voltage === 'number' ? run.voltage : 1;
  if (typeof s.inventorId !== 'string') s.inventorId = run.inventorId || '';
  if (typeof s.shiftsCleared !== 'number') s.shiftsCleared = s.won ? 8 : Math.max(0, (run.shift || 1) - 1);
  if (typeof s.shiftReached !== 'number') s.shiftReached = run.shift || 1;
  if (typeof s.totalBanked !== 'number') s.totalBanked = 0;
  if (typeof s.bestFire !== 'number') s.bestFire = 0;
  if (!Array.isArray(s.partLevels)) s.partLevels = levelsOf(run);
  if (!s.daily) s.daily = run.daily ? run.daily : false;
  return s;
}

// Level of every part the run owns (board and bench), so level achievements work without AI-4.
function levelsOf(run) {
  const levels = [];
  const cells = run.machine && Array.isArray(run.machine.cells) ? run.machine.cells : [];
  const bench = Array.isArray(run.bench) ? run.bench : [];
  for (let i = 0; i < cells.length; i++) levels.push(cells[i].level || 1);
  for (let i = 0; i < bench.length; i++) levels.push(bench[i].level || 1);
  return levels;
}
