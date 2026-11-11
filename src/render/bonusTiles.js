// Pure helpers for bonus floor tiles (contract 23): the label text and which cells have a bonus.
// Owner: AI-6

// "+3" for an add tile, "x2" for a multiply tile. Never throws; unknown input gives ''.
export function bonusLabel(bonus) {
  if (!bonus || typeof bonus.amount !== 'number' || !isFinite(bonus.amount)) { return ''; }
  var n = Math.round(bonus.amount * 100) / 100;
  if (bonus.kind === 'mult') { return 'x' + n; }
  if (bonus.kind === 'add') { return '+' + n; }
  return '';
}

// The bonus of one cell, or null.
export function bonusAt(machine, x, y) {
  var list = machine && Array.isArray(machine.bonusCells) ? machine.bonusCells : [];
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].x === x && list[i].y === y) { return list[i]; }
  }
  return null;
}
