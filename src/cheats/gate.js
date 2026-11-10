// The hidden gate of the cheat menu. There is no button: a quick run of taps in one corner
// opens a password prompt, and only the right password loads the real menu (menu.js).
// This file stays tiny and static. installCheats() only listens; it never blocks a tap.
// Owner: AI-2

import { sha256Hex } from './sha256.js';

// sha256 of ('sparkworks-cheat-v1:' + the password). The password itself is not in this repo.
const PASSWORD_PREFIX = 'sparkworks-cheat-v1:';
const PASSWORD_HASH = '79e462e3d89797fff918de7f096d3d8684aa723b3da8733aac721ef0e6144b48';

const TAP_COUNT = 7;
const TAP_WINDOW_MS = 3000;
const CORNER_SIZE = 80;
const MAX_WRONG = 3;
const LOCK_MS = 30000;

// ---------- pure logic (tested without a browser) ----------

export function isInCorner(x, y, size) {
  const limit = size === undefined ? CORNER_SIZE : size;
  return typeof x === 'number' && typeof y === 'number' && x >= 0 && y >= 0 && x < limit && y < limit;
}

// Counts quick taps in the corner. tap() returns true on the tap that completes the run.
// Taps outside the corner are ignored (they neither count nor reset). A sliding window
// means a slow 7th tap does not open it.
export function makeTapCounter(options) {
  const o = options || {};
  const need = o.count || TAP_COUNT;
  const windowMs = o.windowMs || TAP_WINDOW_MS;
  const size = o.size || CORNER_SIZE;
  let times = [];
  return {
    tap: function (x, y, nowMs) {
      if (!isInCorner(x, y, size)) {
        return false;
      }
      times.push(nowMs);
      times = times.filter(function (t) {
        return nowMs - t <= windowMs;
      });
      if (times.length >= need) {
        times = [];
        return true;
      }
      return false;
    },
    reset: function () {
      times = [];
    }
  };
}

// Three wrong tries lock the prompt for 30 seconds. Kept in memory only.
export function makeAttemptGuard(options) {
  const o = options || {};
  const maxWrong = o.maxWrong || MAX_WRONG;
  const lockMs = o.lockMs || LOCK_MS;
  let wrong = 0;
  let lockedUntil = 0;
  return {
    isLocked: function (nowMs) {
      return nowMs < lockedUntil;
    },
    secondsLeft: function (nowMs) {
      return nowMs < lockedUntil ? Math.ceil((lockedUntil - nowMs) / 1000) : 0;
    },
    fail: function (nowMs) {
      wrong++;
      if (wrong >= maxWrong) {
        wrong = 0;
        lockedUntil = nowMs + lockMs;
        return { locked: true };
      }
      return { locked: false };
    },
    success: function () {
      wrong = 0;
      lockedUntil = 0;
    }
  };
}

// True when sha256(prefix + typed) equals the expected hash. The hash and the hash function
// can be passed in so tests use a fake password.
export function checkPassword(typed, expectedHash, hashFn, prefix) {
  const hash = hashFn || sha256Hex;
  const pre = prefix === undefined ? PASSWORD_PREFIX : prefix;
  const wanted = expectedHash === undefined ? PASSWORD_HASH : expectedHash;
  return hash(pre + String(typed)) === wanted;
}

// ---------- the overlay helper (menu.js uses it too) ----------

let openCount = 0;
let ignoreNextPop = false;
let backClose = null;
let popInstalled = false;

// The Android Back button closes the top overlay. This listener is added at install time,
// before the app's own one, and stops the event so the app does not also go back a screen.
function onPop(e) {
  if (ignoreNextPop) {
    ignoreNextPop = false;
    e.stopImmediatePropagation();
    return;
  }
  if (backClose) {
    e.stopImmediatePropagation();
    const close = backClose;
    backClose = null;
    close(true);
  }
}

