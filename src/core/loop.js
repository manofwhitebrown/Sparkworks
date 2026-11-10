// The ONE requestAnimationFrame loop of the whole app. Owner: AI-1
//
// startLoop(callback) adds a callback that gets dt (seconds since the last frame).
// Calling it again with a DIFFERENT callback adds that one too (still one frame loop);
// calling it again with the SAME callback does nothing. stopLoop() stops everything.

const MAX_DT = 0.1; // a hidden tab must not cause a big jump

let callbacks = [];
let running = false;
let handle = 0;
let lastTime = 0;

function frame(now) {
  if (!running) return;
  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (!(dt > 0)) dt = 0;
  if (dt > MAX_DT) dt = MAX_DT;
  for (let i = 0; i < callbacks.length; i++) {
    try {
      callbacks[i](dt);
    } catch (err) {
      console.error('Loop callback threw:', err);
    }
  }
  if (running) handle = requestAnimationFrame(frame);
}

export function startLoop(callback) {
  if (typeof callback === 'function' && callbacks.indexOf(callback) < 0) {
    callbacks.push(callback);
  }
  if (running) return;
  running = true;
  lastTime = performance.now();
  handle = requestAnimationFrame(frame);
}

export function stopLoop() {
  running = false;
  callbacks = [];
  if (handle) cancelAnimationFrame(handle);
  handle = 0;
}
