// Per-part balance numbers. Example: node tools/partStats.js --runs 500 --smart
// Flags parts that are never bought, always bought, too strong (lift > +25%), too weak (lift < -10%) or dead.
// Owner: AI-8

import { realApi, readArgs } from './lib/realApi.js';
import { playMany, settingsFromArgs } from './simulate.js';

function add(map, id, amount) {
  map[id] = (map[id] || 0) + amount;
}

export function collectPartStats(results, partIds) {
  const rows = {};
  for (let i = 0; i < partIds.length; i++) {
    rows[partIds[i]] = { offered: 0, bought: 0, ownedWin: 0, ownedLoss: 0, ownedRuns: 0, ownedWins: 0,
      onBoard: 0, dead: 0 };
  }
  let wins = 0;
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.won) {
      wins = wins + 1;
    }
    const seen = {};
    for (let j = 0; j < r.owned.length; j++) {
      seen[r.owned[j]] = true;
    }
    const ids = Object.keys(seen);
    for (let j = 0; j < ids.length; j++) {
      if (!rows[ids[j]]) {
        continue;
      }
      rows[ids[j]].ownedRuns = rows[ids[j]].ownedRuns + 1;
      if (r.won) {
        rows[ids[j]].ownedWins = rows[ids[j]].ownedWins + 1;
      }
    }
    mergeCounts(rows, r.stats.offered, 'offered');
    mergeCounts(rows, r.stats.bought, 'bought');
    mergeCounts(rows, r.stats.onBoard, 'onBoard');
    mergeCounts(rows, r.stats.dead, 'dead');
  }
  return { rows: rows, wins: wins, total: results.length };
}

function mergeCounts(rows, counts, field) {
  const ids = Object.keys(counts);
  for (let i = 0; i < ids.length; i++) {
    if (rows[ids[i]]) {
      rows[ids[i]][field] = rows[ids[i]][field] + counts[ids[i]];
    }
  }
}

// Win rate when the part is owned at the end minus the win rate of all runs.
export function flagsFor(row, overallWinRate) {
  const flags = [];
  const lift = row.ownedRuns ? row.ownedWins / row.ownedRuns - overallWinRate : 0;
  if (row.bought === 0) {
    flags.push('NEVER BOUGHT');
  }
  if (row.offered > 0 && row.bought / row.offered > 0.9) {
    flags.push('ALWAYS BOUGHT');
  }
  if (row.ownedRuns >= 10 && lift > 0.25) {
    flags.push('TOO STRONG?');
  }
  if (row.ownedRuns >= 10 && lift < -0.1) {
    flags.push('TOO WEAK?');
  }
  if (row.onBoard >= 10 && row.dead === row.onBoard) {
    flags.push('DEAD PART');
  }
  return { flags: flags, lift: lift };
}

function main() {
  const settings = settingsFromArgs(readArgs(process.argv));
  const api = realApi();
  const partIds = api.allPartIds();
  const results = playMany(settings, api);
  const data = collectPartStats(results, partIds);
  const overall = data.total ? data.wins / data.total : 0;
  console.log('Runs: ' + data.total + '  overall win rate: ' + (overall * 100).toFixed(1) + '%');
  console.log('part'.padEnd(14) + 'offered bought  owned(runs) lift     dead/board  flags');
  for (let i = 0; i < partIds.length; i++) {
    const row = data.rows[partIds[i]];
    const info = flagsFor(row, overall);
    console.log(partIds[i].padEnd(14) + String(row.offered).padEnd(8) + String(row.bought).padEnd(8) +
      String(row.ownedRuns).padEnd(12) + (info.lift * 100).toFixed(1).padStart(6) + '%  ' +
      (row.dead + '/' + row.onBoard).padEnd(11) + info.flags.join(', '));
  }
}

if (process.argv[1] && process.argv[1].endsWith('partStats.js')) {
  main();
}
