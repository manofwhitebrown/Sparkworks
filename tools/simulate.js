// Balance bot. Example: node tools/simulate.js --runs 500 --voltage 1 --inventor tinkerbot --seed 1
// Options: --runs N, --voltage 1..4, --inventor id|all, --seed N, --smart, --layouts N
// Owner: AI-8

import { playRun } from './lib/bot.js';
import { realApi, readArgs } from './lib/realApi.js';
import { summarize, formatReport } from './lib/report.js';

const INVENTOR_IDS = ['tinkerbot', 'clockmaker', 'drvolt'];

// Plays `runs` runs and returns every result. Reused by partStats.js.
export function playMany(settings, api) {
  const results = [];
  for (let i = 0; i < settings.runs; i++) {
    const inventorId = settings.inventor === 'all'
      ? INVENTOR_IDS[i % INVENTOR_IDS.length]
      : settings.inventor;
    results.push(playRun({
      inventorId: inventorId,
      voltage: settings.voltage,
      seed: settings.seed + i,
      layouts: settings.layouts,
      smart: settings.smart
    }, api));
  }
  return results;
}

export function settingsFromArgs(args) {
  return {
    runs: Number(args.runs) || 200,
    voltage: Number(args.voltage) || 1,
    inventor: typeof args.inventor === 'string' ? args.inventor : 'all',
    seed: Number(args.seed) || 1,
    layouts: Number(args.layouts) || 60,
    smart: !!args.smart
  };
}

function main() {
  const settings = settingsFromArgs(readArgs(process.argv));
  console.log('Sparkworks balance bot: ' + JSON.stringify(settings));
  const results = playMany(settings, realApi());
  const unfinished = results.filter(function open(r) { return !r.finished; }).length;
  console.log(formatReport(summarize(results), settings.smart, settings.voltage));
  if (unfinished > 0) {
    console.log('\nWARNING: ' + unfinished + ' runs did not finish (the run modules may still be stubs).');
  }
}

// Only run the command line when this file is started directly.
if (process.argv[1] && process.argv[1].endsWith('simulate.js')) {
  main();
}
