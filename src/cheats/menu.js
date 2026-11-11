// The cheat menu: a full-screen overlay with RUN / SHOP / META / DEBUG tabs. It is only loaded
// after the right password (see gate.js). Everything the tabs change goes through cheatEnv.js.
// Owner: AI-2

import { on, emit } from '../core/events.js';
import { saveRun } from '../core/save.js';
import {
  getMeta, saveCurrentMeta, getCurrentRun, setCurrentRun, applySettingsFromMeta
} from '../ui/ui.js';
import { makeEnv } from './cheatEnv.js';
import { takeSnapshot } from './metaCheats.js';
import { makeFireRecorder } from './debugTools.js';
import { injectStyles } from './menuStyles.js';
import { el, button } from './menuUi.js';
import { buildRunTab } from './tabRun.js';
import { buildShopTab } from './tabShop.js';
import { buildMetaTab } from './tabMeta.js';
import { buildDebugTab } from './tabDebug.js';

const TABS = ['RUN', 'SHOP', 'META', 'DEBUG'];
const TOAST_MS = 3500;

// State that lives as long as the page: the meta snapshot and the Fire recorder.
const state = {
  snapshot: null,
  speed: 1,
  recorder: makeFireRecorder({ on: on, getRun: getCurrentRun })
};

let isOpen = false;

function makeToast(box) {
  let timer = 0;
  return function (text) {
    box.textContent = text;
    clearTimeout(timer);
    timer = setTimeout(function () {
      box.textContent = '';
    }, TOAST_MS);
  };
}

function makeLiveEnv(toast) {
  return makeEnv({
    getRun: getCurrentRun,
    getMeta: getMeta,
    setRun: setCurrentRun,
    saveRun: saveRun,
    saveMeta: saveCurrentMeta,
    emit: emit,
    toast: toast,
    applySettings: function () {
      if (getMeta()) {
        applySettingsFromMeta();
      }
    }
  });
}

function buildTab(name, env) {
  if (name === 'RUN') {
    return buildRunTab(env);
  }
  if (name === 'SHOP') {
    return buildShopTab(env);
  }
  if (name === 'META') {
    return buildMetaTab(env, state);
  }
  return buildDebugTab(env, state);
}

function buildPanel(env, toastBox, close) {
  const panel = el('div', 'ckx');
  const head = el('div', 'ckx-head');
  head.appendChild(el('div', 'ckx-warn', 'CHEATS: runs that use cheats earn no rewards'));
  head.appendChild(button('Close', function () { close(false); }));
  const tabs = el('div', 'ckx-tabs');
  tabs.setAttribute('role', 'tablist');
  const body = el('div', 'ckx-body');
  const built = {};
  const tabButtons = [];

  function select(name) {
    if (!built[name]) {
      built[name] = buildTab(name, env);
    }
    body.innerHTML = '';
    body.appendChild(built[name]);
    for (let i = 0; i < tabButtons.length; i++) {
      tabButtons[i].setAttribute('aria-selected', TABS[i] === name ? 'true' : 'false');
    }
  }
  for (let i = 0; i < TABS.length; i++) {
    const tab = el('button', 'ckx-tab', TABS[i]);
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.addEventListener('click', select.bind(null, TABS[i]));
    tabButtons.push(tab);
    tabs.appendChild(tab);
  }
  panel.append(head, tabs, body, toastBox);
  select('RUN');
  return panel;
}

// tools.openOverlay comes from gate.js (Esc and the Android Back button close it).
export function openMenu(tools) {
  if (isOpen) {
    return;
  }
  const meta = getMeta();
  if (state.snapshot === null && meta) {
    state.snapshot = takeSnapshot(meta);
  }
  injectStyles();
  isOpen = true;
  const toastBox = el('div', 'ckx-toast');
  const env = makeLiveEnv(makeToast(toastBox));
  const closeRef = { fn: null };
  const panel = buildPanel(env, toastBox, function (fromBack) {
    closeRef.fn(fromBack);
  });
  closeRef.fn = tools.openOverlay(panel, function () {
    isOpen = false;
  });
}
