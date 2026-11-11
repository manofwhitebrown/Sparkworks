// The Android Back button. With the App plugin installed, Back no longer closes the game by itself:
// the game decides what Back does (close a dialog, ask to leave a run, go Home). In a browser nothing
// happens here: the browser's own Back goes through history and `popstate` in src/ui/ui.js.
// Owner: AI-1
import { Capacitor } from '@capacitor/core';

function isNative() {
  try {
    return !!(Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  } catch (err) {
    return false;
  }
}

// handler() is called on every Back press. Returns true when a native listener was installed.
export async function installBackButton(handler) {
  if (!isNative()) return false;
  try {
    const mod = await import('@capacitor/app');
    await mod.App.addListener('backButton', function () { handler(); });
    return true;
  } catch (err) {
    return false;
  }
}

// Closes the app (Android). Only used after a second Back press on Home.
export async function exitApp() {
  if (!isNative()) return;
  try {
    const mod = await import('@capacitor/app');
    await mod.App.exitApp();
  } catch (err) {
    // Nothing to do: the user can still use the Home button of the phone.
  }
}
