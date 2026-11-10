// Number formatting for the whole game: 1234 -> "1.23K". Owner: AI-1

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

// Fixed decimals, then cut useless trailing zeros ("1.50" -> "1.5", "2.00" -> "2").
function trimmed(value, decimals) {
  let text = value.toFixed(decimals);
  if (text.indexOf('.') < 0) return text;
  let end = text.length;
  while (text.charAt(end - 1) === '0') end--;
  if (text.charAt(end - 1) === '.') end--;
  return text.slice(0, end);
}

// 0.5 -> "0.5", 12.34 -> "12.3", 1234 -> "1.23K", 5.6e12 -> "5.6T", 1e40 -> "1e40".
// NaN and Infinity show "0" so a bug never puts garbage on the screen.
export function formatNumber(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '0';
  const sign = n < 0 ? '-' : '';
  const value = Math.abs(n);

  if (value < 1000) {
    const rounded = Math.round(value * 10) / 10;
    if (rounded === 0) return '0';
    if (rounded < 1000) return sign + String(rounded);
  }

  let tier = Math.floor(Math.log10(value) / 3);
  if (value / Math.pow(10, tier * 3) < 1) tier -= 1;
  if (value / Math.pow(10, tier * 3) >= 1000) tier += 1;

  while (tier < SUFFIXES.length) {
    const scaled = value / Math.pow(10, tier * 3);
    let decimals = 2;
    if (scaled >= 100) decimals = 0;
    else if (scaled >= 10) decimals = 1;
    const text = trimmed(scaled, decimals);
    // 999.9K rounds up to "1000K": move to the next suffix instead.
    if (parseFloat(text) >= 1000) {
      tier += 1;
      continue;
    }
    return sign + text + SUFFIXES[tier];
  }

  // Past the last suffix: scientific style.
  const parts = value.toExponential(2).split('e');
  const exponent = parts[1].charAt(0) === '+' ? parts[1].slice(1) : parts[1];
  return sign + trimmed(parseFloat(parts[0]), 2) + 'e' + exponent;
}
