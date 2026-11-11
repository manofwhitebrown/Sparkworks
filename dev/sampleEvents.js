// Hand-written event logs (section 7 of the contract) for the render demo page.
// The sample machine has a splitter at (2,1), a bend at (2,2), a tollgate at (4,1).
// Owner: AI-6

function makeLog() {
  var events = [];
  return {
    events: events,
    add: function (e) {
      e.n = events.length;
      events.push(e);
    }
  };
}

// Spark ids follow creation order like the real engine (a child gets its id at split time).
// Sample fire: 3 sparks along row 1, a split, a turn, coins, a disable, a fizzle, banks.
export function sampleEvents() {
  var log = makeLog();
  var add = log.add;
  // spark 1: straight through the row
  add({ type: 'spawn', spark: 1, x: 0, y: 1, dir: 'right', value: 1, parent: 0 });
  add({ type: 'enter', spark: 1, x: 0, y: 1, dir: 'right', value: 1 });
  add({ type: 'value', spark: 1, x: 0, y: 1, partId: 'coil', before: 1, after: 4, label: '+3' });
  add({ type: 'enter', spark: 1, x: 1, y: 1, dir: 'right', value: 4 });
  add({ type: 'value', spark: 1, x: 1, y: 1, partId: 'amplifier', before: 4, after: 8, label: 'x2' });
  add({ type: 'enter', spark: 1, x: 2, y: 1, dir: 'right', value: 8 });
  add({ type: 'state', spark: 1, x: 2, y: 1, partId: 'splitter', label: '1/3' });
  add({ type: 'enter', spark: 1, x: 3, y: 1, dir: 'right', value: 8 });
  add({ type: 'value', spark: 1, x: 3, y: 1, partId: 'compounder', before: 8, after: 16, label: 'x2' });
  add({ type: 'enter', spark: 1, x: 4, y: 1, dir: 'right', value: 16 });
  add({ type: 'coins', spark: 1, x: 4, y: 1, partId: 'tollgate', amount: 2 });
  add({ type: 'bank', spark: 1, value: 16, runningTotal: 16 });
  // spark 2: splits at the splitter, the child turns at the bend and banks on row 2
  add({ type: 'spawn', spark: 2, x: 0, y: 1, dir: 'right', value: 1, parent: 0 });
  add({ type: 'enter', spark: 2, x: 0, y: 1, dir: 'right', value: 1 });
  add({ type: 'value', spark: 2, x: 0, y: 1, partId: 'coil', before: 1, after: 4, label: '+3' });
  add({ type: 'enter', spark: 2, x: 1, y: 1, dir: 'right', value: 4 });
  add({ type: 'value', spark: 2, x: 1, y: 1, partId: 'amplifier', before: 4, after: 8, label: 'x2' });
  add({ type: 'enter', spark: 2, x: 2, y: 1, dir: 'right', value: 8 });
  add({ type: 'split', spark: 2, x: 2, y: 1, partId: 'splitter', child: 3, dir: 'down', value: 8, label: 'split' });
  add({ type: 'enter', spark: 2, x: 3, y: 1, dir: 'right', value: 8 });
  add({ type: 'value', spark: 2, x: 3, y: 1, partId: 'compounder', before: 8, after: 16, label: 'x2' });
  add({ type: 'enter', spark: 2, x: 4, y: 1, dir: 'right', value: 16 });
  add({ type: 'coins', spark: 2, x: 4, y: 1, partId: 'tollgate', amount: 2 });
  add({ type: 'bank', spark: 2, value: 16, runningTotal: 32 });
  add({ type: 'spawn', spark: 3, x: 2, y: 1, dir: 'down', value: 8, parent: 2 });
  add({ type: 'enter', spark: 3, x: 2, y: 2, dir: 'down', value: 8 });
  add({ type: 'turn', spark: 3, x: 2, y: 2, partId: 'bend', from: 'down', to: 'right' });
  add({ type: 'enter', spark: 3, x: 3, y: 2, dir: 'right', value: 8 });
  add({ type: 'value', spark: 3, x: 3, y: 2, partId: 'overdrive', before: 8, after: 240, label: 'x30' });
  add({ type: 'enter', spark: 3, x: 4, y: 2, dir: 'right', value: 240 });
  add({ type: 'value', spark: 3, x: 4, y: 2, partId: 'flywheel', before: 240, after: 1920, label: 'x8' });
  add({ type: 'bank', spark: 3, value: 1920, runningTotal: 1952 });
  // spark 3: the compounder burns out, the child goes up and fizzles at the edge
  add({ type: 'spawn', spark: 4, x: 0, y: 1, dir: 'right', value: 1, parent: 0 });
  add({ type: 'enter', spark: 4, x: 0, y: 1, dir: 'right', value: 1 });
  add({ type: 'value', spark: 4, x: 0, y: 1, partId: 'coil', before: 1, after: 4, label: '+3' });
  add({ type: 'enter', spark: 4, x: 1, y: 1, dir: 'right', value: 4 });
  add({ type: 'value', spark: 4, x: 1, y: 1, partId: 'amplifier', before: 4, after: 8, label: 'x2' });
  add({ type: 'enter', spark: 4, x: 2, y: 1, dir: 'right', value: 8 });
  add({ type: 'split', spark: 4, x: 2, y: 1, partId: 'splitter', child: 5, dir: 'up', value: 8, label: 'split' });
  add({ type: 'enter', spark: 4, x: 3, y: 1, dir: 'right', value: 8 });
  add({ type: 'disable', spark: 4, x: 3, y: 1, partId: 'compounder' });
  add({ type: 'enter', spark: 4, x: 4, y: 1, dir: 'right', value: 8 });
  add({ type: 'bank', spark: 4, value: 8, runningTotal: 1960 });
  add({ type: 'spawn', spark: 5, x: 2, y: 1, dir: 'up', value: 8, parent: 4 });
  add({ type: 'enter', spark: 5, x: 2, y: 0, dir: 'up', value: 8 });
  add({ type: 'fizzle', spark: 5, x: 2, y: 0, value: 8, reason: 'edge' });
  add({ type: 'end', spark: 0, total: 1960, coins: 4 });
  return log.events;
}

