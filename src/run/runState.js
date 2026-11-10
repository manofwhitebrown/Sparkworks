// STUB: owned by AI-4. The owner will replace this whole file.
export function newRun(options) {
  return {
    v: 1, seed: 1, inventorId: 'tinkerbot', voltage: 1, daily: false,
    shift: 1, phase: 'build', coins: 0, rerollsThisShift: 0, firesLeft: 2, shiftTotal: 0,
    machine: { cols: 5, rows: 4, sourceRow: 1, sparkCount: 3, startValue: 1, cells: [], blocked: [], banned: [], flags: {}, seed: 1 },
    bench: [], offers: [], poolIds: [], lastFire: null, history: [], rngState: 1,
  };
}
export function getTarget(run) { return 10; }
export function placeFromBench(run, benchIndex, x, y, rot) { return run; }
export function moveOnBoard(run, fromX, fromY, toX, toY) { return run; }
export function rotatePart(run, x, y) { return run; }
export function returnToBench(run, x, y) { return run; }
export function fire(run) { return { events: [], total: 0, coins: 0 }; }
export function startNextShift(run) { return run; }
export function runSummary(run) { return { shift: 1, won: false, history: [] }; }
