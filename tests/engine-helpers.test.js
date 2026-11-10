// Fake parts and small helpers shared by the engine tests.
// The real parts belong to AI-3 and may not exist yet, so the engine tests use these.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { makeMachine, placePart } from '../src/engine/board.js';

// Adds a flat number, scaled by ctx.boost.
export function makeAdder(n) {
  return {
    id: 'adder',
    onPass(ctx) {
      ctx.setValue(ctx.value + n * ctx.boost, '+' + n);
    }
  };
}

// Multiplies the value; the boost makes the multiplier stronger.
export function makeMultiplier(m) {
  return {
    id: 'multiplier',
    onPass(ctx) {
      ctx.setValue(ctx.value * (1 + (m - 1) * ctx.boost), 'x' + m);
    }
  };
}

export const turner = {
  id: 'turner',
  onPass(ctx) {
    ctx.turnToFacing();
  }
};

export function makeSplitter(dir, extra) {
  return {
    id: 'splitter',
    onPass(ctx) {
      ctx.split(dir, ctx.value + extra, 'split');
    }
  };
}

export const disabler = {
  id: 'disabler',
  onPass(ctx) {
    ctx.setValue(ctx.value + 1, '+1');
    ctx.disable();
  }
};

export const thrower = {
  id: 'thrower',
  onPass() {
    throw new Error('this fake part always breaks');
  }
};

export const booster = {
  id: 'booster',
  boostFor() {
    return 1.5;
  },
  onPass() {}
};

export const counter = {
  id: 'counter',
  onPass(ctx) {
    ctx.state.n = (ctx.state.n || 0) + 1;
    ctx.setValue(ctx.value + ctx.state.n, 'n');
  }
};

export const badNumbers = {
  id: 'badNumbers',
  onPass(ctx) {
    ctx.setValue(NaN, 'nan');
    ctx.setValue(Infinity, 'inf');
    ctx.setValue(-Infinity, 'ninf');
    ctx.setValue(undefined, 'undef');
    ctx.setValue('abc', 'text');
    ctx.setValue(ctx.value + 1, '+1');
  }
};

export const gambler = {
  id: 'gambler',
  onPass(ctx) {
    ctx.setValue(ctx.rng() * 100, 'rng');
  }
};

// Builds a getPart function from a plain object { partId: definition }.
export function makeGetPart(defs) {
  return function (partId) {
    return defs[partId] || null;
  };
}

// A default 5x4 machine with the given parts: list of [x, y, partId, rot].
export function machineWith(list, overrides) {
  const machine = makeMachine(overrides || { seed: 7 });
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    placePart(machine, p[0], p[1], p[2], 1, p[3] || 0);
  }
  return machine;
}

test('helpers: fake parts are plain objects', () => {
  assert.strictEqual(typeof makeAdder(1).onPass, 'function');
  assert.strictEqual(booster.boostFor(1), 1.5);
});
