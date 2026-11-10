// The cheat gate logic: tap counting, the lock-out, and the password check.
// A FAKE password and a FAKE hash are used here. The real password is not in the repo.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { isInCorner, makeTapCounter, makeAttemptGuard, checkPassword } from '../src/cheats/gate.js';
import { sha256Hex } from '../src/cheats/sha256.js';

function tapMany(counter, count, startMs, gapMs, x, y) {
  let opened = false;
  for (let i = 0; i < count; i++) {
    if (counter.tap(x, y, startMs + i * gapMs)) {
      opened = true;
    }
  }
  return opened;
}

test('corner: only the top-left 80 x 80 px counts', () => {
  assert.ok(isInCorner(0, 0));
  assert.ok(isInCorner(79, 79));
  assert.ok(!isInCorner(80, 10));
  assert.ok(!isInCorner(10, 80));
  assert.ok(!isInCorner(-1, 5));
  assert.ok(!isInCorner(undefined, 5));
  assert.ok(!isInCorner('5', 5));
});

test('taps: 7 quick taps in the corner open the prompt', () => {
  const counter = makeTapCounter();
  assert.strictEqual(tapMany(counter, 7, 1000, 200, 30, 30), true);
});

test('taps: 6 taps do not open it', () => {
  const counter = makeTapCounter();
  assert.strictEqual(tapMany(counter, 6, 1000, 200, 30, 30), false);
});

test('taps: a slow 7th tap does not open it', () => {
  const counter = makeTapCounter();
  assert.strictEqual(tapMany(counter, 6, 1000, 100, 30, 30), false);
  assert.strictEqual(counter.tap(30, 30, 1000 + 3500), false);
});

test('taps: exactly inside 3 seconds still opens', () => {
  const counter = makeTapCounter();
  assert.strictEqual(tapMany(counter, 7, 0, 500, 5, 5), true); // 0 .. 3000
});

test('taps: taps outside the corner do not count', () => {
  const counter = makeTapCounter();
  assert.strictEqual(tapMany(counter, 7, 1000, 100, 200, 300), false);
  const mixed = makeTapCounter();
  let opened = false;
  for (let i = 0; i < 6; i++) {
    opened = mixed.tap(40, 40, 1000 + i * 100) || opened;
    opened = mixed.tap(300, 300, 1050 + i * 100) || opened;
  }
  assert.strictEqual(opened, false);
  assert.strictEqual(mixed.tap(40, 40, 1700), true); // the 7th corner tap
});

test('taps: it can open again after it opened, but not from leftover taps', () => {
  const counter = makeTapCounter();
  assert.strictEqual(tapMany(counter, 7, 1000, 100, 10, 10), true);
  assert.strictEqual(counter.tap(10, 10, 1800), false);
  assert.strictEqual(tapMany(counter, 7, 5000, 100, 10, 10), true);
});

test('lock-out: 3 wrong tries lock for 30 seconds, then it opens again', () => {
  const guard = makeAttemptGuard();
  assert.strictEqual(guard.isLocked(0), false);
  assert.deepStrictEqual(guard.fail(1000), { locked: false });
  assert.deepStrictEqual(guard.fail(2000), { locked: false });
  assert.strictEqual(guard.isLocked(2500), false);
  assert.deepStrictEqual(guard.fail(3000), { locked: true });
  assert.strictEqual(guard.isLocked(3001), true);
  assert.strictEqual(guard.secondsLeft(3000), 30);
  assert.strictEqual(guard.secondsLeft(18000), 15);
  assert.strictEqual(guard.isLocked(32999), true);
  assert.strictEqual(guard.isLocked(33000), false);
  assert.strictEqual(guard.secondsLeft(33000), 0);
  // after the lock a new round of 3 starts
  assert.deepStrictEqual(guard.fail(34000), { locked: false });
  assert.deepStrictEqual(guard.fail(35000), { locked: false });
  assert.deepStrictEqual(guard.fail(36000), { locked: true });
});

test('lock-out: a right password clears the count', () => {
  const guard = makeAttemptGuard();
  guard.fail(0);
  guard.fail(1);
  guard.success();
  assert.deepStrictEqual(guard.fail(2), { locked: false });
  assert.deepStrictEqual(guard.fail(3), { locked: false });
});

test('password check: uses prefix + typed text with a fake password and fake hash', () => {
  const fakeHash = sha256Hex('test-prefix:not-the-real-password');
  assert.strictEqual(checkPassword('not-the-real-password', fakeHash, sha256Hex, 'test-prefix:'), true);
  assert.strictEqual(checkPassword('not-the-real-passwor', fakeHash, sha256Hex, 'test-prefix:'), false);
  assert.strictEqual(checkPassword('', fakeHash, sha256Hex, 'test-prefix:'), false);
  assert.strictEqual(checkPassword('NOT-THE-REAL-PASSWORD', fakeHash, sha256Hex, 'test-prefix:'), false);
});

test('password check: the real hash is not matched by easy guesses', () => {
  const guesses = ['', 'password', 'sparkworks', 'cheat', '1234', 'admin', 'letmein'];
  for (let i = 0; i < guesses.length; i++) {
    assert.strictEqual(checkPassword(guesses[i]), false);
  }
});
