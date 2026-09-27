// Color math for the report: parsing, Lab / ΔE2000 clustering, contrast, human names.

export function parseHex(hex) {
  const h = hex.replace('#', '');
  const n = h.length === 3 || h.length === 4 ? h.split('').map((c) => c + c).join('') : h;
  return {
    r: parseInt(n.slice(0, 2), 16),
    g: parseInt(n.slice(2, 4), 16),
    b: parseInt(n.slice(4, 6), 16),
    a: n.length >= 8 ? Math.round((parseInt(n.slice(6, 8), 16) / 255) * 1000) / 1000 : 1,
  };
}

export const isOpaque = (hex) => parseHex(hex).a >= 0.999;
export const opaqueHex = (hex) => '#' + hex.replace('#', '').slice(0, 6).toLowerCase();

export function toRgbString(hex) {
  const { r, g, b, a } = parseHex(hex);
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
}

export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };

export function luminance(hex) {
  const { r, g, b } = parseHex(hex);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(hexA, hexB) {
  const [a, b] = [luminance(hexA), luminance(hexB)].sort((x, y) => y - x);
  return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
}

export function toLab(hex) {
  const { r, g, b } = parseHex(hex);
  const R = lin(r), G = lin(g), B = lin(b);
  let x = (R * 0.4124564 + G * 0.3575761 + B * 0.1804375) / 0.95047;
  let y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  let z = (R * 0.0193339 + G * 0.119192 + B * 0.9503041) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116);
  x = f(x); y = f(y); z = f(z);
  return { L: 116 * y - 16, a: 500 * (x - y), b: 200 * (y - z) };
}

export const chroma = (hex) => { const { a, b } = toLab(hex); return Math.hypot(a, b); };

// CIEDE2000 — perceptual distance; < ~2.3 is indistinguishable to most people.
export function deltaE(hex1, hex2) {
  const l1 = toLab(hex1), l2 = toLab(hex2);
  const rad = Math.PI / 180;
  const C1 = Math.hypot(l1.a, l1.b), C2 = Math.hypot(l2.a, l2.b);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1 = l1.a * (1 + G), a2 = l2.a * (1 + G);
  const c1 = Math.hypot(a1, l1.b), c2 = Math.hypot(a2, l2.b);
  const hue = (bb, aa) => { if (bb === 0 && aa === 0) return 0; const h = Math.atan2(bb, aa) / rad; return h >= 0 ? h : h + 360; };
  const h1 = hue(l1.b, a1), h2 = hue(l2.b, a2);
  const dL = l2.L - l1.L, dC = c2 - c1;
  let dh = 0;
  if (c1 * c2 !== 0) { dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360; }
  const dH = 2 * Math.sqrt(c1 * c2) * Math.sin((dh / 2) * rad);
  const Lm = (l1.L + l2.L) / 2, Cm2 = (c1 + c2) / 2;
  let hm = h1 + h2;
  if (c1 * c2 !== 0) hm = Math.abs(h1 - h2) > 180 ? (h1 + h2 + (h1 + h2 < 360 ? 360 : -360)) / 2 : (h1 + h2) / 2;
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hm - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cm2 ** 7 / (Cm2 ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2);
  const Sc = 1 + 0.045 * Cm2, Sh = 1 + 0.015 * Cm2 * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt((dL / Sl) ** 2 + (dC / Sc) ** 2 + (dH / Sh) ** 2 + Rt * (dC / Sc) * (dH / Sh));
}

// Plain-language name so the palette reads like a brief ("deep blue", "light gray").
export function colorName(hex) {
  const { h, s, l } = rgbToHsl(parseHex(hex));
  if (l >= 99) return 'white';
  if (l <= 6) return 'black';
  if (s < 10 || chroma(hex) < 6) {
    if (l >= 90) return 'off-white';
    if (l >= 75) return 'light gray';
    if (l >= 45) return 'gray';
    if (l >= 20) return 'dark gray';
    return 'near-black';
  }
  const hues = [[10, 'red'], [35, 'orange'], [50, 'amber'], [65, 'yellow'], [85, 'lime'], [150, 'green'], [175, 'teal'], [195, 'cyan'], [215, 'sky blue'], [240, 'blue'], [260, 'indigo'], [285, 'violet'], [315, 'purple'], [340, 'pink'], [361, 'red']];
  let name = hues.find(([max]) => h < max)[1];
  if (s < 30) name = 'muted ' + name;
  if (l >= 80) return 'pale ' + name;
  if (l >= 65) return 'light ' + name;
  if (l <= 22) return 'deep ' + name;
  if (l <= 38) return 'dark ' + name;
  return name;
}

// Greedy perceptual clustering: heaviest color first absorbs near-identical shades.
export function clusterColors(entries, threshold = 2.3) {
  const sorted = [...entries].sort((a, b) => b.weight - a.weight);
  const clusters = [];
  for (const e of sorted) {
    const hit = clusters.find((c) => deltaE(c.hex, e.hex) < threshold);
    if (hit) { hit.members.push(e.hex); hit.weight += e.weight; mergeInto(hit, e); }
    else clusters.push({ ...structuredClone(e), members: [e.hex] });
  }
  return clusters;
}

function mergeInto(target, e) {
  for (const k of ['count', 'area', 'chars', 'mainChars', 'widget']) target[k] = (target[k] || 0) + (e[k] || 0);
  target.props = target.props || {};
  for (const [p, v] of Object.entries(e.props || {})) target.props[p] = (target.props[p] || 0) + v;
  target.samples = [...new Set([...(target.samples || []), ...(e.samples || [])])].slice(0, 6);
}
