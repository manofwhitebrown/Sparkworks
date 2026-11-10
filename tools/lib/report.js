// Turns a list of run results into the numbers and the text report.
// Owner: AI-8

const SHIFTS = 8;

function percent(part, whole) {
  if (whole === 0) {
    return '-';
  }
  return (100 * part / whole).toFixed(1) + '%';
}

export function summarize(results) {
  const total = results.length;
  let wins = 0;
  let shiftSum = 0;
  let bestFireSum = 0;
  const reached = [];
  const passed = [];
  const coinSum = [];
  const coinCount = [];
  const ends = [];
  const byInventor = {};
  for (let s = 0; s <= SHIFTS; s++) {
    reached.push(0);
    passed.push(0);
    coinSum.push(0);
    coinCount.push(0);
    ends.push(0);
  }
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.won) {
      wins = wins + 1;
    }
    shiftSum = shiftSum + r.endShift;
    bestFireSum = bestFireSum + r.bestFire;
    const last = Math.min(r.endShift, SHIFTS);
    ends[last] = ends[last] + 1;
    for (let s = 1; s <= last; s++) {
      reached[s] = reached[s] + 1;
      if (s < r.endShift || r.won) {
        passed[s] = passed[s] + 1;
      }
    }
    for (let s = 0; s < r.coinsAtShop.length && s < SHIFTS; s++) {
      coinSum[s + 1] = coinSum[s + 1] + r.coinsAtShop[s];
      coinCount[s + 1] = coinCount[s + 1] + 1;
    }
    if (!byInventor[r.inventorId]) {
      byInventor[r.inventorId] = { runs: 0, wins: 0 };
    }
    byInventor[r.inventorId].runs = byInventor[r.inventorId].runs + 1;
    if (r.won) {
      byInventor[r.inventorId].wins = byInventor[r.inventorId].wins + 1;
    }
  }
  return {
    total: total, wins: wins, winRate: total ? wins / total : 0,
    avgShift: total ? shiftSum / total : 0,
    avgBestFire: total ? bestFireSum / total : 0,
    reached: reached, passed: passed, coinSum: coinSum, coinCount: coinCount,
    ends: ends, byInventor: byInventor
  };
}

export function verdict(summary, smart, voltage) {
  if (!smart || voltage !== 1) {
    return 'VERDICT: n/a (the verdict only applies at voltage 1 with --smart)';
  }
  if (summary.winRate > 0.7) {
    return 'VERDICT: TOO EASY';
  }
  if (summary.winRate < 0.15) {
    return 'VERDICT: TOO HARD';
  }
  return 'VERDICT: OK';
}

export function formatReport(summary, smart, voltage) {
  const lines = [];
  lines.push('Runs: ' + summary.total + '   Win rate: ' + percent(summary.wins, summary.total));
  lines.push('Average shift reached: ' + summary.avgShift.toFixed(2));
  lines.push('Average best Fire: ' + summary.avgBestFire.toFixed(1));
  lines.push('');
  lines.push('Shift  reached  pass rate  avg coins (at shop)  runs ending here');
  for (let s = 1; s <= SHIFTS; s++) {
    const coins = summary.coinCount[s] ? (summary.coinSum[s] / summary.coinCount[s]).toFixed(1) : '-';
    lines.push(String(s).padEnd(7) + String(summary.reached[s]).padEnd(9) +
      percent(summary.passed[s], summary.reached[s]).padEnd(11) + String(coins).padEnd(21) + summary.ends[s]);
  }
  lines.push('');
  lines.push('Win rate per inventor:');
  const names = Object.keys(summary.byInventor);
  for (let i = 0; i < names.length; i++) {
    const item = summary.byInventor[names[i]];
    lines.push('  ' + names[i].padEnd(12) + percent(item.wins, item.runs) + ' (' + item.wins + '/' + item.runs + ')');
  }
  lines.push('');
  lines.push(verdict(summary, smart, voltage));
  return lines.join('\n');
}
