// Shows a short message at the top of the screen, then fades it out.
// Owner: AI-7

let current = null;
let hideTimer = 0;

export function showToast(text) {
  const root = document.getElementById('app');
  if (!root) return;
  if (current) current.remove();
  clearTimeout(hideTimer);
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.setAttribute('role', 'status');
  toast.textContent = text;
  root.appendChild(toast);
  current = toast;
  // two frames so the browser sees the starting style first
  requestAnimationFrame(function () {
    requestAnimationFrame(function () { toast.classList.add('isShown'); });
  });
  hideTimer = setTimeout(function () {
    toast.classList.remove('isShown');
    setTimeout(function () { toast.remove(); }, 260);
  }, 1800);
}
