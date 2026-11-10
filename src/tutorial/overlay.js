// The tutorial overlay: a dim layer, a spotlight ring around the target, and a text box.
// The layer lets taps through, so the player does the real action. Only the text box takes taps.
// The spotlight is moved with transform and opacity only (its size is set once per step).
// It is attached to document.body (fixed), because screens clear #app every time they change.
// Owner: AI-8

const BOX_STYLE = 'position:fixed;left:12px;right:12px;max-width:456px;margin:0 auto;padding:14px 16px;border-radius:14px;' +
  'background:#1C2432;color:#E8EDF5;border:1px solid #4FD1C5;font:16px/1.4 system-ui,sans-serif;' +
  'pointer-events:auto;';
const BUTTON_STYLE = 'min-height:44px;min-width:88px;padding:0 14px;border-radius:10px;border:0;' +
  'font:600 15px system-ui,sans-serif;cursor:pointer;';

function makeButton(label, accent, onClick) {
  const button = document.createElement('button');
  button.textContent = label;
  button.style.cssText = BUTTON_STYLE + (accent
    ? 'background:#4FD1C5;color:#0B0E14;'
    : 'background:transparent;color:#8A97AD;');
  button.addEventListener('click', onClick);
  return button;
}

// callbacks: { onGotIt(), onSkip() }
export function createOverlay(root, callbacks) {
  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;pointer-events:none;z-index:900;';
  const spot = document.createElement('div');
  spot.style.cssText = 'position:fixed;left:0;top:0;opacity:0;border-radius:12px;' +
    'border:2px solid #FFC857;box-shadow:0 0 0 4000px rgba(11,14,20,0.62);' +
    'transition:opacity 0.2s;will-change:transform;pointer-events:none;';
  const box = document.createElement('div');
  box.style.cssText = BOX_STYLE;
  const message = document.createElement('div');
  message.style.cssText = 'margin-bottom:10px;';
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;';
  const skip = makeButton('Skip tutorial', false, callbacks.onSkip);
  const gotIt = makeButton('Got it', true, callbacks.onGotIt);
  row.appendChild(skip);
  row.appendChild(gotIt);
  box.appendChild(message);
  box.appendChild(row);
  layer.appendChild(spot);
  layer.appendChild(box);
  root.appendChild(layer);

  return {
    // text, target (element or null), showButton (false while waiting for the player)
    showStep(text, target, showButton) {
      message.textContent = text;
      gotIt.style.display = showButton ? '' : 'none';
      this.moveSpotlight(target);
      this.placeBox(target);
    },
    moveSpotlight(target) {
      if (!target) {
        spot.style.opacity = '0';
        return;
      }
      const rect = target.getBoundingClientRect();
      const pad = 6;
      spot.style.width = Math.round(rect.width + pad * 2) + 'px';
      spot.style.height = Math.round(rect.height + pad * 2) + 'px';
      const x = Math.round(rect.left - pad);
      const y = Math.round(rect.top - pad);
      spot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      spot.style.opacity = '1';
    },
    // Put the text box on the half of the screen that the target is NOT in.
    placeBox(target) {
      box.style.top = '';
      box.style.bottom = '';
      let atTop = false;
      if (target) {
        const rect = target.getBoundingClientRect();
        atTop = rect.top > window.innerHeight / 2;
      }
      if (atTop) {
        box.style.top = 'calc(env(safe-area-inset-top, 0px) + 12px)';
      } else {
        box.style.bottom = 'calc(env(safe-area-inset-bottom, 0px) + 12px)';
      }
    },
    destroy() {
      if (layer.parentNode) {
        layer.parentNode.removeChild(layer);
      }
    }
  };
}
