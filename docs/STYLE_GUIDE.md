# STYLE GUIDE (AI-5 and everybody who builds screens: read this)

Owner: AI-7. Styles are loaded once by `src/ui/ui.js`; your screen file never imports CSS.

## Tokens (CSS variables, `src/ui/styles/tokens.css`)
- Colors: `--bg --panel --panel2 --line --text --textDim --spark --sparkHot --accent --good --bad --common --rare --legendary --coin`
- Spacing: `--s1` 4, `--s2` 8, `--s3` 12, `--s4` 16, `--s5` 24, `--s6` 32 (px). Use only these.
- Radii: `--r1` 8, `--r2` 12, `--r3` 16.
- Type: `--fs-small --fs-base --fs-title --fs-big --fs-huge --fs-tiny`. One font (Inter). Numbers are tabular.
- Motion: `--t-fast` 120ms, `--t-normal` 220ms, `--t-slow` 400ms, one curve `--ease`.
- Safe areas: `--safe-top --safe-bottom --safe-left --safe-right` (already applied by `.screen`).

## Screen skeleton
```js
export function mount(root, params) {
  const screen = document.createElement('div');
  screen.className = 'screen';          // padded, scrolls, fades in
  // ...build with createElement, never innerHTML with data...
  root.appendChild(screen);
  requestAnimationFrame(() => screen.classList.add('isShown'));
}
export function unmount() { /* remove listeners */ }
```
Layout: one column, max 480 px. Top: title row. Middle: content in `.panel` blocks, gap `--s3`. Bottom: main button(s). Keep touch targets at least 44 px.

## Components (import paths from a screen file)
- `makeButton(label, onClick, { kind, disabled, icon, small, big })` from `../components/button.js`. `kind`: `primary` (amber, main action, one per screen), `secondary` (default), `ghost`, `danger`. Plays the tap sound and a light buzz. `setButtonLabel(button, text)` changes its text.
- `makePartCard(partId, { level, price, selected, compact, locked, onClick, showDesc })` from `../components/partCard.js`. `locked` = silhouette, name `???`. Rarity shows as border style (thin / double / glow) AND a text label.
- `openModal(contentElement, { onClose })` returns `{ close }` from `../components/modal.js`. Closes on backdrop tap and on Back.
- `showToast(text)` from `../components/toast.js`. Use it for every refusal or short message.
- `tickNumber(element, from, to, ms)` from `../components/numberTicker.js`. Uses `formatNumber`; skips animation under `reduceMotion`.
- `getMeta()` and `saveCurrentMeta()` from `../ui.js`: the one loaded meta object. Change it, then call `saveCurrentMeta()`.
- `go(name, params)` from `../ui.js`.

## Class names you may use
`.screen .panel .pill .pill.coin .pill.dust .bar (with child .fill, scaleX) .dim .num .row .spacer .btn(.primary/.secondary/.ghost/.danger/.small/.big) .partCard`.
Progress bar: set `fill.style.transform = 'scaleX(' + ratio + ')'` (ratio 0..1). Never animate width.

## Round 5 tokens (depth and hierarchy)
Everything is in `src/ui/styles/tokens.css`. Same palette, no new colour families. Use these names, never raw values.
- **Type:** `--font-display` (Space Grotesk, big numbers and wordmark ONLY), `--fs-hero` 56, `--fs-number` 28, `--fs-label` 11, `--ls-label`, `--ls-tight`, `--lh-tight`. Classes: `.numHero` (the one hero number of a screen, sparkHot), `.numBig`, `.labelCaps` (small TARGET-style labels). `largeText` scales them.
- **Surfaces** (static gradients, top lit): `--surface-panel`, `--surface-raised`, `--surface-inset`, plus `--edge-light` / `--edge-dark` (1px inner lines, no blur), `--shadow-1` (tiny), `--shadow-2` (only for things that never move), and `--noise` (one grain tile, use as a second background layer at low opacity on big areas).
- **Warm light:** `--warm-wash` (top glow for a screen or panel), `--spark-fill` and `--spark-fill-pressed` (primary button), `--glow-spark` and `--glow-accent` (radial pictures: put them on a pseudo-element and fade it with `opacity`, never animate a shadow), `--ring-focus`.
- **Motion:** `--ease-out`, `--ease-spring`, `--t-screen` (220 ms), `--move-screen` (10 px rise), `--t-press` (90 ms). `reduceMotion` sets the times to 1 ms and the rise to 0.

## Do
- Use the spacing scale and tokens only. One primary button per screen.
- Put every number through `formatNumber`. Reserve space for changing numbers (fixed min-width).
- Give empty states a sentence of text.
- Honor `html.largeText`, `html.reduceMotion`, `html.colorblind` (they are set for you).

## Don't
- No `innerHTML` with data. No emoji as art. No `backdrop-filter`. No blurred `box-shadow` or `filter` on anything that moves. Animate only `transform` and `opacity`. No default browser buttons or scrollbars. No second typeface. No raw hex colors in your files.

## Layers (z-index)
Modal backdrop 50, toast 60, drag ghost 70. Everything from 1000 up is kept free for overlays that sit on top of the whole game: the cheat menu uses about 9000. Do not use a z-index above 100 in a screen.
