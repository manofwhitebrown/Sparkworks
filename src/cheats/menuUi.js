// Small builders for the cheat menu screens: elements, buttons, rows, sections, copy.
// Only plain DOM calls, so a tiny fake DOM is enough to test the tabs.
// Owner: AI-2

export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text;
  }
  return node;
}

// options.on: show it as selected. options.go: the bright "do it" style.
export function button(label, onClick, options) {
  const o = options || {};
  const node = el('button', 'ckx-btn' + (o.on ? ' ckx-on' : '') + (o.go ? ' ckx-go' : ''), label);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}

export function row(items) {
  const box = el('div', 'ckx-row');
  for (let i = 0; i < items.length; i++) {
    box.appendChild(items[i]);
  }
  return box;
}

export function section(title, items) {
  const box = el('div', 'ckx-sec');
  box.appendChild(el('h3', '', title));
  for (let i = 0; i < items.length; i++) {
    box.appendChild(items[i]);
  }
  return box;
}

// A <select> with one option per { value, label }.
export function makeSelect(choices) {
  const select = el('select', 'ckx-sel');
  for (let i = 0; i < choices.length; i++) {
    const option = el('option', '', choices[i].label);
    option.value = choices[i].value;
    select.appendChild(option);
  }
  return select;
}

// Copies text. Tries the clipboard API, then the old textarea way. Calls done(true or false).
export function copyText(text, done) {
  function fallback() {
    const area = el('textarea');
    area.value = text;
    document.body.appendChild(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    area.remove();
    done(ok);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () {
      done(true);
    }, fallback);
    return;
  }
  fallback();
}
