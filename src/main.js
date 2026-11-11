// Boots the app: load the save, start the loop, show the UI. Owner: AI-1
import { loadMeta } from './core/save.js';
import { startLoop } from './core/loop.js';
import { emit } from './core/events.js';
import { setHapticsEnabled } from './platform/haptics.js';
import { startApp } from './ui/ui.js';
import { installCheats } from './cheats/gate.js';

// A small red bar at the bottom that shows any uncaught error. Very useful on a phone.
function showError(message) {
  let bar = document.getElementById('error-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'error-bar';
    bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;padding:6px 10px;' +
      'background:#b3261e;color:#fff;font:12px/1.3 monospace;max-height:30vh;overflow:auto;' +
      'padding-bottom:calc(6px + env(safe-area-inset-bottom, 0px))';
    bar.addEventListener('click', function () { bar.style.display = 'none'; });
    document.body.appendChild(bar);
  }
  bar.style.display = 'block';
  bar.textContent = String(message);
}

window.addEventListener('error', function (e) {
  showError(e.message || 'Unknown error');
});
window.addEventListener('unhandledrejection', function (e) {
  const reason = e.reason;
  showError((reason && reason.message) || reason || 'Unhandled promise rejection');
});

// Whoever holds live game state listens for 'core:flush' and saves it. main.js does not
// save a copy itself, because its copy could be older than the one the screens are using.
function flush() {
  emit('core:flush');
}
document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'hidden') flush();
});
window.addEventListener('pagehide', flush);

const meta = loadMeta();
setHapticsEnabled(meta.settings && meta.settings.haptics !== false);

// The one animation loop. Anyone can use it: on('core:frame', function (dt) {...}).
startLoop(function (dt) {
  emit('core:frame', dt);
});

installCheats(); // hidden cheat menu (AI-2): only listens for a corner tap run. MUST come before startApp() so its Back-button listener runs first.
startApp();
