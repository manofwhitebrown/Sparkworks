// Pure math: where the board and its cells go inside a container.
// Cells are always square. One half-cell is left on each side for the source and the vault.
// Owner: AI-6

export var FOOTER = 0.45;
// extra breathing room (in cells) split between the top and the bottom of the framed panel
export var VPAD = 0.3;

export function computeLayout(width, height, cols, rows) {
  var safeCols = Math.max(1, cols | 0);
  var safeRows = Math.max(1, rows | 0);
  var w = Math.max(1, width);
  var h = Math.max(1, height);
  // the grid is cols cells wide, plus a half cell on each side
  // a little room under the grid is kept for the running total of the vault
  var cell = Math.floor(Math.min(w / (safeCols + 1), h / (safeRows + FOOTER + VPAD)));
  if (cell < 1) {
    cell = 1;
  }
  var gridW = cell * safeCols;
  var gridH = cell * safeRows;
  var totalW = gridW + cell;
  var left = Math.floor((w - totalW) / 2) + Math.floor(cell / 2);
  // grid plus footer are centred vertically inside the panel
  var top = Math.floor((h - gridH - cell * FOOTER) / 2);
  return {
    cell: cell,
    cols: safeCols,
    rows: safeRows,
    gridX: left,
    gridY: top,
    gridW: gridW,
    gridH: gridH,
    width: w,
    height: h
  };
}

// Pixel center of a cell (x may be -1 for the source or cols for the vault).
export function cellCenter(layout, x, y) {
  return {
    px: layout.gridX + x * layout.cell + layout.cell / 2,
    py: layout.gridY + y * layout.cell + layout.cell / 2
  };
}

// Which cell is under a point (in canvas CSS pixels)? Returns null when outside the grid.
export function cellAtLocal(layout, localX, localY) {
  var gx = Math.floor((localX - layout.gridX) / layout.cell);
  var gy = Math.floor((localY - layout.gridY) / layout.cell);
  if (localX < layout.gridX || localY < layout.gridY) {
    return null;
  }
  if (gx < 0 || gy < 0 || gx >= layout.cols || gy >= layout.rows) {
    return null;
  }
  return { x: gx, y: gy };
}

export function clampDpr(dpr, maxDpr) {
  var d = Number(dpr);
  if (!(d >= 1)) {
    return 1;
  }
  return Math.min(d, maxDpr);
}
