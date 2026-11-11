// All short-lived visual state: tile pops, cell light, number popups, flashes, vault, shake.
// Arrays are made once per board size and reused. Pure data + math, no drawing here.
// Owner: AI-6
import { THEME } from './theme.js';
import { numberScale, popScale, shakePixels, clamp } from './juice.js';

var MAX_POPUPS = 24;
var MAX_LOST = 8;
var MAX_RINGS = 6;

export function createEffects() {
  var cols = 5;
  var rows = 4;
  var light = new Float32Array(64);
  var popAge = new Float32Array(64);
  var popAmp = new Float32Array(64);
  var flicker = new Float32Array(64);
  var flash = new Float32Array(64);
  var bonusFlash = new Float32Array(64);
  var wireAge = new Float32Array(64);
  var wireGeo = new Float32Array(64 * 4);
  var disabled = new Uint8Array(64);
  var noteAge = new Float32Array(64);
  var noteText = [];
  var popups = [];
  var lostMarks = [];
  var rings = [];
  var shake = { amp: 0, age: 99 };
  var vault = { shown: 0, target: 0, pulse: 0, fill: 0, fillTarget: 0 };
  var dim = 0;
  var dimTarget = 0;
  var i;

  for (i = 0; i < MAX_RINGS; i++) {
    rings.push({ on: false, x: 0, y: 0, age: 0, power: 1 });
  }
  for (i = 0; i < MAX_LOST; i++) {
    lostMarks.push({ on: false, x: 0, y: 0, age: 0 });
  }
  for (i = 0; i < MAX_POPUPS; i++) {
    popups.push({ on: false, text: '', sub: '', x: 0, y: 0, age: 0, life: 1, scale: 1, color: '' });
  }

  function reset(newCols, newRows) {
    cols = newCols;
    rows = newRows;
    var n = Math.max(64, cols * rows);
    if (light.length < n) {
      light = new Float32Array(n);
      popAge = new Float32Array(n);
      popAmp = new Float32Array(n);
      flicker = new Float32Array(n);
      flash = new Float32Array(n);
      bonusFlash = new Float32Array(n);
      wireAge = new Float32Array(n);
      wireGeo = new Float32Array(n * 4);
      disabled = new Uint8Array(n);
      noteAge = new Float32Array(n);
    }
    for (i = 0; i < n; i++) {
      light[i] = 0;
      popAge[i] = 9;
      popAmp[i] = 0;
      flicker[i] = 0;
      flash[i] = 0;
      bonusFlash[i] = 0;
      wireAge[i] = 0;
      disabled[i] = 0;
      noteAge[i] = 9;
      noteText[i] = '';
    }
    for (i = 0; i < MAX_POPUPS; i++) { popups[i].on = false; }
    for (i = 0; i < MAX_LOST; i++) { lostMarks[i].on = false; }
    for (i = 0; i < MAX_RINGS; i++) { rings[i].on = false; }
    shake.amp = 0;
    shake.age = 99;
    vault.shown = 0;
    vault.target = 0;
    vault.pulse = 0;
    vault.fill = 0;
    vault.fillTarget = 0;
    dim = 0;
    dimTarget = 0;
  }

  function idx(x, y) {
    if (x < 0 || y < 0 || x >= cols || y >= rows) {
      return -1;
    }
    return y * cols + x;
  }

  function lightCell(x, y, amount) {
    var k = idx(x, y);
    if (k >= 0) { light[k] = Math.max(light[k], amount); }
  }

  function popTile(x, y, before, after) {
    var k = idx(x, y);
    if (k >= 0) {
      popAge[k] = 0;
      popAmp[k] = popScale(before, after) - 1;
    }
  }

  function flickerTile(x, y) {
    var k = idx(x, y);
    if (k >= 0) { flicker[k] = 1; disabled[k] = 1; }
  }

  function flashCell(x, y) {
    var k = idx(x, y);
    if (k >= 0) { flash[k] = 1; }
  }

  // A bonus floor tile lights up when a spark enters it.
  function flashBonus(x, y) {
    var k = idx(x, y);
    if (k >= 0) { bonusFlash[k] = 1; }
  }

  // A small "x" at the board edge where a spark was lost. (ex, ey) is the point in cell units
  // (the last cell plus half a cell in the direction the spark left).
  function addLost(ex, ey) {
    var best = 0;
    for (i = 0; i < MAX_LOST; i++) {
      if (!lostMarks[i].on) { best = i; break; }
      if (lostMarks[i].age > lostMarks[best].age) { best = i; }
    }
    var m = lostMarks[best];
    m.on = true;
    m.x = ex;
    m.y = ey;
    m.age = 0;
  }

  // Energy on the wire the spark just crossed: from cell (fx, fy) to cell (tx, ty), stored on the target cell.
  function lightWire(tx, ty, fx, fy) {
    var k = idx(tx, ty);
    if (k < 0) { return; }
    wireAge[k] = 1;
    wireGeo[k * 4] = fx;
    wireGeo[k * 4 + 1] = fy;
    wireGeo[k * 4 + 2] = tx;
    wireGeo[k * 4 + 3] = ty;
  }

  // An expanding ring (merge / level-up flourish). x, y are cell coordinates.
  function addRing(x, y, power) {
    var best = 0;
    for (i = 0; i < MAX_RINGS; i++) {
      if (!rings[i].on) { best = i; break; }
      if (rings[i].age > rings[best].age) { best = i; }
    }
    var r = rings[best];
    r.on = true;
    r.x = x;
    r.y = y;
    r.age = 0;
    r.power = power || 1;
  }

  function setNote(x, y, text) {
    var k = idx(x, y);
    if (k >= 0) {
      noteText[k] = text;
      noteAge[k] = 0;
    }
  }

  // Start a floating number. Reuses the oldest popup when all are busy.
  function addPopup(text, sub, x, y, scale, color, life) {
    var best = 0;
    for (i = 0; i < MAX_POPUPS; i++) {
      if (!popups[i].on) { best = i; break; }
      if (popups[i].age > popups[best].age) { best = i; }
    }
    var p = popups[best];
    p.on = true;
    p.text = text;
    p.sub = sub || '';
    p.x = x;
    p.y = y;
    p.age = 0;
    p.life = life;
    p.scale = scale;
    p.color = color;
  }

  function valuePopup(x, y, label, before, after, px, py, formatNumber, reduce, color) {
    var big = after >= 100;
    var life = reduce ? 0.5 : THEME.timing.numberMs / 1000;
    addPopup(label || '', big ? formatNumber(after) : '', px, py, numberScale(before, after),
      color || THEME.colors.sparkHot, life);
  }

  function bank(value, hero) {
    vault.pulse = 1;
    vault.fillTarget = Math.min(1, vault.fillTarget + (hero ? 0.35 : 0.18));
    var amp = shakePixels(value);
    if (hero && amp > 0) { amp = Math.min(amp * 1.4, THEME.maxShakePx * 1.4); }
    if (amp > shake.amp * 0.5 || shake.age > 0.3) {
      shake.amp = amp;
      shake.age = 0;
    }
  }

  function setVaultTarget(total) {
    vault.target = total;
  }

  function setPlaying(flag) {
    dimTarget = flag ? 1 : 0;
  }

  function update(dt) {
    var n = cols * rows;
    var k;
    for (k = 0; k < n; k++) {
      if (light[k] > 0) { light[k] = Math.max(0, light[k] - dt * 1.6); }
      if (popAge[k] < 1) { popAge[k] += dt / (THEME.timing.popMs / 1000); }
      if (flicker[k] > 0) { flicker[k] = Math.max(0, flicker[k] - dt * 2.5); }
      if (flash[k] > 0) { flash[k] = Math.max(0, flash[k] - dt / (THEME.timing.blockedMs / 1000)); }
      if (bonusFlash[k] > 0) { bonusFlash[k] = Math.max(0, bonusFlash[k] - dt * 3); }
      if (wireAge[k] > 0) { wireAge[k] = Math.max(0, wireAge[k] - dt * 1.3); }
      if (noteAge[k] < 2) { noteAge[k] += dt; }
    }
    for (k = 0; k < MAX_POPUPS; k++) {
      if (popups[k].on) {
        popups[k].age += dt;
        if (popups[k].age >= popups[k].life) { popups[k].on = false; }
      }
    }
    for (k = 0; k < MAX_LOST; k++) {
      if (lostMarks[k].on) {
        lostMarks[k].age += dt;
        if (lostMarks[k].age >= THEME.timing.lostMs / 1000) { lostMarks[k].on = false; }
      }
    }
    for (k = 0; k < MAX_RINGS; k++) {
      if (rings[k].on) {
        rings[k].age += dt;
        if (rings[k].age >= THEME.timing.ringMs / 1000) { rings[k].on = false; }
      }
    }
    // the vault fills while sparks bank, then drains slowly once the Fire is over
    if (dimTarget === 0) { vault.fillTarget = Math.max(0, vault.fillTarget - dt * 0.35); }
    vault.fill += (vault.fillTarget - vault.fill) * Math.min(1, dt * 6);
    if (Math.abs(vault.fillTarget - vault.fill) < 0.004) { vault.fill = vault.fillTarget; }
    shake.age += dt;
    vault.pulse = Math.max(0, vault.pulse - dt * 3);
    vault.shown += (vault.target - vault.shown) * Math.min(1, dt * 12);
    if (Math.abs(vault.target - vault.shown) < 0.5) { vault.shown = vault.target; }
    dim += (dimTarget - dim) * Math.min(1, dt * 6);
  }

  // True when something still needs frames (so the idle board can skip drawing).
  function busy() {
    var n = cols * rows;
    for (var k = 0; k < n; k++) {
      if (light[k] > 0 || popAge[k] < 1 || flicker[k] > 0 || flash[k] > 0 || bonusFlash[k] > 0 || wireAge[k] > 0 || noteAge[k] < 2) { return true; }
    }
    for (k = 0; k < MAX_POPUPS; k++) {
      if (popups[k].on) { return true; }
    }
    for (k = 0; k < MAX_LOST; k++) {
      if (lostMarks[k].on) { return true; }
    }
    for (k = 0; k < MAX_RINGS; k++) {
      if (rings[k].on) { return true; }
    }
    if (vault.fill !== vault.fillTarget) { return true; }
    return vault.pulse > 0 || shake.age < 0.3 || vault.shown !== vault.target
      || Math.abs(dim - dimTarget) > 0.01;
  }

  function shakeOffset(out) {
    var t = clamp(shake.age / (THEME.timing.shakeMs / 1000), 0, 1);
    var a = shake.amp * (1 - t) * (1 - t);
    out.x = Math.sin(shake.age * 90) * a;
    out.y = Math.cos(shake.age * 77) * a;
  }

  return {
    reset: reset, idx: idx, lightCell: lightCell, popTile: popTile, flickerTile: flickerTile,
    flashCell: flashCell, flashBonus: flashBonus, lightWire: lightWire, addRing: addRing, rings: rings, wireOf: function (k) { return wireAge[k]; }, wireGeoOf: function (k, j) { return wireGeo[k * 4 + j]; }, addLost: addLost, lostMarks: lostMarks, setNote: setNote, addPopup: addPopup, valuePopup: valuePopup,
    bank: bank, setVaultTarget: setVaultTarget, setPlaying: setPlaying, update: update,
    clearDisabled: function () { for (var d = 0; d < disabled.length; d++) { disabled[d] = 0; } },
    isDisabled: function (k) { return disabled[k] === 1; },
    busy: busy, shakeOffset: shakeOffset,
    light: function (k) { return light[k]; },
    popProgress: function (k) { return popAge[k]; },
    popAmp: function (k) { return popAmp[k]; },
    flickerOf: function (k) { return flicker[k]; },
    flashOf: function (k) { return flash[k]; },
    bonusFlashOf: function (k) { return bonusFlash[k]; },
    noteOf: function (k) { return noteAge[k] < 2 ? noteText[k] : ''; },
    noteAge: function (k) { return noteAge[k]; },
    popups: popups, vault: vault,
    dimAmount: function () { return dim; }
  };
}
