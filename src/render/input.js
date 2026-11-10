// Pointer input for the board: tap, press-hold-drag, and "tap while playing = skip".
// Uses pointer events only. touch-action none is set on the canvas only.
// Owner: AI-6

var DRAG_START_PX = 8;

// handlers: { cellAt(clientX, clientY), hasPart(x, y), isPlaying(), onSkip(), onTap(x, y),
//             onDrag(fx, fy, tx, ty), onDragMove(info or null), }
export function attachInput(canvas, handlers) {
  var down = null;

  function local(e) {
    var rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onDown(e) {
    if (handlers.isPlaying()) {
      handlers.onSkip();
      return;
    }
    var cell = handlers.cellAt(e.clientX, e.clientY);
    down = { id: e.pointerId, cell: cell, sx: e.clientX, sy: e.clientY, dragging: false };
    if (canvas.setPointerCapture) {
      try { canvas.setPointerCapture(e.pointerId); } catch (err) { down.noCapture = true; }
    }
  }

  function onMove(e) {
    if (!down || e.pointerId !== down.id) { return; }
    var dx = e.clientX - down.sx;
    var dy = e.clientY - down.sy;
    if (!down.dragging) {
      var far = dx * dx + dy * dy > DRAG_START_PX * DRAG_START_PX;
      if (!far || !down.cell || !handlers.hasPart(down.cell.x, down.cell.y)) { return; }
      down.dragging = true;
    }
    var p = local(e);
    handlers.onDragMove({ fromX: down.cell.x, fromY: down.cell.y, px: p.x, py: p.y,
      target: handlers.cellAt(e.clientX, e.clientY) });
  }

  function onUp(e) {
    if (!down || e.pointerId !== down.id) { return; }
    var d = down;
    down = null;
    if (d.dragging) {
      handlers.onDragMove(null);
      var target = handlers.cellAt(e.clientX, e.clientY);
      if (target && (target.x !== d.cell.x || target.y !== d.cell.y)) {
        handlers.onDrag(d.cell.x, d.cell.y, target.x, target.y);
      }
      return;
    }
    var cell = handlers.cellAt(e.clientX, e.clientY);
    if (cell && d.cell && cell.x === d.cell.x && cell.y === d.cell.y) {
      handlers.onTap(cell.x, cell.y);
    }
  }

  function onCancel() {
    if (down && down.dragging) { handlers.onDragMove(null); }
    down = null;
  }

  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onCancel);

  return function detach() {
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onCancel);
  };
}
