// Overload twists: small rule changes applied to a COPY of the machine.
// Every twist uses only the rng it is given, so the same seed gives the same result.
// Owner: AI-3
import { partsWithTag } from './parts/index.js';

// Make sure machine.flags.twistNames exists, then add this twist's name.
function addTwistName(machine, name) {
  if (!machine.flags) {
    machine.flags = {};
  }
  if (!Array.isArray(machine.flags.twistNames)) {
    machine.flags.twistNames = [];
  }
  machine.flags.twistNames.push(name);
}

function isBlocked(machine, x, y) {
  for (let i = 0; i < machine.blocked.length; i++) {
    if (machine.blocked[i].x === x && machine.blocked[i].y === y) {
      return true;
    }
  }
  return false;
}

function holdsPart(machine, x, y) {
  for (let i = 0; i < machine.cells.length; i++) {
    if (machine.cells[i].x === x && machine.cells[i].y === y) {
      return true;
    }
  }
  return false;
}

// Block ONE random free cell. The source cell (0, sourceRow) is never chosen.
function blockRandomCell(machine, rng) {
  const free = [];
  for (let y = 0; y < machine.rows; y++) {
    for (let x = 0; x < machine.cols; x++) {
      const isSource = x === 0 && y === machine.sourceRow;
      if (!isSource && !isBlocked(machine, x, y) && !holdsPart(machine, x, y)) {
        free.push({ x: x, y: y });
      }
    }
  }
  if (free.length === 0) {
    return;
  }
  const pick = Math.min(Math.floor(rng() * free.length), free.length - 1);
  machine.blocked.push(free[pick]);
}

// Block every cell of ONE random row. The source row is never chosen, so sparks can still be born.
function blockRandomRow(machine, rng) {
  const rows = [];
  for (let y = 0; y < machine.rows; y++) {
    if (y !== machine.sourceRow) {
      rows.push(y);
    }
  }
  if (rows.length === 0) {
    return;
  }
  const pick = Math.min(Math.floor(rng() * rows.length), rows.length - 1);
  const y = rows[pick];
  for (let x = 0; x < machine.cols; x++) {
    if (!isBlocked(machine, x, y)) {
      machine.blocked.push({ x: x, y: y });
    }
  }
}

function banPart(machine, partId) {
  if (machine.banned.indexOf(partId) < 0) {
    machine.banned.push(partId);
  }
}

export const TWISTS = {
  deadCell: {
    id: 'deadCell',
    name: 'Dead Cell',
    description: 'One random cell is dead. Sparks that enter it fizzle.',
    apply(machine, rng) {
      blockRandomCell(machine, rng);
      addTwistName(machine, 'Dead Cell');
      return machine;
    }
  },
  twoDeadCells: {
    id: 'twoDeadCells',
    name: 'Two Dead Cells',
    description: 'Two random cells are dead. Sparks that enter them fizzle.',
    apply(machine, rng) {
      blockRandomCell(machine, rng);
      blockRandomCell(machine, rng);
      addTwistName(machine, 'Two Dead Cells');
      return machine;
    }
  },
  noSplit: {
    id: 'noSplit',
    name: 'No Splitting',
    description: 'All splitting parts are switched off this shift.',
    apply(machine) {
      const splitParts = partsWithTag('split');
      for (let i = 0; i < splitParts.length; i++) {
        banPart(machine, splitParts[i].id);
      }
      addTwistName(machine, 'No Splitting');
      return machine;
    }
  },
  fewerSparks: {
    id: 'fewerSparks',
    name: 'Fewer Sparks',
    description: 'The source sends one spark less.',
    apply(machine) {
      machine.sparkCount = Math.max(machine.sparkCount - 1, 1);
      addTwistName(machine, 'Fewer Sparks');
      return machine;
    }
  },
  rust: {
    id: 'rust',
    name: 'Rust',
    description: 'One kind of part you placed rusts and stops working this shift.',
    apply(machine, rng) {
      if (machine.cells.length > 0) {
        const index = Math.min(Math.floor(rng() * machine.cells.length), machine.cells.length - 1);
        banPart(machine, machine.cells[index].partId);
      }
      addTwistName(machine, 'Rust');
      return machine;
    }
  },
  coldStart: {
    id: 'coldStart',
    name: 'Cold Start',
    description: 'Sparks start at 0. Add before you multiply.',
    apply(machine) {
      machine.startValue = 0;
      addTwistName(machine, 'Cold Start');
      return machine;
    }
  },
  closedRow: {
    id: 'closedRow',
    name: 'Closed Row',
    description: 'One whole row is dead. Sparks cannot enter it.',
    apply(machine, rng) {
      blockRandomRow(machine, rng);
      addTwistName(machine, 'Closed Row');
      return machine;
    }
  },
  loneSpark: {
    id: 'loneSpark',
    name: 'Lone Spark',
    description: 'Only 1 spark this shift. It starts at 5.',
    apply(machine) {
      machine.sparkCount = 1;
      machine.startValue = 5;
      addTwistName(machine, 'Lone Spark');
      return machine;
    }
  },
  noMult: {
    id: 'noMult',
    name: 'No Multipliers',
    description: 'All multiplier parts are switched off this shift.',
    apply(machine) {
      const multParts = partsWithTag('mult');
      for (let i = 0; i < multParts.length; i++) {
        banPart(machine, multParts[i].id);
      }
      addTwistName(machine, 'No Multipliers');
      return machine;
    }
  }
};

export function getTwist(id) {
  if (Object.prototype.hasOwnProperty.call(TWISTS, id)) {
    return TWISTS[id];
  }
  return null;
}

// Run each twist in order. Unknown ids are ignored.
export function applyTwists(machine, twistIds, rng) {
  const ids = twistIds || [];
  for (let i = 0; i < ids.length; i++) {
    const twist = getTwist(ids[i]);
    if (twist) {
      twist.apply(machine, rng);
    }
  }
  return machine;
}
