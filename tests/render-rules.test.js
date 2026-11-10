// Code rules for the renderer: no canvas blur effects, no own animation loop, pointer events only.
// Owner: AI-6
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

function renderFiles() {
  var dir = path.join(process.cwd(), 'src', 'render');
  var names = fs.readdirSync(dir);
  var out = [];
  for (var i = 0; i < names.length; i++) {
    if (names[i].endsWith('.js')) {
      out.push({ name: names[i], text: fs.readFileSync(path.join(dir, names[i]), 'utf8') });
    }
  }
  return out;
}

function check(pattern, message) {
  var files = renderFiles();
  for (var i = 0; i < files.length; i++) {
    assert.ok(files[i].text.indexOf(pattern) < 0, files[i].name + ': ' + message);
  }
}

test('no shadowBlur anywhere in src/render', function () {
  check('shadowBlur', 'uses shadowBlur');
});

test('no canvas filter and no own requestAnimationFrame', function () {
  check('ctx.filter', 'uses ctx.filter');
  check('.filter =', 'sets a filter');
  check('requestAnimationFrame', 'has its own animation loop');
});

test('no mouse-only events', function () {
  check("'mousedown'", 'mouse-only input');
  check("'touchstart'", 'touch-only input');
  check("'click'", 'click-only input');
});

test('every render file starts with an owner header', function () {
  var files = renderFiles();
  for (var i = 0; i < files.length; i++) {
    assert.ok(files[i].text.indexOf('Owner: AI-6') >= 0, files[i].name + ' has no Owner header');
  }
});
