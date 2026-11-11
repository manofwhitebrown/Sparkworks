// One small drawing function per part id. Each draws inside a square of size s
// centered at (cx, cy), using the stroke color already set on the context.
// Owner: AI-6

function line(ctx, x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function circle(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (fill) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

function poly(ctx, points, fill) {
  ctx.beginPath();
  ctx.moveTo(points[0], points[1]);
  for (var i = 2; i < points.length; i += 2) {
    ctx.lineTo(points[i], points[i + 1]);
  }
  ctx.closePath();
  if (fill) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

function arrowHead(ctx, x, y, d, size) {
  // d: 0 right, 1 down, 2 left, 3 up
  var a = d * Math.PI / 2;
  var ca = Math.cos(a);
  var sa = Math.sin(a);
  ctx.beginPath();
  ctx.moveTo(x - ca * size - sa * size, y - sa * size + ca * size);
  ctx.lineTo(x, y);
  ctx.lineTo(x - ca * size + sa * size, y - sa * size - ca * size);
  ctx.stroke();
}

export var SHAPES = {
  coil: function (ctx, cx, cy, s) {
    var u = s / 2;
    ctx.beginPath();
    ctx.moveTo(cx - u * 0.8, cy);
    for (var i = 0; i < 3; i++) {
      var x0 = cx - u * 0.6 + i * u * 0.6;
      ctx.arc(x0 + u * 0.3, cy, u * 0.3, Math.PI, 0, false);
      ctx.arc(x0 + u * 0.3, cy, u * 0.3, 0, Math.PI, false);
    }
    ctx.stroke();
    line(ctx, cx + u * 0.8, cy, cx + u * 0.95, cy);
  },
  dynamo: function (ctx, cx, cy, s) {
    circle(ctx, cx, cy, s * 0.4, false);
    poly(ctx, [cx + s * 0.05, cy - s * 0.26, cx - s * 0.14, cy + s * 0.04, cx, cy + s * 0.04,
      cx - s * 0.05, cy + s * 0.26, cx + s * 0.14, cy - s * 0.04, cx, cy - s * 0.04], true);
  },
  ember: function (ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - s * 0.42);
    ctx.quadraticCurveTo(cx + s * 0.42, cy + s * 0.02, cx + s * 0.2, cy + s * 0.3);
    ctx.quadraticCurveTo(cx, cy + s * 0.48, cx - s * 0.2, cy + s * 0.3);
    ctx.quadraticCurveTo(cx - s * 0.42, cy + s * 0.02, cx, cy - s * 0.42);
    ctx.stroke();
    circle(ctx, cx, cy + s * 0.18, s * 0.1, true);
  },
  amplifier: function (ctx, cx, cy, s) {
    poly(ctx, [cx - s * 0.4, cy - s * 0.12, cx - s * 0.4, cy + s * 0.12, cx + s * 0.1, cy + s * 0.4,
      cx + s * 0.1, cy - s * 0.4], false);
    line(ctx, cx + s * 0.28, cy - s * 0.12, cx + s * 0.28, cy + s * 0.12);
    line(ctx, cx + s * 0.16, cy, cx + s * 0.4, cy);
  },
  compounder: function (ctx, cx, cy, s) {
    circle(ctx, cx, cy, s * 0.4, false);
    line(ctx, cx - s * 0.17, cy - s * 0.17, cx + s * 0.17, cy + s * 0.17);
    line(ctx, cx + s * 0.17, cy - s * 0.17, cx - s * 0.17, cy + s * 0.17);
  },
  overdrive: function (ctx, cx, cy, s) {
    arrowHead(ctx, cx + s * 0.02, cy, 0, s * 0.3);
    arrowHead(ctx, cx + s * 0.38, cy, 0, s * 0.3);
    line(ctx, cx - s * 0.4, cy, cx + s * 0.3, cy);
  },
  bend: function (ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.4, cy - s * 0.22);
    ctx.lineTo(cx + s * 0.2, cy - s * 0.22);
    ctx.lineTo(cx + s * 0.2, cy + s * 0.36);
    ctx.stroke();
    arrowHead(ctx, cx + s * 0.2, cy + s * 0.4, 1, s * 0.2);
  },
  switch: function (ctx, cx, cy, s) {
    circle(ctx, cx - s * 0.3, cy + s * 0.15, s * 0.08, true);
    circle(ctx, cx + s * 0.3, cy + s * 0.15, s * 0.08, true);
    line(ctx, cx - s * 0.3, cy + s * 0.15, cx + s * 0.18, cy - s * 0.3);
    line(ctx, cx - s * 0.4, cy + s * 0.15, cx - s * 0.2, cy + s * 0.15);
  },
  reverser: function (ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.3, cy + s * 0.35);
    ctx.lineTo(cx + s * 0.3, cy - s * 0.1);
    ctx.arc(cx, cy - s * 0.1, s * 0.3, 0, Math.PI, true);
    ctx.lineTo(cx - s * 0.3, cy + s * 0.2);
    ctx.stroke();
    arrowHead(ctx, cx - s * 0.3, cy + s * 0.38, 1, s * 0.18);
  },
  splitter: function (ctx, cx, cy, s) {
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.4, cy);
    ctx.lineTo(cx - s * 0.05, cy);
    ctx.lineTo(cx + s * 0.35, cy - s * 0.3);
    ctx.moveTo(cx - s * 0.05, cy);
    ctx.lineTo(cx + s * 0.35, cy + s * 0.3);
    ctx.stroke();
    circle(ctx, cx + s * 0.38, cy - s * 0.3, s * 0.07, true);
    circle(ctx, cx + s * 0.38, cy + s * 0.3, s * 0.07, true);
  },
  triplet: function (ctx, cx, cy, s) {
    for (var i = -1; i <= 1; i++) {
      line(ctx, cx - s * 0.35, cy, cx + s * 0.25, cy + i * s * 0.3);
      circle(ctx, cx + s * 0.32, cy + i * s * 0.3, s * 0.07, true);
    }
  },
  capacitor: function (ctx, cx, cy, s) {
    line(ctx, cx - s * 0.4, cy, cx - s * 0.1, cy);
    line(ctx, cx + s * 0.1, cy, cx + s * 0.4, cy);
    line(ctx, cx - s * 0.1, cy - s * 0.3, cx - s * 0.1, cy + s * 0.3);
    line(ctx, cx + s * 0.1, cy - s * 0.3, cx + s * 0.1, cy + s * 0.3);
  },
  counter: function (ctx, cx, cy, s) {
    for (var i = -1; i <= 1; i++) {
      circle(ctx, cx + i * s * 0.28, cy, s * 0.1, i === -1);
    }
    line(ctx, cx - s * 0.4, cy + s * 0.28, cx + s * 0.4, cy + s * 0.28);
  },
  anvil: function (ctx, cx, cy, s) {
    poly(ctx, [cx - s * 0.42, cy - s * 0.3, cx + s * 0.4, cy - s * 0.3, cx + s * 0.22, cy - s * 0.1,
      cx + s * 0.1, cy - s * 0.1, cx + s * 0.16, cy + s * 0.2, cx + s * 0.3, cy + s * 0.34,
      cx - s * 0.3, cy + s * 0.34, cx - s * 0.16, cy + s * 0.2, cx - s * 0.1, cy - s * 0.1], false);
  },
  flywheel: function (ctx, cx, cy, s) {
    circle(ctx, cx, cy, s * 0.4, false);
    circle(ctx, cx, cy, s * 0.08, true);
    for (var i = 0; i < 4; i++) {
      var a = i * Math.PI / 2 + Math.PI / 4;
      line(ctx, cx + Math.cos(a) * s * 0.1, cy + Math.sin(a) * s * 0.1,
        cx + Math.cos(a) * s * 0.38, cy + Math.sin(a) * s * 0.38);
    }
  },
  battery: function (ctx, cx, cy, s) {
    ctx.strokeRect(cx - s * 0.38, cy - s * 0.22, s * 0.7, s * 0.44);
    ctx.fillRect(cx + s * 0.32, cy - s * 0.1, s * 0.08, s * 0.2);
    line(ctx, cx - s * 0.2, cy, cx + s * 0.02, cy);
    line(ctx, cx - s * 0.09, cy - s * 0.11, cx - s * 0.09, cy + s * 0.11);
  },
  gambler: function (ctx, cx, cy, s) {
    ctx.strokeRect(cx - s * 0.36, cy - s * 0.36, s * 0.72, s * 0.72);
    circle(ctx, cx - s * 0.18, cy - s * 0.18, s * 0.06, true);
    circle(ctx, cx, cy, s * 0.06, true);
    circle(ctx, cx + s * 0.18, cy + s * 0.18, s * 0.06, true);
  },
  fuse: function (ctx, cx, cy, s) {
    ctx.strokeRect(cx - s * 0.3, cy - s * 0.16, s * 0.6, s * 0.32);
    line(ctx, cx - s * 0.42, cy, cx - s * 0.3, cy);
    line(ctx, cx + s * 0.3, cy, cx + s * 0.42, cy);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.22, cy);
    ctx.lineTo(cx - s * 0.08, cy - s * 0.08);
    ctx.lineTo(cx + s * 0.08, cy + s * 0.08);
    ctx.lineTo(cx + s * 0.22, cy);
    ctx.stroke();
  },
  rectifier: function (ctx, cx, cy, s) {
    poly(ctx, [cx - s * 0.25, cy - s * 0.3, cx - s * 0.25, cy + s * 0.3, cx + s * 0.2, cy], false);
    line(ctx, cx + s * 0.28, cy - s * 0.3, cx + s * 0.28, cy + s * 0.3);
    line(ctx, cx - s * 0.42, cy, cx - s * 0.25, cy);
    line(ctx, cx + s * 0.28, cy, cx + s * 0.42, cy);
  },
  tollgate: function (ctx, cx, cy, s) {
    line(ctx, cx - s * 0.32, cy + s * 0.36, cx - s * 0.32, cy - s * 0.36);
    line(ctx, cx + s * 0.32, cy + s * 0.36, cx + s * 0.32, cy - s * 0.36);
    line(ctx, cx - s * 0.32, cy - s * 0.2, cx + s * 0.32, cy - s * 0.2);
    circle(ctx, cx, cy + s * 0.08, s * 0.14, false);
  },
  // ---- round 4: the new parts. Only simple strokes (readable at 25 px). ----
  spring: function (ctx, cx, cy, s) {
    // a zig-zag spring that ends in a turn DOWN: adds and turns
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.42, cy - s * 0.18);
    ctx.lineTo(cx - s * 0.3, cy - s * 0.32);
    ctx.lineTo(cx - s * 0.16, cy - s * 0.04);
    ctx.lineTo(cx - s * 0.02, cy - s * 0.32);
    ctx.lineTo(cx + s * 0.12, cy - s * 0.04);
    ctx.lineTo(cx + s * 0.26, cy - s * 0.18);
    ctx.lineTo(cx + s * 0.26, cy + s * 0.34);
    ctx.stroke();
    arrowHead(ctx, cx + s * 0.26, cy + s * 0.4, 1, s * 0.18);
  },
  sideamp: function (ctx, cx, cy, s) {
    // a two-way vertical arrow and a times sign: multiplies when moving UP or DOWN
    line(ctx, cx - s * 0.2, cy - s * 0.36, cx - s * 0.2, cy + s * 0.36);
    arrowHead(ctx, cx - s * 0.2, cy - s * 0.4, 3, s * 0.18);
    arrowHead(ctx, cx - s * 0.2, cy + s * 0.4, 1, s * 0.18);
    line(ctx, cx + s * 0.12, cy - s * 0.14, cx + s * 0.38, cy + s * 0.12);
    line(ctx, cx + s * 0.38, cy - s * 0.14, cx + s * 0.12, cy + s * 0.12);
  },
  bouncer: function (ctx, cx, cy, s) {
    // a ball and a bouncing path that goes up and down
    circle(ctx, cx - s * 0.32, cy + s * 0.28, s * 0.1, true);
    ctx.beginPath();
    ctx.moveTo(cx - s * 0.32, cy + s * 0.28);
    ctx.lineTo(cx - s * 0.1, cy - s * 0.3);
    ctx.lineTo(cx + s * 0.12, cy + s * 0.3);
    ctx.lineTo(cx + s * 0.32, cy - s * 0.2);
    ctx.stroke();
    arrowHead(ctx, cx + s * 0.36, cy - s * 0.28, 3, s * 0.16);
  },
  workbench: function (ctx, cx, cy, s) {
    // a bench with a coin on it
    line(ctx, cx - s * 0.42, cy + s * 0.04, cx + s * 0.42, cy + s * 0.04);
    line(ctx, cx - s * 0.32, cy + s * 0.04, cx - s * 0.32, cy + s * 0.38);
    line(ctx, cx + s * 0.32, cy + s * 0.04, cx + s * 0.32, cy + s * 0.38);
    circle(ctx, cx, cy - s * 0.2, s * 0.14, false);
    line(ctx, cx, cy - s * 0.28, cx, cy - s * 0.12);
  },
  jackpot: function (ctx, cx, cy, s) {
    // a four-point burst with a dot in the middle
    poly(ctx, [cx, cy - s * 0.44, cx + s * 0.1, cy - s * 0.1, cx + s * 0.44, cy, cx + s * 0.1, cy + s * 0.1,
      cx, cy + s * 0.44, cx - s * 0.1, cy + s * 0.1, cx - s * 0.44, cy, cx - s * 0.1, cy - s * 0.1], false);
    circle(ctx, cx, cy, s * 0.06, true);
  },
  finisher: function (ctx, cx, cy, s) {
    // a flag on the RIGHT side with a bar at the edge: only works in the last column
    line(ctx, cx + s * 0.38, cy - s * 0.4, cx + s * 0.38, cy + s * 0.4);
    ctx.strokeRect(cx - s * 0.12, cy - s * 0.4, s * 0.5, s * 0.34);
    ctx.fillRect(cx - s * 0.12, cy - s * 0.4, s * 0.25, s * 0.17);
    ctx.fillRect(cx + s * 0.13, cy - s * 0.23, s * 0.25, s * 0.17);
    line(ctx, cx - s * 0.4, cy + s * 0.3, cx + s * 0.2, cy + s * 0.3);
  },
  starter: function (ctx, cx, cy, s) {
    // the same flag on the LEFT side: only works in the first column
    line(ctx, cx - s * 0.38, cy - s * 0.4, cx - s * 0.38, cy + s * 0.4);
    ctx.strokeRect(cx - s * 0.38, cy - s * 0.4, s * 0.5, s * 0.34);
    ctx.fillRect(cx - s * 0.38, cy - s * 0.4, s * 0.25, s * 0.17);
    ctx.fillRect(cx - s * 0.13, cy - s * 0.23, s * 0.25, s * 0.17);
    line(ctx, cx - s * 0.2, cy + s * 0.3, cx + s * 0.4, cy + s * 0.3);
  },
  portal: function (ctx, cx, cy, s) {
    // two nested ovals (a doorway) and a dot: a pair of these links two cells
    var a = s * 0.2;
    var b = s * 0.42;
    ctx.beginPath();
    ctx.moveTo(cx, cy - b);
    ctx.quadraticCurveTo(cx + a * 2, cy, cx, cy + b);
    ctx.quadraticCurveTo(cx - a * 2, cy, cx, cy - b);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy - b * 0.55);
    ctx.quadraticCurveTo(cx + a * 1.1, cy, cx, cy + b * 0.55);
    ctx.quadraticCurveTo(cx - a * 1.1, cy, cx, cy - b * 0.55);
    ctx.stroke();
    circle(ctx, cx, cy, s * 0.05, true);
  }
};
