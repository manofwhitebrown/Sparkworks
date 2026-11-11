// The glue between a cheat and the app. doRun / doMeta do the same four steps every time:
// get the live object (or say "Open a run first"), run the cheat, save, tell the screens.
// Everything the app provides comes in through `deps`, so tests can use fakes.
// Owner: AI-2

// deps: { getRun, getMeta, setRun, saveRun, saveMeta, emit, toast, applySettings }
export function makeEnv(deps) {
  function finish(what, res, save, options) {
    deps.toast(res.msg);
    if (!res.ok) {
      return res;
    }
    save();
    if (!(options && options.quiet)) {
      deps.emit('cheat:changed', { what: what });
    }
    return res;
  }

  return {
    // fn(run) returns { ok, msg, data? }. options.quiet = save but do not send cheat:changed
    // (for cheats that only read, like the Fire preview).
    doRun: function (what, fn, options) {
      const run = deps.getRun();
      if (!run) {
        deps.toast('Open a run first');
        return { ok: false, msg: 'Open a run first' };
      }
      const res = fn(run);
      return finish(what, res, function () {
        deps.saveRun(run);
      }, options);
    },

    // fn(meta) returns { ok, msg }.
    doMeta: function (what, fn) {
      const meta = deps.getMeta();
      if (!meta) {
        deps.toast('The game is not ready');
        return { ok: false, msg: 'The game is not ready' };
      }
      const res = fn(meta);
      return finish(what, res, function () {
        deps.saveMeta();
        if (deps.applySettings) {
          deps.applySettings();
        }
      });
    },

    // Put a whole new run in place (used when a pasted save contains a run).
    replaceRun: function (run) {
      if (deps.setRun) {
        deps.setRun(run);
      }
      deps.saveRun(run);
      deps.emit('cheat:changed', { what: 'import' });
    },

    // Save the meta and apply the settings after a change made outside doMeta.
    metaChanged: function (what) {
      deps.saveMeta();
      if (deps.applySettings) {
        deps.applySettings();
      }
      deps.emit('cheat:changed', { what: what });
    },

    getRun: deps.getRun,
    getMeta: deps.getMeta,
    toast: deps.toast,
    emit: deps.emit
  };
}
