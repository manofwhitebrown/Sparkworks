// Daily Contract: same seed for everybody on a date. Nothing online.
// Owner: AI-5
import { hashString } from '../core/rng.js';

const DAILY_INVENTORS = ['tinkerbot', 'clockmaker', 'drvolt'];
const INVENTOR_NAMES = { tinkerbot: 'Tinkerbot', clockmaker: 'Clockmaker', drvolt: 'Dr. Volt' };

function pad2(n) {
  return n < 10 ? '0' + n : String(n);
}

function dateToString(date) {
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

// LOCAL date, not UTC, so "today" matches the player's wall clock.
export function todayString(now) {
  return dateToString(now || new Date());
}

export function yesterdayOf(dateString) {
  const parts = dateString.split('-');
  // Noon avoids daylight-saving edge cases when stepping back one day.
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12);
  d.setDate(d.getDate() - 1);
  return dateToString(d);
}

// deps.hashString lets tests replace the hash function.
export function dailyConfig(dateString, deps) {
  const hash = deps && deps.hashString ? deps.hashString : hashString;
  const seed = hash('sparkworks-daily-' + dateString);
  const pick = hash('sparkworks-inventor-' + dateString) % DAILY_INVENTORS.length;
  return { seed: seed, inventorId: DAILY_INVENTORS[pick], voltage: 1 };
}

export function hasPlayedDaily(meta, dateString) {
  return meta.daily.lastPlayed === dateString;
}

// result: { shiftReached, bestFire, won } (best result of the day is kept).
export function recordDaily(meta, dateString, result) {
  // A cheated run never counts for the daily contract.
  if (result && result.cheated === true) return;
  // The tutorial run is practice and never counts either.
  if (result && result.tutorial === true) return;
  const daily = meta.daily;
  if (daily.lastPlayed !== dateString) {
    daily.streak = daily.lastPlayed === yesterdayOf(dateString) ? daily.streak + 1 : 1;
    daily.lastPlayed = dateString;
    daily.best = null;
  }
  if (isBetter(result, daily.best)) daily.best = result;
}

function isBetter(result, best) {
  if (!best) return true;
  if (result.shiftReached !== best.shiftReached) return result.shiftReached > best.shiftReached;
  return result.bestFire > best.bestFire;
}

function shortNumber(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(Math.floor(n));
}

// One line, no line breaks, easy to paste.
export function shareCode(dateString, result, deps) {
  const config = dailyConfig(dateString, deps);
  const name = INVENTOR_NAMES[config.inventorId];
  return 'SPARKWORKS ' + dateString + ' | ' + name + ' V' + config.voltage +
    ' | Shift ' + result.shiftReached + '/8 | Best fire ' + shortNumber(result.bestFire);
}
