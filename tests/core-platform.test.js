// The phone-only modules must do nothing (and not throw) in a browser or in node. Owner: AI-1
import test from 'node:test';
import assert from 'node:assert/strict';
import { scheduleDailyReminder, cancelReminders } from '../src/platform/notifications.js';
import { buzz, setHapticsEnabled } from '../src/platform/haptics.js';

test('platform: reminders do nothing outside the app', async () => {
  await scheduleDailyReminder();
  await cancelReminders();
});

test('platform: buzz does nothing outside the app', () => {
  buzz('light');
  buzz('medium');
  buzz('heavy');
  setHapticsEnabled(false);
  buzz('heavy');
  setHapticsEnabled(true);
  assert.ok(true);
});
