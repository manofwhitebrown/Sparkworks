// Fake parts, fake simulate and fake twists for the run tests (so they never wait for other AIs).
// Owner: AI-4

const LIST = [
  { id: 'coil', rarity: 'common', tags: ['add'], maxLevel: 3, cost: 3 },
  { id: 'ember', rarity: 'common', tags: ['add'], maxLevel: 3, cost: 2 },
  { id: 'bend', rarity: 'common', tags: ['route'], maxLevel: 3, cost: 2 },
  { id: 'counter', rarity: 'common', tags: ['state'], maxLevel: 3, cost: 3 },
  { id: 'splitter', rarity: 'common', tags: ['split'], maxLevel: 3, cost: 4 },
  { id: 'amplifier', rarity: 'rare', tags: ['mult'], maxLevel: 3, cost: 5 },
  { id: 'anvil', rarity: 'rare', tags: ['state', 'mult'], maxLevel: 3, cost: 4 },
  { id: 'battery', rarity: 'rare', tags: ['boost'], maxLevel: 3, cost: 5 },
  { id: 'gambler', rarity: 'legendary', tags: ['risk'], maxLevel: 3, cost: 7 }
];

export const FAKE_POOL = LIST.map(function (p) { return p.id; });

export function fakeGetPart(id) {
  for (let i = 0; i < LIST.length; i++) {
    if (LIST[i].id === id) {
      return LIST[i];
    }
  }
  return null;
}

// A simulate that returns the given totals one after another (the last one repeats).
export function makeFakeSimulate(totals, coins) {
  const state = { calls: 0, machines: [] };
  const fn = function (machine) {
    state.machines.push(machine);
    const total = totals[Math.min(state.calls, totals.length - 1)];
    state.calls = state.calls + 1;
    return { events: [{ n: 0, type: 'end', total: total, coins: coins || 0 }], total: total, coins: coins || 0, banked: 1, fizzled: 0 };
  };
  fn.state = state;
  return fn;
}

// Fake twists: deadCell blocks (2, 1), twoDeadCells blocks (2, 1) and (3, 1), fewerSparks takes 1 spark.
export function fakeApplyTwists(machine, ids) {
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] === 'deadCell') {
      machine.blocked.push({ x: 2, y: 1 });
    }
    if (ids[i] === 'twoDeadCells') {
      machine.blocked.push({ x: 2, y: 1 });
      machine.blocked.push({ x: 3, y: 1 });
    }
    if (ids[i] === 'fewerSparks') {
      machine.sparkCount = machine.sparkCount - 1;
    }
  }
}

export function makeDeps(totals, coins) {
  return { simulate: makeFakeSimulate(totals || [100], coins), getPart: fakeGetPart, applyTwists: fakeApplyTwists };
}
