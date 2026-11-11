// Builds every tab of the cheat menu on a tiny fake DOM and clicks EVERY button on real runs.
// After each click the run (or meta) must still be valid. The FPS and error-bar buttons are
// skipped here (they need a real browser); they were checked by hand in Chromium.
// Owner: AI-2

import test from 'node:test';
import assert from 'node:assert';

function makeNode(tag) {
  return {
    tagName: tag, className: '', textContent: '', value: '', type: '', children: [], listeners: {}, attrs: {},
    appendChild(child) {
      this.children.push(child);
      if (this.tagName === 'select' && this.value === '') {
        this.value = child.value;
      }
      return child;
    },
    append(...kids) {
      kids.forEach((k) => this.appendChild(k));
    },
    addEventListener(name, fn) {
      (this.listeners[name] = this.listeners[name] || []).push(fn);
    },
    setAttribute(key, value) {
      this.attrs[key] = value;
    },
    classList: { toggle() {}, add() {}, remove() {} },
    select() {},
    remove() {}
  };
}

globalThis.document = { createElement: makeNode, body: makeNode('body'), getElementById: () => null };

const { newRun, fire } = await import('../src/run/runState.js');
const { makeOffers } = await import('../src/run/shop.js');
const { validateMachine } = await import('../src/engine/board.js');
const { allPartIds } = await import('../src/engine/parts/index.js');
const { benchSizeOf } = await import('../src/run/runRules.js');
const { defaultMeta, repairMeta } = await import('../src/meta/metaState.js');
const { makeEnv } = await import('../src/cheats/cheatEnv.js');
const { makeFireRecorder, SPEEDS } = await import('../src/cheats/debugTools.js');
const { exportSave } = await import('../src/cheats/metaCheats.js');
const { buildRunTab } = await import('../src/cheats/tabRun.js');
const { buildShopTab } = await import('../src/cheats/tabShop.js');
const { buildMetaTab } = await import('../src/cheats/tabMeta.js');
const { buildDebugTab } = await import('../src/cheats/tabDebug.js');

function walk(node, found, tagName) {
  if (node.tagName === tagName) {
    found.push(node);
  }
  for (let i = 0; i < node.children.length; i++) {
    walk(node.children[i], found, tagName);
  }
  return found;
}

function click(node) {
  const list = node.listeners.click || [];
  for (let i = 0; i < list.length; i++) {
    list[i]({});
  }
}

function freshRun(seed) {
  return newRun({ inventorId: 'drvolt', voltage: 1, seed: seed, poolIds: allPartIds(), bonuses: {} });
}

function makeLive(run, meta) {
  const live = { run: run, meta: meta, toasts: [], events: [], runSaves: 0, metaSaves: 0 };
  live.env = makeEnv({
    getRun: () => live.run,
    getMeta: () => live.meta,
    setRun: (r) => { live.run = r; },
    saveRun: () => { live.runSaves++; },
    saveMeta: () => { live.metaSaves++; },
    emit: (name, data) => { live.events.push([name, data]); },
    toast: (t) => { live.toasts.push(t); },
    applySettings: () => {}
  });
  return live;
}

function assertRunValid(run) {
  assert.deepStrictEqual(validateMachine(run.machine), []);
  assert.ok(Number.isFinite(run.coins) && run.coins >= 0);
  assert.ok(Number.isFinite(run.firesLeft) && run.firesLeft >= 0);
  assert.ok(run.bench.length <= benchSizeOf(run));
  assert.ok(run.machine.sparkCount >= 1);
}

function skipped(label, extra) {
  return label === 'FPS counter' || label === 'Show the error bar' || label === extra;
}

function clickAll(tab, live, check, extraSkip) {
  const buttons = walk(tab, [], 'button');
  let clicked = 0;
  for (let i = 0; i < buttons.length; i++) {
    if (skipped(buttons[i].textContent, extraSkip)) {
      continue;
    }
    click(buttons[i]);
    clicked++;
    check(buttons[i].textContent);
  }
  return clicked;
}

test('RUN tab: every button, in order, on a build run keeps the run valid', () => {
  const live = makeLive(freshRun(3), defaultMeta());
  const tab = buildRunTab(live.env);
  const clicked = clickAll(tab, live, () => assertRunValid(live.run));
  assert.ok(clicked >= 30, 'found the buttons (' + clicked + ')');
  assert.strictEqual(live.run.cheated, true);
  assert.ok(live.events.length > 10);
  assert.ok(live.events.every((e) => e[0] === 'cheat:changed'));
  assert.ok(live.runSaves > 10);
});

test('RUN tab: every button still works from a shop-phase and a lost run (refusals are fine)', () => {
  const phases = ['shop', 'lost', 'won'];
  for (let p = 0; p < phases.length; p++) {
    const run = freshRun(5 + p);
    run.phase = phases[p];
    const live = makeLive(run, defaultMeta());
    clickAll(buildRunTab(live.env), live, () => assertRunValid(live.run));
  }
});

