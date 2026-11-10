// A tiny fake ctx that records what a part did, so parts can be tested without the engine.
// Owner: AI-3
const MAX_VALUE = 1e300;
const ROT_DIRS = ['right', 'down', 'left', 'up'];

// options: { value, dir, level, rot, boost, state, fire, rngValues }
// Pass the same `state` object to several makeFakeCtx calls to simulate several sparks.
export function makeFakeCtx(options) {
  const opts = options || {};
  const rngValues = opts.rngValues || [0.5];
  let rngIndex = 0;
  const ctx = {
    value: opts.value === undefined ? 1 : opts.value,
    dir: opts.dir || 'right',
    level: opts.level || 1,
    rot: opts.rot || 0,
    boost: opts.boost || 1,
    state: opts.state || {},
    fire: opts.fire || { sparkNumber: 1, bankedTotal: 0, bankedCount: 0, partsOnBoard: 1 },
    calls: { setValue: [], setDir: [], split: [], addCoins: [], disable: 0, note: [] },
    rng() {
      const v = rngValues[rngIndex % rngValues.length];
      rngIndex++;
      return v;
    },
    setValue(v, label) {
      if (typeof v !== 'number' || Number.isNaN(v)) {
        return;
      }
      ctx.value = Math.min(Math.max(v, 0), MAX_VALUE);
      ctx.calls.setValue.push({ value: ctx.value, label: label });
    },
    setDir(dir) {
      ctx.dir = dir;
      ctx.calls.setDir.push(dir);
    },
    turnToFacing() {
      ctx.setDir(ROT_DIRS[ctx.rot]);
    },
    split(dir, value, label) {
      ctx.calls.split.push({ dir: dir, value: value, label: label });
    },
    addCoins(n) {
      ctx.calls.addCoins.push(n);
    },
    disable() {
      ctx.calls.disable++;
    },
    note(label) {
      ctx.calls.note.push(label);
    }
  };
  return ctx;
}

// Run one part once with the given options and return the ctx.
export function runPart(part, options) {
  const ctx = makeFakeCtx(options);
  part.onPass(ctx);
  return ctx;
}
