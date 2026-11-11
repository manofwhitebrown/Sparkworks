// Plain words for kids: every part text (levels 1 to 3, every rotation), every Overload text and
// every tutorial text must have sentences of 12 words or fewer and none of the words we never say.
// See docs/WORDS.md. Owner: AI-8
//
// Texts that belong to another AI and still break the rules are listed in KNOWN below, so the
// suite stays green. The owner fixes the text and deletes the line. A NEW problem always fails.

import test from 'node:test';
import assert from 'node:assert/strict';
import { PARTS, allPartIds } from '../src/engine/parts/index.js';
import { TWISTS } from '../src/engine/twists.js';
import { STEPS } from '../src/tutorial/steps.js';

const MAX_WORDS = 12;
const NEVER = /\b(pass|passes|passed|passing|banked|banks|banking|fizzle|fizzles|fizzled|value|values|store|stores|stored|trigger|triggers|triggered|procs?)\b/i;

// label -> reason. Owner of the text is named. Remove the line when the text is fixed.
const KNOWN = {
  'twist deadCell': 'says "fizzle" (AI-3, src/engine/twists.js: say "are lost")',
  'twist twoDeadCells': 'says "fizzle" (AI-3, src/engine/twists.js: say "are lost")'
};

// Returns a list of problem strings for one text (empty when fine).
export function problemsIn(text) {
  const problems = [];
  const sentences = String(text).split(/(?<=[.!?:])\s+/);
  for (let i = 0; i < sentences.length; i++) {
    const words = sentences[i].trim().split(/\s+/).filter(Boolean).length;
    if (words > MAX_WORDS) {
      problems.push(words + ' words in one sentence');
    }
  }
  const bad = String(text).match(NEVER);
  if (bad) {
    problems.push('uses the word "' + bad[0] + '"');
  }
  return problems;
}

function collectTexts() {
  const list = [];
  const ids = allPartIds();
  for (let i = 0; i < ids.length; i++) {
    const part = PARTS[ids[i]];
    for (let level = 1; level <= part.maxLevel; level++) {
      const turns = part.directional ? 4 : 1;
      for (let rot = 0; rot < turns; rot++) {
        list.push({ label: ids[i] + ' level ' + level + ' rot ' + rot, key: ids[i], text: part.describe(level, rot) });
      }
    }
  }
  const twistIds = Object.keys(TWISTS);
  for (let i = 0; i < twistIds.length; i++) {
    const twist = TWISTS[twistIds[i]];
    list.push({ label: 'twist ' + twistIds[i] + ' name', key: 'twist ' + twistIds[i] + ' name', text: twist.name });
    list.push({ label: 'twist ' + twistIds[i], key: 'twist ' + twistIds[i], text: twist.description });
  }
  for (let i = 0; i < STEPS.length; i++) {
    list.push({ label: 'tutorial ' + STEPS[i].id, key: 'tutorial ' + STEPS[i].id, text: STEPS[i].text });
    if (STEPS[i].failText) {
      list.push({ label: 'tutorial ' + STEPS[i].id + ' failText', key: 'tutorial ' + STEPS[i].id + ' failText', text: STEPS[i].failText });
    }
  }
  return list;
}

test('the checker catches long sentences and banned words', () => {
  assert.deepEqual(problemsIn('Adds 3 to the spark.'), []);
  assert.equal(problemsIn('The spark passes the part.').length, 1);
  assert.equal(problemsIn('One two three four five six seven eight nine ten eleven twelve thirteen.').length, 1);
  assert.equal(problemsIn('Sparks that enter it fizzle.').length, 1);
  assert.equal(problemsIn('Takes the value and stores it.').length, 1);
});

test('every part, Overload and tutorial text uses plain words (docs/WORDS.md)', () => {
  const texts = collectTexts();
  assert.ok(texts.length > 100, 'expected many texts, got ' + texts.length);
  const failures = [];
  const stillKnown = {};
  for (let i = 0; i < texts.length; i++) {
    const problems = problemsIn(texts[i].text);
    if (problems.length === 0) {
      continue;
    }
    if (KNOWN[texts[i].key]) {
      stillKnown[texts[i].key] = true;
      continue;
    }
    failures.push(texts[i].label + ': ' + problems.join(', ') + ' -> "' + texts[i].text + '"');
  }
  assert.deepEqual(failures, [], 'Texts break docs/WORDS.md (tell the owner AI):\n' + failures.join('\n'));
  const fixed = Object.keys(KNOWN).filter(function gone(k) { return !stillKnown[k]; });
  if (fixed.length > 0) {
    console.log('plain-text: fixed, you can delete these from KNOWN: ' + fixed.join(', '));
  }
});
