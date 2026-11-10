// Small vibrations on a phone. Does nothing in a browser or when haptics are turned off. Owner: AI-1
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

let enabled = true;

export function setHapticsEnabled(flag) {
  enabled = !!flag;
}

function isNative() {
  try {
    return !!(Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  } catch (err) {
    return false;
  }
}

// kind: 'light' | 'medium' | 'heavy'
export function buzz(kind) {
  if (!enabled || !isNative()) return;
  let style = ImpactStyle.Light;
  if (kind === 'medium') style = ImpactStyle.Medium;
  if (kind === 'heavy') style = ImpactStyle.Heavy;
  try {
    Haptics.impact({ style: style }).catch(function () {});
  } catch (err) {
    // A failed buzz is never worth an error.
  }
}
