// The META tab: Spark Dust, unlocks, resets, and the safety net (undo, copy and paste the save).
// state.snapshot is the meta as it was when the menu first opened. Owner: AI-2

import * as mc from './metaCheats.js';
import { button, row, section, copyText, el } from './menuUi.js';

function dustSection(env) {
  const add = function (n) {
    return button('+' + n, function () { env.doMeta('dust', function (m) { return mc.addDust(m, n); }); });
  };
  return section('Spark Dust', [row([add(50), add(500), add(5000)])]);
}

function unlockSection(env) {
  const make = function (label, fn) {
    return button(label, function () { env.doMeta('unlock', fn); });
  };
  return section('Unlock', [
    row([make('All parts', mc.unlockAllParts), make('All inventors', mc.unlockAllInventors)]),
    row([make('Max voltage', mc.maxAllVoltages), make('All achievements', mc.completeAllAchievements)])
  ]);
}

function resetSection(env) {
  const make = function (label, fn) {
    return button(label, function () { env.doMeta('reset', fn); });
  };
  return section('Seen and resets', [row([
    make('Mark all parts seen', mc.markAllSeen),
    make('Reset tutorial', mc.resetTutorial),
    make('Allow daily again', mc.allowDailyAgain)
  ])]);
}

function undoSection(env, state) {
  const undo = button('Undo all meta cheats this session', function () {
    const meta = env.getMeta();
    const res = meta ? mc.restoreSnapshot(meta, state.snapshot) : { ok: false, msg: 'The game is not ready' };
    env.toast(res.msg);
    if (res.ok) {
      env.metaChanged('undo');
    }
  }, { go: true });
  return section('Safety net', [
    el('p', 'ckx-note', 'Undo goes back to how the meta was when this menu first opened.'),
    row([undo])
  ]);
}

function backupSection(env) {
  const area = el('textarea', 'ckx-area');
  area.setAttribute('aria-label', 'Save text');
  const copy = button('Copy save to clipboard', function () {
    const text = mc.exportSave(env.getMeta(), env.getRun());
    copyText(text, function (ok) {
      env.toast(ok ? 'Copied' : 'Copy failed: use the box below');
      if (!ok) {
        area.value = text;
      }
    });
  });
  const paste = button('Paste save to restore', function () {
    const meta = env.getMeta();
    const res = meta ? mc.importSave(area.value, meta) : { ok: false, msg: 'The game is not ready' };
    env.toast(res.msg);
    if (!res.ok) {
      return;
    }
    env.metaChanged('import');
    if (res.run) {
      env.replaceRun(res.run);
    }
  });
  return section('Backup (meta and current run)', [
    row([copy, paste]),
    el('p', 'ckx-note', 'Paste the text into the box, then press "Paste save to restore".'),
    area
  ]);
}

export function buildMetaTab(env, state) {
  const box = document.createElement('div');
  const parts = [dustSection(env), unlockSection(env), resetSection(env), undoSection(env, state), backupSection(env)];
  for (let i = 0; i < parts.length; i++) {
    box.appendChild(parts[i]);
  }
  return box;
}
