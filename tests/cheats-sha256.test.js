// sha256: standard vectors, plus a check against Node's own crypto for many strings.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';
import { createHash } from 'node:crypto';
import { sha256Hex } from '../src/cheats/sha256.js';

test('sha256: empty string', () => {
  assert.strictEqual(sha256Hex(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
});

test('sha256: abc', () => {
  assert.strictEqual(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('sha256: the 448-bit NIST message (two blocks after padding)', () => {
  const text = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
  assert.strictEqual(sha256Hex(text), '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
});

test('sha256: one million letter a', () => {
  assert.strictEqual(
    sha256Hex('a'.repeat(1000000)),
    'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0'
  );
});

test('sha256: matches Node crypto on lengths 0 to 140 and on non-ASCII text', () => {
  for (let length = 0; length <= 140; length++) {
    const text = 'x'.repeat(length);
    assert.strictEqual(sha256Hex(text), createHash('sha256').update(text, 'utf8').digest('hex'), 'length ' + length);
  }
  const odd = ['é', 'ñandú', '日本語', 'emoji 😀 text', 'mixed é日😀 ' + 'z'.repeat(70), '\u0000', 'a\nb\tc'];
  for (let i = 0; i < odd.length; i++) {
    assert.strictEqual(sha256Hex(odd[i]), createHash('sha256').update(odd[i], 'utf8').digest('hex'), odd[i]);
  }
});

test('sha256: output is always 64 lowercase hex characters', () => {
  const out = sha256Hex('sparkworks-cheat-v1:' + 'some typed text');
  assert.match(out, /^[0-9a-f]{64}$/);
});
