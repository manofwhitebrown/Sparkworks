// The SPARKWORKS wordmark: "SPARK" bright and heavy, "WORKS" light, a thin spark line under it.
// Colours and sizes come from tokens (CSS variables). The h1 keeps the class homeLogo so the
// home screen's size rules for short phones still apply.
// Owner: AI-7

const SVG_NS = 'http://www.w3.org/2000/svg';

function word(text, color, weight) {
  const span = document.createElement('span');
  span.textContent = text;
  span.style.color = color;
  span.style.fontWeight = weight;
  return span;
}

// A thin line that fades out at both ends, with a small diamond in the middle (the spark).
function makeSparkLine() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 200 8');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.width = '72%';
  svg.style.height = '8px';
  const defs = document.createElementNS(SVG_NS, 'defs');
  const grad = document.createElementNS(SVG_NS, 'linearGradient');
  grad.setAttribute('id', 'wordmarkLine');
  const stops = [['0', 0], ['0.5', 1], ['1', 0]];
  stops.forEach(function (s) {
    const stop = document.createElementNS(SVG_NS, 'stop');
    stop.setAttribute('offset', s[0]);
    stop.style.stopColor = 'var(--spark)';
    stop.style.stopOpacity = String(s[1]);
    grad.appendChild(stop);
  });
  defs.appendChild(grad);
  const line = document.createElementNS(SVG_NS, 'rect');
  line.setAttribute('x', '0'); line.setAttribute('y', '3'); line.setAttribute('width', '200');
  line.setAttribute('height', '2'); line.setAttribute('fill', 'url(#wordmarkLine)');
  const gem = document.createElementNS(SVG_NS, 'path');
  gem.setAttribute('d', 'M100 0 L104 4 L100 8 L96 4 Z');
  gem.style.fill = 'var(--sparkHot)';
  svg.append(defs, line, gem);
  return svg;
}

export function makeWordmark() {
  const box = document.createElement('div');
  box.className = 'wordmark';
  box.style.display = 'flex';
  box.style.flexDirection = 'column';
  box.style.alignItems = 'center';
  box.style.gap = 'var(--s1)';
  const title = document.createElement('h1');
  title.className = 'homeLogo';
  title.setAttribute('aria-label', 'Sparkworks');
  title.style.display = 'flex';
  title.style.gap = '0.1em';
  title.style.letterSpacing = '0.14em';
  title.style.margin = '0';
  title.append(word('SPARK', 'var(--sparkHot)', '800'), word('WORKS', 'var(--text)', '300'));
  box.append(title, makeSparkLine());
  return box;
}
