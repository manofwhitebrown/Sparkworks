// Daily reminder for the Android app. In a normal browser everything here does nothing. Owner: AI-1
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

const CHANNEL_ID = 'reminders';
const REMINDER_ID = 1001;
const REMINDER_HOUR = 10;          // every day at 10:00
const QUIET_FROM = 22;             // never between 22:00 ...
const QUIET_TO = 8;                // ... and 08:00

let channelMade = false;
let chain = Promise.resolve();

function isNative() {
  try {
    return !!(Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform());
  } catch (err) {
    return false;
  }
}

function isQuietHour(hour) {
  return hour >= QUIET_FROM || hour < QUIET_TO;
}

// Device calls run one after another, and any error is swallowed: a reminder can never break the game.
function queue(fn) {
  chain = chain.then(fn).catch(function () {});
  return chain;
}

async function ensurePermission() {
  const state = await LocalNotifications.checkPermissions();
  if (state.display === 'granted') return true;
  if (state.display === 'prompt' || state.display === 'prompt-with-rationale') {
    const asked = await LocalNotifications.requestPermissions();
    return asked.display === 'granted';
  }
  return false;
}

async function ensureChannel() {
  if (channelMade || Capacitor.getPlatform() !== 'android') return;
  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Daily contract',
    description: 'A reminder when the daily contract is ready',
    importance: 3,
  });
  channelMade = true;
}

async function cancelAll() {
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length > 0) {
    const list = pending.notifications.map(function (n) { return { id: n.id }; });
    await LocalNotifications.cancel({ notifications: list });
  }
}

// Permission is asked only here, the first time a reminder is scheduled.
export function scheduleDailyReminder() {
  if (!isNative() || isQuietHour(REMINDER_HOUR)) return Promise.resolve();
  return queue(async function () {
    if (!(await ensurePermission())) return;
    await ensureChannel();
    await cancelAll();
    await LocalNotifications.schedule({
      notifications: [{
        id: REMINDER_ID,
        title: 'Sparkworks',
        body: 'Today\'s contract is ready',
        channelId: CHANNEL_ID,
        // Not exact: a few minutes late is fine, and exact alarms send the player to a settings screen.
        schedule: { on: { hour: REMINDER_HOUR, minute: 0 }, repeats: true, allowWhileIdle: true },
      }],
    });
  });
}

export function cancelReminders() {
  if (!isNative()) return Promise.resolve();
  return queue(cancelAll);
}
