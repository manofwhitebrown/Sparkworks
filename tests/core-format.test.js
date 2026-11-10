// Tests for src/core/format.js. Owner: AI-1
import test from 'node:test';
import assert from 'node:assert/strict';
import { formatNumber } from '../src/core/format.js';

test('format: small numbers', () => {
  assert.equal(formatNumber(0), '0');
  assert.equal(formatNumber(7), '7');
  assert.equal(formatNumber(999), '999');
});

test('format: tiny decimals keep one decimal place', () => {
  assert.equal(formatNumber(0.5), '0.5');
  assert.equal(formatNumber(12.34), '12.3');
  assert.equal(formatNumber(0.04), '0');
});

test('format: suffixes', () => {
  assert.equal(formatNumber(1200), '1.2K');
  assert.equal(formatNumber(1234), '1.23K');
  assert.equal(formatNumber(3.4e6), '3.4M');
  assert.equal(formatNumber(5.6e9), '5.6B');
  assert.equal(formatNumber(5.6e12), '5.6T');
  assert.equal(formatNumber(2e15), '2Qa');
});

test('format: rounding up never shows 1000K', () => {
  assert.equal(formatNumber(999999), '1M');
  assert.equal(formatNumber(999950), '1M');
});

test('format: huge numbers use e-style', () => {
  assert.equal(formatNumber(1e40), '1e40');
  assert.equal(formatNumber(1.5e300), '1.5e300');
});

test('format: negatives show a minus', () => {
  assert.equal(formatNumber(-5), '-5');
  assert.equal(formatNumber(-1500), '-1.5K');
  assert.equal(formatNumber(-0.04), '0');
});

test('format: NaN, Infinity and non-numbers show 0', () => {
  assert.equal(formatNumber(NaN), '0');
  assert.equal(formatNumber(Infinity), '0');
  assert.equal(formatNumber(-Infinity), '0');
  assert.equal(formatNumber(undefined), '0');
  assert.equal(formatNumber('12'), '0');
});
