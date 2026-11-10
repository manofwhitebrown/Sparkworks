// Opens a centered dialog. Closes on backdrop tap and on the Back button.
// Owner: AI-7

let openCount = 0;

export function isModalOpen() { return openCount > 0; }

// options: { onClose }
export function openModal(contentElement, options) {
  const opts = options || {};
  const root = document.getElementById('app');
  const backdrop = document.createElement('div');
  backdrop.className = 'modalBackdrop';
  const box = document.createElement('div');
  box.className = 'modalBox';
  box.setAttribute('role', 'dialog');
  box.appendChild(contentElement);
  backdrop.appendChild(box);
  root.appendChild(backdrop);
  openCount += 1;

  let closed = false;
  history.pushState({ modal: true }, '');

  function finish() {
    if (closed) return;
    closed = true;
    openCount -= 1;
    window.removeEventListener('popstate', onPop);
    backdrop.classList.remove('isShown');
    setTimeout(function () { backdrop.remove(); }, 240);
    if (opts.onClose) opts.onClose();
  }
  function onPop() { finish(); }
  window.addEventListener('popstate', onPop);

  function close() {
    if (closed) return;
    // history.back() fires popstate, which calls finish()
    history.back();
  }
  backdrop.addEventListener('click', function (event) {
    if (event.target === backdrop) close();
  });
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { backdrop.classList.add('isShown'); });
  });
  return { close: close };
}
