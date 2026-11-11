// Pure math for the path preview: turns the list of cells the source sparks will enter into
// line segments (between neighbouring cells) and one arrow per segment. No drawing here.
// Owner: AI-6

var DIRS = { right: [1, 0], down: [0, 1], left: [-1, 0], up: [0, -1] };

// cells: [{ x, y }, ...] in the order the sparks entered them (all source sparks, one after another).
// Returns { segments: [{ x1, y1, x2, y2, dir }], startsAtSource: boolean }.
// - the same cell twice in a row is ignored (a part that was entered twice),
// - cells that are not neighbours make a gap (the next source spark starts again at the left),
// - the same step is only listed once, so three sparks on one road draw one line.
export function buildPreview(cells) {
  var segments = [];
  var seen = {};
  var startsAtSource = false;
  if (!Array.isArray(cells) || cells.length === 0) { return { segments: segments, startsAtSource: false }; }
  var first = cells[0];
  if (first && first.x === 0) { startsAtSource = true; }
  for (var i = 0; i + 1 < cells.length; i++) {
    var a = cells[i];
    var b = cells[i + 1];
    if (!a || !b) { continue; }
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    if (Math.abs(dx) + Math.abs(dy) !== 1) { continue; }
    var key = a.x + ',' + a.y + '>' + b.x + ',' + b.y;
    if (seen[key]) { continue; }
    seen[key] = true;
    var dir = dx === 1 ? 'right' : (dx === -1 ? 'left' : (dy === 1 ? 'down' : 'up'));
    segments.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, dir: dir });
  }
  return { segments: segments, startsAtSource: startsAtSource };
}

// Unit vector of a direction name (for the arrows).
export function dirVector(dir) {
  return DIRS[dir] || DIRS.right;
}