// A short fire that runs into a blocked cell at (2,1) (the demo's "fake blocked cells").
export function blockedEvents() {
  var log = makeLog();
  var add = log.add;
  add({ type: 'spawn', spark: 1, x: 0, y: 1, dir: 'right', value: 1, parent: 0 });
  add({ type: 'enter', spark: 1, x: 0, y: 1, dir: 'right', value: 1 });
  add({ type: 'value', spark: 1, x: 0, y: 1, partId: 'coil', before: 1, after: 4, label: '+3' });
  add({ type: 'enter', spark: 1, x: 1, y: 1, dir: 'right', value: 4 });
  add({ type: 'blocked', spark: 1, x: 2, y: 1 });
  add({ type: 'fizzle', spark: 1, x: 2, y: 1, value: 4, reason: 'blocked' });
  add({ type: 'end', spark: 0, total: 0, coins: 0 });
  return log.events;
}

// Big fire: exactly 500 events (45 sparks, values grow fast so huge numbers are tested too).
export function bigEvents() {
  var log = makeLog();
  var add = log.add;
  var total = 0;
  var sparks = 45;
  for (var s = 1; s <= sparks; s++) {
    var v = 1;
    add({ type: 'spawn', spark: s, x: 0, y: 1, dir: 'right', value: 1, parent: 0 });
    for (var x = 0; x < 5; x++) {
      add({ type: 'enter', spark: s, x: x, y: 1, dir: 'right', value: v });
      if (x < 4) {
        var after = v * (x % 2 === 0 ? 3 : 2) + s;
        add({ type: 'value', spark: s, x: x, y: 1, partId: 'coil', before: v, after: after, label: 'x' + (x + 2) });
        v = after;
      }
      // extra note events so that the log has exactly 500 events at the end
      if (x === 2 && s <= 4) {
        add({ type: 'state', spark: s, x: x, y: 1, partId: 'counter', label: s + '/4' });
      }
    }
    total = total + v;
    add({ type: 'bank', spark: s, value: v, runningTotal: total });
  }
  add({ type: 'end', spark: 0, total: total, coins: 0 });
  return log.events;
}
