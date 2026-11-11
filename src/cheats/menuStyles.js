// The look of the cheat menu. One <style> element, added from JavaScript (no .css import, so
// the menu stays a separate small chunk). Uses the game's CSS variables with palette fallbacks.
// Owner: AI-2

const CSS = [
  '.ckx{width:min(480px,100vw);height:100%;display:flex;flex-direction:column;box-sizing:border-box;',
  'background:var(--bg,#0B0E14);color:var(--text,#E8EDF5);font:14px/1.35 Inter,system-ui,sans-serif}',
  '.ckx-head{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--line,#2A3446)}',
  '.ckx-warn{flex:1;font-size:12px;color:var(--bad,#FF6B6B)}',
  '.ckx-tabs{display:flex;border-bottom:1px solid var(--line,#2A3446)}',
  '.ckx-tab{flex:1;min-height:44px;border:0;background:transparent;color:var(--textDim,#8A97AD);',
  'font:600 13px Inter,system-ui,sans-serif;letter-spacing:.06em;border-bottom:2px solid transparent;cursor:pointer}',
  '.ckx-tab[aria-selected="true"]{color:var(--spark,#FFC857);border-bottom-color:var(--spark,#FFC857)}',
  '.ckx-body{flex:1;overflow-y:auto;padding:10px 12px}',
  '.ckx-sec{margin-bottom:14px}',
  '.ckx-sec h3{margin:0 0 6px;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--textDim,#8A97AD)}',
  '.ckx-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;align-items:center}',
  '.ckx-btn{min-height:44px;min-width:44px;padding:0 12px;border-radius:8px;cursor:pointer;',
  'border:1px solid var(--line,#2A3446);background:var(--panel2,#1C2432);color:var(--text,#E8EDF5);font:600 14px Inter,system-ui,sans-serif}',
  '.ckx-btn.ckx-on{border-color:var(--spark,#FFC857);color:var(--spark,#FFC857)}',
  '.ckx-btn.ckx-go{background:var(--spark,#FFC857);border-color:var(--spark,#FFC857);color:#0B0E14}',
  '.ckx-sel{min-height:44px;max-width:100%;padding:0 8px;border-radius:8px;font-size:14px;',
  'border:1px solid var(--line,#2A3446);background:var(--panel2,#1C2432);color:var(--text,#E8EDF5)}',
  '.ckx-pre{white-space:pre-wrap;word-break:break-all;margin:0 0 6px;padding:8px;max-height:220px;overflow:auto;',
  'border-radius:8px;border:1px solid var(--line,#2A3446);background:var(--panel,#141A24);font:12px/1.4 monospace}',
  '.ckx-area{width:100%;box-sizing:border-box;min-height:70px;padding:8px;border-radius:8px;font:12px monospace;',
  'border:1px solid var(--line,#2A3446);background:var(--panel,#141A24);color:var(--text,#E8EDF5)}',
  '.ckx-toast{min-height:40px;padding:10px 12px;border-top:1px solid var(--line,#2A3446);',
  'background:var(--panel,#141A24);color:var(--accent,#4FD1C5);font-size:14px}',
  '.ckx-note{font-size:12px;color:var(--textDim,#8A97AD);margin:0 0 6px}'
].join('');

export function injectStyles() {
  if (typeof document === 'undefined' || document.getElementById('ckx-style')) {
    return;
  }
  const style = document.createElement('style');
  style.id = 'ckx-style';
  style.textContent = CSS;
  document.head.appendChild(style);
}
