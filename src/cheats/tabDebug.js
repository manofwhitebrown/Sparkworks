// The DEBUG tab: seed, run JSON, Fire preview, last Fire log, speed, fps, quality, error bar.
// state.recorder holds the log of the last Fire seen. Owner: AI-2

import { simulate } from '../engine/simulate.js';
import { cloneMachine } from '../engine/board.js';
import * as dbg from './debugTools.js';
import { button, row, section, copyText, el } from './menuUi.js';
import { initAudio } from '../audio/audio.js';
import { playSfx, playPass } from '../audio/sfx.js';
import { startMusic, stopMusic } from '../audio/music.js';

function copyButton(label, getText, env) {
  return button(label, function () {
    const text = getText();
    if (text === null) {
      env.toast('Open a run first');
      return;
    }
    copyText(text, function (ok) {
      env.toast(ok ? 'Copied' : 'Copy failed');
    });
  });
}

function seedSection(env) {
  const runText = function (fn) {
    return function () {
      const run = env.getRun();
      return run ? fn(run) : null;
    };
  };
  const show = el('p', 'ckx-note', '');
  const showSeed = button('Show seed', function () {
    const run = env.getRun();
    show.textContent = run ? 'Run seed: ' + run.seed : 'Open a run first';
  });
  return section('Run', [
    row([showSeed, copyButton('Copy seed', runText(function (r) { return String(r.seed); }), env)]),
    show,
    row([copyButton('Copy run JSON', runText(function (r) { return JSON.stringify(r); }), env)])
  ]);
}

function previewSection(env) {
  const out = el('pre', 'ckx-pre', 'Nothing yet.');
  const go = button('Preview Fire', function () {
    const res = env.doRun('preview', dbg.previewFire, { quiet: true });
    if (res.ok) {
      out.textContent = dbg.summaryText(res.data);
    }
  }, { go: true });
  return section('Preview Fire (uses no Fire)', [
    el('p', 'ckx-note', 'Real Fires use a new seed, so parts with random numbers can differ.'),
    row([go]), out
  ]);
}

function logSection(env, state) {
  const out = el('pre', 'ckx-pre', 'Nothing yet.');
  let text = '';
  const show = function (label, events) {
    text = events ? dbg.eventsText(events) : '';
    out.textContent = events ? label + '\n' + text : 'No Fire seen since this menu was unlocked.';
  };
  const last = button('Last Fire log', function () {
    const seen = state.recorder.get();
    show('Last Fire (' + (seen ? seen.how : '') + '):', seen ? seen.events : null);
  });
  const board = button('Log of current board', function () {
    const run = env.getRun();
    if (!run) {
      env.toast('Open a run first');
      return;
    }
    run.cheated = true;
    show('Current board (preview):', simulate(cloneMachine(run.machine)).events);
  });
  const copy = button('Copy log', function () {
    copyText(text, function (ok) { env.toast(ok ? 'Copied' : 'Copy failed'); });
  });
  return section('Event log', [row([last, board, copy]), out]);
}

function speedSection(env, state) {
  const buttons = [];
  const labels = dbg.SPEEDS.map(function (s) { return s === 'instant' ? 'Instant' : s + 'x'; });
  for (let i = 0; i < dbg.SPEEDS.length; i++) {
    const value = dbg.SPEEDS[i];
    const b = button(labels[i], function () {
      const res = dbg.setSpeed(value, env.emit);
      env.toast(res.msg);
      state.speed = value;
      for (let j = 0; j < buttons.length; j++) {
        buttons[j].classList.toggle('ckx-on', j === i);
      }
    }, { on: (state.speed === undefined ? 1 : state.speed) === value });
    buttons.push(b);
  }
  return section('Fire animation speed', [row(buttons)]);
}

function switchSection(env) {
  const fps = button('FPS counter', function () {
    dbg.setFps(!dbg.isFpsOn());
    fps.classList.toggle('ckx-on', dbg.isFpsOn());
  }, { on: dbg.isFpsOn() });
  const quality = dbg.QUALITIES.map(function (q) {
    return button(q, function () {
      env.doMeta('quality', function (m) { return dbg.setQuality(m, q); });
    });
  });
  const bar = button('Show the error bar', function () {
    dbg.throwTestError();
    env.toast('Test error thrown');
  });
  return section('Switches', [row([fps, bar]), el('p', 'ckx-note', 'Render quality'), row(quality)]);
}

// Every sound, one button each, so the owner can hear them without playing. Not a run
// change, so it does not mark the run as cheated.
const SOUND_NAMES = ['tap', 'place', 'rotate', 'buy', 'sell', 'reroll', 'merge', 'fire', 'bank',
  'lost', 'bonus', 'hint', 'win', 'lose', 'unlock', 'error', 'overload'];

function soundSection(env) {
  const names = SOUND_NAMES.map(function (name) {
    return button(name, function () {
      initAudio();
      playSfx(name, { size: 0.7 });
    });
  });
  const scale = button('Rising scale (20 passes)', function () {
    initAudio();
    for (let step = 0; step < 20; step++) {
      setTimeout(playPass.bind(null, step), step * 110);
    }
  });
  const musicOn = button('Music on', function () { initAudio(); startMusic(); env.toast('Music on'); });
  const musicOff = button('Music off', function () { stopMusic(); env.toast('Music off'); });
  return section('Sounds', [row(names), row([scale]), row([musicOn, musicOff])]);
}

export function buildDebugTab(env, state) {
  const box = document.createElement('div');
  const parts = [seedSection(env), previewSection(env), logSection(env, state),
    speedSection(env, state), soundSection(env), switchSection(env)];
  for (let i = 0; i < parts.length; i++) {
    box.appendChild(parts[i]);
  }
  return box;
}