// Shows `node` as a full-screen layer. Returns close(). Esc and Back close it.
export function openOverlay(node, onClose) {
  const layer = document.createElement('div');
  layer.setAttribute('data-cheat-layer', '1');
  layer.style.cssText = 'position:fixed;inset:0;z-index:100000;display:flex;align-items:center;' +
    'justify-content:center;background:rgba(5,7,12,0.92);color:var(--text,#E8EDF5);' +
    'font-family:Inter,system-ui,sans-serif;padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)';
  layer.appendChild(node);
  document.body.appendChild(layer);
  let closed = false;
  history.pushState({ cheats: true }, '');
  openCount++;
  function onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close(false);
    }
  }
  function close(fromBack) {
    if (closed) {
      return;
    }
    closed = true;
    document.removeEventListener('keydown', onKey, true);
    layer.remove();
    openCount--;
    if (backClose === close) {
      backClose = null;
    }
    if (!fromBack) {
      ignoreNextPop = true;
      history.back();
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  }
  backClose = close;
  document.addEventListener('keydown', onKey, true);
  return close;
}

// ---------- the password prompt ----------

const guard = makeAttemptGuard();
let unlocked = false; // this page session only, never saved
let promptOpen = false;

function nowMs() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function showPrompt() {
  if (promptOpen) {
    return;
  }
  promptOpen = true;
  const box = document.createElement('form');
  box.style.cssText = 'background:var(--panel,#141A24);border:1px solid var(--line,#2A3446);' +
    'border-radius:12px;padding:16px;width:min(300px,86vw);display:flex;flex-direction:column;gap:10px';
  const input = document.createElement('input');
  input.type = 'password';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Password');
  input.style.cssText = 'min-height:44px;font-size:16px;padding:0 10px;border-radius:8px;' +
    'border:1px solid var(--line,#2A3446);background:var(--panel2,#1C2432);color:var(--text,#E8EDF5)';
  const note = document.createElement('div');
  note.style.cssText = 'min-height:18px;font-size:13px;color:var(--bad,#FF6B6B)';
  const go = document.createElement('button');
  go.type = 'submit';
  go.textContent = 'OK';
  go.style.cssText = 'min-height:44px;font-size:16px;border-radius:8px;border:0;cursor:pointer;' +
    'background:var(--spark,#FFC857);color:#0B0E14;font-weight:700';
  box.append(input, note, go);
  let timer = 0;
  const close = openOverlay(box, function () {
    promptOpen = false;
    clearInterval(timer);
  });

  function showLock() {
    const left = guard.secondsLeft(nowMs());
    if (left <= 0) {
      input.disabled = false;
      go.disabled = false;
      note.textContent = '';
      clearInterval(timer);
      return;
    }
    input.disabled = true;
    go.disabled = true;
    note.textContent = 'No. ' + left + 's';
  }
  function shake() {
    if (typeof box.animate === 'function') {
      box.animate(
        [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' },
          { transform: 'translateX(-6px)' }, { transform: 'translateX(0)' }],
        { duration: 260 }
      );
    }
  }
  box.addEventListener('submit', function (e) {
    e.preventDefault();
    if (guard.isLocked(nowMs())) {
      return;
    }
    const typed = input.value;
    input.value = '';
    if (checkPassword(typed)) {
      guard.success();
      unlocked = true;
      close(false);
      openMenu();
      return;
    }
    // Never say what is right or close: always the same short answer.
    note.textContent = 'No.';
    shake();
    if (guard.fail(nowMs()).locked) {
      showLock();
      timer = setInterval(showLock, 500);
    }
  });
  showLock();
  if (guard.isLocked(nowMs())) {
    timer = setInterval(showLock, 500);
  }
  setTimeout(function () {
    input.focus();
  }, 0);
}

function openMenu() {
  import('./menu.js').then(function (m) {
    m.openMenu({ openOverlay: openOverlay });
  }).catch(function (err) {
    console.error('Cheat menu failed to load:', err);
  });
}

let installed = false;

// Called once from main.js. Only listens for taps; it does nothing else.
export function installCheats() {
  if (installed || typeof document === 'undefined') {
    return;
  }
  installed = true;
  window.addEventListener('popstate', onPop);
  popInstalled = true;
  const counter = makeTapCounter();
  document.addEventListener('pointerdown', function (e) {
    if (e.isPrimary === false || openCount > 0) {
      return;
    }
    const t = typeof e.timeStamp === 'number' && e.timeStamp > 0 ? e.timeStamp : nowMs();
    if (counter.tap(e.clientX, e.clientY, t)) {
      if (unlocked) {
        openMenu();
      } else {
        showPrompt();
      }
    }
  }, { passive: true, capture: true });
}
