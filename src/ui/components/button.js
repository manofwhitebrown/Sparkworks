// STUB: owned by AI-7. The owner will replace this whole file.
export function makeButton(label, onClick, options) {
  const el = document.createElement('button');
  el.textContent = label;
  el.addEventListener('click', onClick);
  return el;
}