test('RUN tab with no run: every button says "Open a run first" and saves nothing', () => {
  const live = makeLive(null, defaultMeta());
  clickAll(buildRunTab(live.env), live, () => {});
  assert.ok(live.toasts.length > 0);
  assert.ok(live.toasts.every((t) => t === 'Open a run first'));
  assert.strictEqual(live.runSaves, 0);
  assert.strictEqual(live.events.length, 0);
});

test('SHOP tab: reroll, prices and forcing offers work in the shop and are refused outside it', () => {
  const run = freshRun(8);
  run.phase = 'shop';
  makeOffers(run);
  const live = makeLive(run, defaultMeta());
  const tab = buildShopTab(live.env);
  const selects = walk(tab, [], 'select');
  assert.strictEqual(selects.length, 4);
  selects[0].value = 'coil';
  selects[1].value = 'splitter';
  clickAll(tab, live, () => assertRunValid(live.run));
  assert.deepStrictEqual(live.run.offers.map((o) => o.partId), ['coil', 'splitter']);
  assert.strictEqual(live.run.cheated, true);
  const build = makeLive(freshRun(9), defaultMeta());
  clickAll(buildShopTab(build.env), build, () => {});
  assert.ok(build.toasts.every((t) => t === 'Open the shop first'));
});

test('META tab: every button leaves a valid meta; undo and paste restore work', () => {
  const meta = defaultMeta();
  const live = makeLive(freshRun(2), meta);
  const state = { snapshot: JSON.parse(JSON.stringify(meta)) };
  const tab = buildMetaTab(live.env, state);
  const buttons = walk(tab, [], 'button');
  const labels = buttons.map((b) => b.textContent);
  assert.ok(labels.indexOf('Undo all meta cheats this session') !== -1);
  clickAll(tab, live, () => assert.deepStrictEqual(repairMeta(live.meta), live.meta), 'Paste save to restore');
  // Now paste a real save (the Copy button above may have filled the box, so set it after).
  walk(tab, [], 'textarea')[0].value = exportSave(defaultMeta(), freshRun(77));
  click(buttons.filter((b) => b.textContent === 'Paste save to restore')[0]);
  assert.deepStrictEqual(repairMeta(live.meta), live.meta);
  assert.ok(live.events.some((e) => e[1].what === 'import'));
  assert.strictEqual(live.run.seed, 77, 'the pasted run replaced the live run');
  assert.ok(live.metaSaves > 3);
});

test('META tab: a bad paste is refused and changes nothing', () => {
  const live = makeLive(null, defaultMeta());
  const tab = buildMetaTab(live.env, { snapshot: null });
  walk(tab, [], 'textarea')[0].value = 'garbage';
  const before = JSON.stringify(live.meta);
  const paste = walk(tab, [], 'button').filter((b) => b.textContent === 'Paste save to restore')[0];
  click(paste);
  assert.strictEqual(JSON.stringify(live.meta), before);
  assert.strictEqual(live.metaSaves, 0);
  assert.strictEqual(live.toasts[live.toasts.length - 1], 'That is not valid save text');
});

test('DEBUG tab: preview shows numbers, speed sends cheat:speed, quality sets the meta', () => {
  const run = freshRun(6);
  run.phase = 'build';
  const meta = defaultMeta();
  const live = makeLive(run, meta);
  let handler = null;
  const recorder = makeFireRecorder({ on: (n, f) => { handler = f; }, getRun: () => live.run });
  const tab = buildDebugTab(live.env, { recorder: recorder });
  const buttons = walk(tab, [], 'button');
  const byLabel = (text) => buttons.filter((b) => b.textContent === text)[0];
  click(byLabel('Preview Fire'));
  const pres = walk(tab, [], 'pre');
  assert.ok(pres[0].textContent.indexOf('total ') === 0, pres[0].textContent);
  assert.strictEqual(live.events.length, 0, 'preview sends no cheat:changed');
  assert.strictEqual(live.run.cheated, true);
  click(byLabel('Last Fire log'));
  assert.ok(pres[1].textContent.indexOf('No Fire seen') !== -1);
  const out = fire(live.run);
  handler({});
  click(byLabel('Last Fire log'));
  assert.ok(pres[1].textContent.indexOf('Last Fire (rebuilt)') === 0);
  assert.ok(out.ok);
  click(byLabel('Log of current board'));
  assert.ok(pres[1].textContent.indexOf('Current board (preview)') === 0);
  for (let i = 0; i < SPEEDS.length; i++) {
    click(byLabel(SPEEDS[i] === 'instant' ? 'Instant' : SPEEDS[i] + 'x'));
  }
  const speeds = live.events.filter((e) => e[0] === 'cheat:speed').map((e) => e[1].speed);
  assert.deepStrictEqual(speeds, SPEEDS);
  click(byLabel('high'));
  assert.strictEqual(live.meta.settings.quality, 'high');
  click(byLabel('Copy seed'));
  click(byLabel('Show seed'));
  click(byLabel('Copy run JSON'));
  assert.deepStrictEqual(repairMeta(live.meta), live.meta);
});
