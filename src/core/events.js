// Tiny publish/subscribe. Screens and the tutorial talk through this. Owner: AI-1

// name -> array of listener functions
const listeners = {};

export function on(name, fn) {
  if (typeof fn !== 'function') return;
  if (!listeners[name]) listeners[name] = [];
  listeners[name].push(fn);
}

export function off(name, fn) {
  const list = listeners[name];
  if (!list) return;
  const index = list.indexOf(fn);
  if (index >= 0) list.splice(index, 1);
}

export function emit(name, data) {
  const list = listeners[name];
  if (!list) return;
  // Copy the list first: a listener may call off() while we are looping.
  const copy = list.slice();
  for (let i = 0; i < copy.length; i++) {
    try {
      copy[i](data);
    } catch (err) {
      // One broken listener must never stop the others.
      console.error('Listener for "' + name + '" threw:', err);
    }
  }
}
