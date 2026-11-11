// Standalone page to look at the board renderer without the rest of the game.
// This is a dev tool, it is not part of the production build. Owner: AI-6
import { createBoardView } from '../src/render/boardView.js';
import { sampleEvents, bigEvents, blockedEvents } from './sampleEvents.js';
import { simulate } from '../src/engine/simulate.js';
import { makeMachine as makeRealMachine, placePart } from '../src/engine/board.js';
import { allPartIds } from '../src/engine/parts/index.js';

var IDS = ['coil', 'dynamo', 'ember', 'amplifier', 'compounder', 'overdrive', 'bend', 'switch',
  'reverser', 'splitter', 'triplet', 'capacitor', 'counter', 'anvil', 'flywheel', 'battery',
  'gambler', 'fuse', 'rectifier', 'tollgate'];

// Row 1 is the fire path used by the sample events; the rest shows every icon once.
var LAYOUT = [
  ['capacitor', 'counter', 'anvil', 'battery', 'gambler'],
  ['coil', 'amplifier', 'splitter', 'compounder', 'tollgate'],
  ['fuse', 'switch', 'bend', 'overdrive', 'flywheel'],
  ['dynamo', 'ember', 'reverser', 'triplet', 'rectifier']
];

function makeMachine(withBlocked) {
  var cells = [];
  for (var y = 0; y < LAYOUT.length; y++) {
    for (var x = 0; x < LAYOUT[y].length; x++) {
      var level = 1 + ((x + y) % 3);
      cells.push({ x: x, y: y, partId: LAYOUT[y][x], level: level, rot: (x + y) % 4 });
    }
  }
  var machine = { cols: 5, rows: 4, sourceRow: 1, sparkCount: 3, startValue: 1, cells: cells,
    blocked: [], banned: [], flags: {}, seed: 1 };
  if (withBlocked) {
    machine.blocked = [{ x: 2, y: 1 }, { x: 4, y: 3 }];
    machine.cells = cells.filter(function (c) { return !(c.x === 2 && c.y === 1) && !(c.x === 4 && c.y === 3); });
  }
  machine.banned = ['gambler'];
  return machine;
}

var state = { reduce: false, blocked: false, speed: 1 };
var stats = document.getElementById('stats');
var logBox = document.getElementById('log');
var frameCount = 0;
var frameSum = 0;
var frameMax = 0;
var view;

function say(text) {
  logBox.textContent = text + '\n' + logBox.textContent.slice(0, 400);
}

// The demo drives the view with its own frame timer, so it works even without the app's loop.
var loopDeps = {
  startLoop: function (cb) {
    var last = performance.now();
    function tick(now) {
      var dt = (now - last) / 1000;
      last = now;
      frameSum += dt * 1000;
      frameCount++;
      if (dt * 1000 > frameMax) { frameMax = dt * 1000; }
      cb(dt);
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
};

view = createBoardView(document.getElementById('board'), {
  deps: loopDeps,
  onCellTap: function (x, y) { view.setSelectedCell(x, y); say('tap ' + x + ',' + y); },
  onCellDrag: function (a, b, c, d) { say('drag ' + a + ',' + b + ' to ' + c + ',' + d); },
  onEventPlayed: function (e) { window.__played = (window.__played || 0) + 1; },
  onQualityDrop: function (q) { say('auto quality dropped to ' + q); }
});
view.setMachine(makeMachine(false));

function play(events) {
  window.__played = 0;
  var started = performance.now();
  view.play(events, { speed: state.speed, reduceMotion: state.reduce }).then(function () {
    say('fire done: ' + events.length + ' events, ' + Math.round(performance.now() - started) + ' ms');
  });
}

setInterval(function () {
  if (frameCount > 0) {
    stats.textContent = 'frame time avg ' + (frameSum / frameCount).toFixed(1) + ' ms, worst ' +
      frameMax.toFixed(1) + ' ms, reported events ' + (window.__played || 0);
    frameCount = 0; frameSum = 0; frameMax = 0;
  }
}, 500);

document.getElementById('fire').onclick = function () { play(sampleEvents()); };
document.getElementById('big').onclick = function () { play(bigEvents()); };
document.getElementById('blockedFire').onclick = function () {
  state.blocked = true;
  view.setMachine(makeMachine(true));
  document.getElementById('blocked').textContent = 'fake blocked cells: on';
  play(blockedEvents());
};
// Real data: a machine with real parts, real simulate(), real event log.
function realCuratedMachine() {
  var m = makeRealMachine({ sparkCount: 3, seed: 7 });
  placePart(m, 0, 1, 'coil', 1, 0);
  placePart(m, 1, 1, 'amplifier', 1, 0);
  placePart(m, 2, 1, 'splitter', 2, 1);
  placePart(m, 3, 1, 'compounder', 1, 0);
  placePart(m, 4, 1, 'tollgate', 1, 0);
  placePart(m, 2, 2, 'bend', 1, 0);
  placePart(m, 3, 2, 'overdrive', 1, 0);
  placePart(m, 4, 2, 'flywheel', 1, 0);
  placePart(m, 1, 0, 'battery', 1, 0);
  return m;
}

// Random real parts on random cells: a stress test with logs nobody wrote by hand.
function realRandomMachine() {
  var ids = allPartIds();
  var m = makeRealMachine({ sparkCount: 3, seed: Math.floor(Math.random() * 100000) });
  for (var y = 0; y < m.rows; y++) {
    for (var x = 0; x < m.cols; x++) {
      if (Math.random() < 0.7) {
        placePart(m, x, y, ids[Math.floor(Math.random() * ids.length)], 1 + Math.floor(Math.random() * 3),
          Math.floor(Math.random() * 4));
      }
    }
  }
  return m;
}

function playReal(machine) {
  view.setMachine(machine);
  var result = simulate(machine);
  window.__real = result;
  say('REAL fire: total ' + result.total + ', ' + result.events.length + ' events');
  play(result.events);
}
document.getElementById('real').onclick = function () { playReal(realCuratedMachine()); };
document.getElementById('realRandom').onclick = function () { playReal(realRandomMachine()); };

document.getElementById('skip').onclick = function () { view.skip(); };
document.getElementById('reduce').onclick = function (e) {
  state.reduce = !state.reduce;
  e.target.textContent = 'reduce motion: ' + (state.reduce ? 'on' : 'off');
};
document.getElementById('blocked').onclick = function (e) {
  state.blocked = !state.blocked;
  view.setMachine(makeMachine(state.blocked));
  e.target.textContent = 'fake blocked cells: ' + (state.blocked ? 'on' : 'off');
};
document.getElementById('fast').onclick = function (e) {
  state.speed = state.speed === 1 ? 2 : 1;
  e.target.textContent = 'speed ' + state.speed + 'x';
};
var qButtons = document.querySelectorAll('[data-q]');
for (var i = 0; i < qButtons.length; i++) {
  qButtons[i].onclick = function (e) {
    view.setQuality(e.target.getAttribute('data-q'));
    for (var j = 0; j < qButtons.length; j++) { qButtons[j].className = ''; }
    e.target.className = 'on';
  };
}
window.__view = view;
window.__ids = IDS;
