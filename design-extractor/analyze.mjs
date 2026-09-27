// Turns the raw capture (run) into design tokens + a human report.
// Everything here is deterministic post-processing — no browser needed, so it can be re-run on data/raw.json.
import fsp from 'node:fs/promises';
import path from 'node:path';
import { parseHex, isOpaque, toRgbString, rgbToHsl, contrast, chroma, colorName, clusterColors, deltaE, luminance } from './color.mjs';

const sum = (a) => a.reduce((s, x) => s + (x || 0), 0);
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
const inc = (h, k, n = 1) => { if (k === undefined || k === null || k === '') return; h[k] = (h[k] || 0) + n; };
const topKey = (h) => Object.entries(h || {}).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
const topN = (h, n = 10) => Object.entries(h || {}).sort((a, b) => b[1] - a[1]).slice(0, n);
const median = (arr) => { const s = arr.filter((x) => Number.isFinite(x)).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };
const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
const esc = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const code = (s) => (s === null || s === undefined || s === '' ? '—' : '`' + String(s).replace(/`/g, "'") + '`');
const VP_ORDER = ['desktop', 'tablet', 'mobile'];
const VP_WEIGHT = { desktop: 1, tablet: 0.35, mobile: 0.5 };
const RGB_IN_TEXT = /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/g;
const hexify = (s) => String(s ?? '').replace(RGB_IN_TEXT, (_, r, g, b, a) => {
  const h = (n) => (+n).toString(16).padStart(2, '0');
  const al = a === undefined ? '' : +a >= 1 ? '' : +a === 0 ? '00' : h(Math.round(+a * 255));
  return `#${h(r)}${h(g)}${h(b)}${al}`;
});

// ---------------------------------------------------------------------------------------------
export async function buildReport({ outDir, run }) {
  const views = [];
  for (const page of run.pages) {
    for (const vp of VP_ORDER) {
      const v = page.views[vp];
      if (v?.ok && v.data && !v.data.error) views.push({ page, vp, v, d: v.data, w: VP_WEIGHT[vp] });
    }
  }
  const home = run.pages[0];
  const vps = VP_ORDER.filter((vp) => views.some((x) => x.vp === vp));

  const color = analyzeColors(views, run);
  const type = analyzeType(views, run, vps);
  const space = analyzeSpace(views, run, vps);
  const shape = analyzeShape(views, run);
  const breakpoints = analyzeBreakpoints(run.css);
  const motion = analyzeMotion(views, run);
  const components = analyzeComponents(views, run);
  const layout = analyzeLayout(run);
  const tech = mergeTech(views);
  const warnings = collectWarnings(run, views, type);
  const designVars = {};
  for (const x of views.filter((y) => y.vp === 'desktop')) for (const [k, v] of Object.entries(x.d.cssVars || {})) {
    if (/typography|font|text-|size|spacing|space|gap|radius|shadow|container|width|line-height|leading|weight/i.test(k) && !/color/i.test(k) && v.length < 120) designVars[k] = v;
  }

  const tokens = {
    $meta: { source: run.target, extractedAt: run.finishedAt || run.startedAt, tool: `${run.tool.name} ${run.tool.version}`, browser: run.browser, pages: run.pages.map((p) => p.url), viewports: vps, note: 'Measured from the rendered site. Role names (primary, surface, …) are inferred — verify against report.md.' },
    color: { roles: color.roles, palette: color.palette.map(slimColor), translucent: color.translucent.map((c) => ({ hex: c.hex, rgba: toRgbString(c.hex), uses: roundProps(c.props) })), gradients: color.gradients, declaredVariables: color.declared },
    typography: { families: type.families, roles: type.roles, scale: type.scale, lineHeights: type.lineHeights },
    spacing: space,
    radius: shape.radius, shadow: shape.shadows, border: shape.borders,
    breakpoints,
    motion: { transitions: motion.transitions, durations: motion.durations, easings: motion.easings, keyframes: motion.keyframes.map((k) => k.name), entrance: motion.entrance, libraries: motion.libraries },
    components: {
      header: components.header, nav: components.nav, buttons: components.buttons, links: components.links, inputs: components.inputs,
      cards: components.cards, footer: components.footer, pinned: components.pinned, overlays: components.overlays, mobileMenu: components.mobileMenu,
      images: components.images, icons: components.icons, embeds: components.embeds,
    },
    layout, tech, designVariables: designVars,
  };

  const files = {
    'tokens.json': JSON.stringify(tokens, null, 2),
    'tokens.css': tokensCss(tokens, run, vps),
    'tailwind-theme.css': tailwindCss(tokens, run),
    'palette.svg': paletteSvg(color),
    'report.md': reportMd({ run, tokens, color, type, space, shape, breakpoints, motion, components, layout, tech, warnings, vps, home }),
  };
  for (const [name, body] of Object.entries(files)) await fsp.writeFile(path.join(outDir, name), body);
  for (const page of run.pages) await fsp.writeFile(path.join(outDir, 'pages', `${page.slug}.md`), contentMd(page));
  await fsp.writeFile(path.join(outDir, 'data', 'raw.json'), JSON.stringify(stripRaw(run)));
  return { tokens, warnings, files: Object.keys(files) };
}

// ------------------------------------------------------------------------------- colors
function analyzeColors(views, run) {
  const acc = new Map();
  for (const x of views) {
    for (const c of Object.values(x.d.colors)) {
      const e = acc.get(c.hex) || { hex: c.hex, count: 0, area: 0, chars: 0, mainChars: 0, widget: 0, props: {}, samples: [] };
      e.count += c.count * x.w; e.area += c.area * x.w; e.chars += c.chars * x.w; e.mainChars += (c.mainChars || 0) * x.w; e.widget += (c.widget || 0) * x.w;
      for (const [p, n] of Object.entries(c.props)) inc(e.props, p, n * x.w);
      e.samples = [...new Set([...e.samples, ...c.samples])].slice(0, 6);
      acc.set(c.hex, e);
    }
  }
  const all = [...acc.values()];
  const tA = sum(all.map((e) => e.area)) || 1, tC = sum(all.map((e) => e.chars)) || 1, tN = sum(all.map((e) => e.count)) || 1;
  for (const e of all) e.weight = e.area / tA + e.chars / tC + e.count / tN;
  const clusters = clusterColors(all.filter((e) => isOpaque(e.hex)), 2.3).sort((a, b) => b.weight - a.weight);
  const tW = sum(clusters.map((c) => c.weight)) || 1;
  for (const c of clusters) {
    c.share = round((c.weight / tW) * 100, 1);
    c.name = colorName(c.hex);
    c.hsl = rgbToHsl(parseHex(c.hex));
    c.chroma = round(chroma(c.hex), 1);
    c.onWhite = contrast(c.hex, '#ffffff');
    c.onBlack = contrast(c.hex, '#000000');
  }
  const clusterOf = (hex) => hex && clusters.find((c) => c.members.includes(hex.slice(0, 7).toLowerCase()) || c.members.includes(hex));

  // CSS variables that hold colors: builder globals (Elementor --e-global-color-*) are the site's own names.
  const declared = {};
  for (const x of views) for (const [k, v] of Object.entries(x.d.cssVars || {})) if (/color|colour|clr|bg|brand|primary|secondary|accent/i.test(k) && /^(#|rgb|hsl|oklch)/i.test(v.trim())) declared[k] = v.trim();
  for (const [k, hex] of Object.entries(run.css?.colorVars || {})) if (!(k in declared)) declared[k] = hex;
  const declaredHex = Object.fromEntries(Object.entries(declared).map(([k, v]) => [k, normalizeHexish(v)]).filter(([, v]) => v));
  for (const c of clusters) c.vars = Object.entries(declaredHex).filter(([, h]) => h && deltaE(h.slice(0, 7), c.hex) < 1.5).map(([k]) => k).slice(0, 6);

  // Roles — inferred from *how* each color is used, not just how much.
  const bgs = clusters.filter((c) => (c.props.background || 0) > 0).sort((a, b) => b.area - a.area);
  // Body text color = what the main content is written in (header/footer text would skew it).
  const texts = clusters.filter((c) => c.chars > 0).sort((a, b) => (b.mainChars || 0) - (a.mainChars || 0) || b.chars - a.chars);
  // Floating widgets (WhatsApp, accessibility, chat) bring third-party colors — never brand roles.
  const isWidget = (c) => (c.widget || 0) / (c.count || 1) > 0.6;
  for (const c of clusters) c.widgetOnly = isWidget(c);
  const chromatic = clusters.filter((c) => c.chroma >= 18 && !c.widgetOnly);
  const btnBg = {};
  for (const x of views) for (const b of x.d.buttons) if (b.bg && b.bg.startsWith('#')) inc(btnBg, b.bg.slice(0, 7), b.count * x.w);
  const roles = {};
  roles.background = bgs[0]?.hex || '#ffffff';
  roles.text = texts[0]?.hex || '#000000';
  const btnChromatic = topN(btnBg, 10).map(([h]) => clusterOf(h)).filter((c) => c && c.chroma >= 18 && !c.widgetOnly);
  const ranked = [...new Set([...btnChromatic, ...chromatic])];
  const elementorPrimary = declaredHex['--e-global-color-primary'];
  if (elementorPrimary && clusterOf(elementorPrimary) && chroma(elementorPrimary.slice(0, 7)) >= 18) ranked.unshift(clusterOf(elementorPrimary));
  const distinct = [];
  for (const c of ranked) if (!distinct.some((d) => deltaE(d.hex, c.hex) < 18)) distinct.push(c);
  if (distinct[0]) roles.primary = distinct[0].hex;
  if (distinct[1]) roles.secondary = distinct[1].hex;
  if (distinct[2]) roles.accent = distinct[2].hex;
  const muted = texts.find((t) => t.hex !== roles.text && t.chroma < 18 && contrast(t.hex, roles.background) < contrast(roles.text, roles.background) && contrast(t.hex, roles.background) >= 1.8);
  if (muted) roles.textMuted = muted.hex;
  const surface = bgs.find((c) => c.hex !== roles.background && luminance(c.hex) > 0.7 && deltaE(c.hex, roles.background) > 1.5);
  if (surface) roles.surface = surface.hex;
  const dark = bgs.filter((c) => luminance(c.hex) < 0.05 && c.area / (bgs[0]?.area || 1) > 0.01).sort((a, b) => b.area - a.area)[0];
  if (dark) roles.dark = dark.hex;
  const border = clusters.filter((c) => (c.props.border || 0) > 0).sort((a, b) => (b.props.border || 0) - (a.props.border || 0))[0];
  if (border) roles.border = border.hex;
  const onPrimary = views.flatMap((x) => x.d.buttons).find((b) => roles.primary && b.bg && clusterOf(b.bg)?.hex === roles.primary);
  if (onPrimary?.color) roles.onPrimary = onPrimary.color.slice(0, 7);

  const translucent = all.filter((e) => !isOpaque(e.hex)).sort((a, b) => b.weight - a.weight).slice(0, 12);
  const gradients = mergeNotes(views, 'gradient', 1).slice(0, 10).map(([value, e]) => ({ value: hexify(value), count: round(e.count, 0), on: topKey(e.kinds), samples: e.samples }));
  const cssLiterals = topN(run.css?.colorLits || {}, 30).map(([hex, n]) => ({ hex, rules: n }));
  return { roles, palette: clusters.slice(0, 28), clusters, translucent, gradients, declared, cssLiterals };
}
function normalizeHexish(v) {
  v = String(v).trim();
  if (/^#[0-9a-f]{3,8}$/i.test(v)) { const { r, g, b, a } = parseHex(v); return '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('') + (a < 1 ? Math.round(a * 255).toString(16).padStart(2, '0') : ''); }
  const m = v.match(/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,/\s]+([\d.]+))?\s*\)$/i);
  if (m) return hexify(`rgba(${m[1]}, ${m[2]}, ${m[3]}${m[4] !== undefined ? ', ' + m[4] : ''})`).slice(0, 9);
  return null;
}
const slimColor = (c) => ({ hex: c.hex, name: c.name, share: c.share, widgetOnly: c.widgetOnly || undefined, rgb: toRgbString(c.hex), hsl: `hsl(${c.hsl.h} ${c.hsl.s}% ${c.hsl.l}%)`, uses: roundProps(c.props), contrastOnWhite: c.onWhite, contrastOnBlack: c.onBlack, shades: c.members.length > 1 ? c.members.slice(1, 6) : undefined, vars: c.vars?.length ? c.vars : undefined, samples: c.samples.slice(0, 3) });
const roundProps = (p) => Object.fromEntries(Object.entries(p || {}).map(([k, v]) => [k, Math.round(v)]).sort((a, b) => b[1] - a[1]));

// ------------------------------------------------------------------------------- typography
function analyzeType(views, run, vps) {
  const famChars = {}, famWeights = {}, famStack = {};
  for (const x of views) {
    for (const t of Object.values(x.d.text)) {
      inc(famChars, t.family, t.chars * x.w);
      famWeights[t.family] = famWeights[t.family] || {};
      inc(famWeights[t.family], String(t.weight), t.chars * x.w);
      famStack[t.family] = famStack[t.family] || t.stack;
    }
  }
  const tot = sum(Object.values(famChars)) || 1;
  const faces = run.css?.fontFaces || [];
  const loaded = {};
  for (const x of views) for (const f of x.d.fonts || []) if (f.status === 'loaded') { loaded[f.family.toLowerCase()] = loaded[f.family.toLowerCase()] || new Set(); loaded[f.family.toLowerCase()].add(`${f.weight}${f.style !== 'normal' ? ' ' + f.style : ''}`); }
  const rendered = renderedFonts(run);
  const families = topN(famChars, 8).map(([family, chars]) => {
    const ff = faces.filter((f) => f.family.toLowerCase() === family.toLowerCase());
    const srcs = ff.map((f) => f.src).join(' ');
    const source = /fonts\.gstatic\.com|fonts\.googleapis/.test(srcs) ? 'Google Fonts' : /typekit|use\.typekit/.test(srcs) ? 'Adobe Fonts' : ff.length ? 'self-hosted (@font-face)' : 'system / not loaded as webfont';
    return {
      family, share: round((chars / tot) * 100, 1), stack: famStack[family],
      weightsUsed: topN(famWeights[family], 9).map(([w]) => w).sort(), source,
      faces: [...new Set(ff.map((f) => `${f.weight}${f.style !== 'normal' ? ' ' + f.style : ''}`))],
      formats: [...new Set([...srcs.matchAll(/format\(["']?([\w-]+)["']?\)/g)].map((m) => m[1]))],
      loaded: loaded[family.toLowerCase()] ? [...loaded[family.toLowerCase()]] : [],
      renderedAs: rendered[family] ? topN(rendered[family], 3).map(([f]) => f) : [],
    };
  });

  const roles = {};
  for (const vp of vps) {
    const vv = views.filter((x) => x.vp === vp);
    const r = {};
    const byLevel = {};
    for (const x of vv) for (const h of x.d.headings) {
      const key = [h.family, h.size, h.weight, h.lineHeight, h.letterSpacing, h.transform].join('|');
      const L = (byLevel[h.level] = byLevel[h.level] || {});
      const e = (L[key] = L[key] || { family: h.family, size: h.size, weight: h.weight, lineHeight: h.lineHeight, letterSpacing: h.letterSpacing, transform: h.transform, count: 0, colors: {}, aligns: {}, samples: [] });
      e.count++; inc(e.colors, h.color); inc(e.aligns, h.align);
      if (e.samples.length < 3 && !e.samples.includes(h.text)) e.samples.push(h.text);
    }
    for (const [lvl, m] of Object.entries(byLevel)) {
      const arr = Object.values(m).sort((a, b) => b.count - a.count);
      r['h' + lvl] = styleRole(arr[0], { variants: arr.length, total: sum(arr.map((a) => a.count)), alternatives: arr.slice(1, 3).map((a) => styleRole(a)) });
    }
    const body = {};
    const small = {};
    for (const x of vv) for (const t of Object.values(x.d.text)) {
      const bodyChars = sum(Object.entries(t.roles).filter(([k]) => !/^(h[1-6]|button|a|label)$/.test(k)).map(([, n]) => n));
      const score = Math.min(bodyChars, t.regions.main || 0);
      if (score <= 0) continue;
      const key = [t.family, t.size, t.weight, t.lineHeight, t.letterSpacing].join('|');
      const e = (body[key] = body[key] || { family: t.family, size: t.size, weight: t.weight, lineHeight: t.lineHeight, letterSpacing: t.letterSpacing, transform: t.transform, chars: 0, colors: {}, samples: [] });
      e.chars += score;
      for (const [c, n] of Object.entries(t.mainColors || t.colors)) inc(e.colors, c, n);
      if (e.samples.length < 2 && t.samples[0]) e.samples.push(t.samples[0]);
    }
    const bodyArr = Object.values(body).sort((a, b) => b.chars - a.chars);
    if (bodyArr[0]) {
      r.body = styleRole(bodyArr[0], { alternatives: bodyArr.slice(1, 4).map((a) => styleRole(a)) });
      const totalBody = sum(bodyArr.map((a) => a.chars)) || 1;
      const sm = bodyArr.filter((a) => a.size < bodyArr[0].size - 0.5 && a.chars / totalBody > 0.02);
      if (sm[0]) r.small = styleRole(sm[0]);
      const lg = bodyArr.filter((a) => a.size > bodyArr[0].size + 1 && a.chars / totalBody > 0.02 && a.size < 28);
      if (lg[0]) r.lead = styleRole(lg[0]);
    }
    const homeView = views.find((x) => x.vp === vp && x.page === run.pages[0]);
    if (homeView?.d.nav?.style) r.nav = styleRole(homeView.d.nav.style);
    const btns = vv.flatMap((x) => x.d.buttons).sort((a, b) => b.count - a.count);
    if (btns[0]) r.button = styleRole({ family: btns[0].fontFamily, size: btns[0].fontSize, weight: btns[0].fontWeight, transform: btns[0].textTransform, letterSpacing: btns[0].letterSpacing, color: btns[0].color });
    const inp = vv.flatMap((x) => x.d.inputs)[0];
    if (inp) r.input = styleRole({ family: inp.fontFamily, size: inp.fontSize, weight: inp.fontWeight, color: inp.color });
    const foot = vv.map((x) => x.d.footer?.linkStyle).find(Boolean);
    if (foot) r.footerLink = styleRole(foot);
    roles[vp] = r;
    void small;
  }

  const scale = {};
  for (const vp of vps) {
    const m = {};
    for (const x of views.filter((y) => y.vp === vp)) for (const t of Object.values(x.d.text)) {
      const key = `${t.size}|${t.weight}|${t.family}|${t.lineHeight}`;
      const e = (m[key] = m[key] || { size: t.size, weight: t.weight, family: t.family, lineHeight: t.lineHeight, chars: 0, count: 0, roles: {}, samples: [] });
      e.chars += t.chars; e.count += t.count;
      for (const [k, n] of Object.entries(t.roles)) inc(e.roles, k, n);
      if (e.samples.length < 2 && t.samples[0]) e.samples.push(t.samples[0]);
    }
    const total = sum(Object.values(m).map((e) => e.chars)) || 1;
    scale[vp] = Object.values(m).filter((e) => e.chars / total > 0.004 || e.size >= 24).sort((a, b) => b.size - a.size || b.chars - a.chars).slice(0, 24)
      .map((e) => ({ size: e.size, weight: e.weight, family: e.family, lineHeight: e.lineHeight, share: round((e.chars / total) * 100, 1), roles: topN(e.roles, 3).map(([k]) => k), sample: e.samples[0] || '' }));
  }
  const lh = {};
  for (const x of views.filter((y) => y.vp === 'desktop')) for (const [k, n] of Object.entries(x.d.hist.lineHeightRatio)) inc(lh, k, n);
  const lhTot = sum(Object.values(lh)) || 1;
  const lineHeights = topN(lh, 6).map(([ratio, n]) => ({ ratio: +ratio, share: round((n / lhTot) * 100, 1) }));
  return { families, roles, scale, lineHeights, rendered };
}
function styleRole(s, extra = {}) {
  if (!s) return null;
  const lh = s.lineHeight === 'normal' || s.lineHeight === undefined ? s.lineHeight : round(s.lineHeight / (s.size || 1), 2);
  const colorFromHist = s.colors ? topKey(s.colors) : undefined;
  const out = { family: s.family, size: s.size, weight: s.weight, lineHeight: lh, lineHeightPx: typeof s.lineHeight === 'number' ? s.lineHeight : undefined, letterSpacing: s.letterSpacing || 0, transform: s.transform && s.transform !== 'none' ? s.transform : undefined, color: s.color || colorFromHist || undefined, align: s.align || (s.aligns ? topKey(s.aligns) : undefined), samples: s.samples?.slice(0, 2), ...extra };
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}
function renderedFonts(run) {
  const out = {};
  for (const page of run.pages) {
    const v = page.views.desktop;
    if (!v?.platformFonts || !v.data) continue;
    const byDx = {};
    for (const t of Object.values(v.data.text)) if (t.dx) byDx[t.dx] = t.family;
    for (const h of v.data.headings) byDx[h.dx] = h.family;
    for (const [dx, fonts] of Object.entries(v.platformFonts)) {
      if (!Array.isArray(fonts) || !byDx[dx]) continue;
      const fam = byDx[dx];
      out[fam] = out[fam] || {};
      for (const f of fonts) inc(out[fam], f.family + (f.custom ? '' : ' (system)'), f.glyphs);
    }
  }
  return out;
}

// ------------------------------------------------------------------------------- spacing & layout metrics
function analyzeSpace(views, run, vps) {
  const merge = (key, vp) => { const h = {}; for (const x of views.filter((y) => !vp || y.vp === vp)) for (const [k, n] of Object.entries(x.d.hist[key] || {})) inc(h, k, n * x.w); return h; };
  const values = {};
  for (const k of ['padding', 'margin', 'gap']) for (const [v, n] of Object.entries(merge(k))) inc(values, +v, n);
  const tot = sum(Object.values(values)) || 1;
  const common = Object.entries(values).filter(([v, n]) => +v >= 2 && n / tot >= 0.008).map(([v]) => +v).sort((a, b) => a - b);
  let base = null;
  for (const cand of [10, 8, 6, 5, 4]) {
    const frac = sum(Object.entries(values).filter(([v]) => +v >= 4 && +v % cand === 0).map(([, n]) => n)) / (sum(Object.entries(values).filter(([v]) => +v >= 4).map(([, n]) => n)) || 1);
    if (frac >= 0.62) { base = { unit: cand, fit: round(frac * 100, 0) }; break; }
  }
  const sectionPadding = {}, sectionHeights = {};
  for (const vp of vps) {
    const secs = run.pages.flatMap((p) => p.views[vp]?.data?.sections || []).filter((s) => s.kind !== 'header' && s.kind !== 'footer');
    const pads = secs.flatMap((s) => s.paddingY).filter((n) => n > 0);
    sectionPadding[vp] = { median: median(pads), common: topN(pads.reduce((h, n) => (inc(h, n), h), {}), 4).map(([v]) => +v) };
    sectionHeights[vp] = median(secs.map((s) => s.height));
  }
  const centered = topN(merge('centered', 'desktop'), 6).map(([w, n]) => ({ width: +w, count: round(n, 0) }));
  const maxWidths = topN(merge('maxWidth', 'desktop'), 8).map(([w, n]) => ({ value: w, count: round(n, 0) }));
  const container = centered.find((c) => c.width >= 900)?.width || centered[0]?.width || null;
  const gaps = topN(merge('gap'), 8).map(([g, n]) => ({ px: +g, count: round(n, 0) }));
  const columns = {};
  for (const p of run.pages) for (const s of p.views.desktop?.data?.sections || []) inc(columns, `${s.columns?.cols || 1} col`);
  const display = merge('display', 'desktop');
  return { base, scale: common.slice(0, 24), sectionPadding, sectionHeights, container, centeredWidths: centered, maxWidths, gaps, columns, layoutEngines: roundProps(display) };
}

function mergeNotes(views, key, minCount = 1, vp = null) {
  const m = {};
  for (const x of views.filter((y) => !vp || y.vp === vp)) {
    for (const [k, e] of Object.entries(x.d.hist[key] || {})) {
      const t = (m[k] = m[k] || { count: 0, kinds: {}, samples: [] });
      t.count += e.count * x.w;
      for (const [kk, n] of Object.entries(e.kinds)) inc(t.kinds, kk, n);
      t.samples = [...new Set([...t.samples, ...e.samples])].slice(0, 3);
    }
  }
  return Object.entries(m).filter(([, e]) => e.count >= minCount).sort((a, b) => b[1].count - a[1].count);
}

function analyzeShape(views) {
  const radius = mergeNotes(views, 'radius').slice(0, 14).map(([value, e]) => ({ value, count: round(e.count, 0), on: topN(e.kinds, 3).map(([k]) => k), samples: e.samples }));
  const desk = views.filter((x) => x.vp === 'desktop');
  const byKind = {};
  const btn = desk.flatMap((x) => x.d.buttons).sort((a, b) => b.count - a.count)[0];
  if (btn) byKind.button = btn.shape === 'pill' ? '9999px' : btn.radius;
  const card = desk.flatMap((x) => x.d.cards).find((c) => c.style);
  if (card?.style?.radius) byKind.card = card.style.radius;
  const input = desk.flatMap((x) => x.d.inputs).sort((a, b) => b.count - a.count)[0];
  if (input) byKind.input = input.radius;
  const imgR = {};
  for (const i of desk.flatMap((x) => x.d.images)) if (i.w >= 120) inc(imgR, i.radius);
  if (Object.keys(imgR).length) byKind.image = topKey(imgR);
  const shadows = mergeNotes(views, 'shadow').filter(([, e]) => topKey(e.kinds) !== 'widget').slice(0, 12).map(([value, e]) => ({ value: hexify(value), count: round(e.count, 0), on: topN(e.kinds, 3).map(([k]) => k), samples: e.samples }));
  const borders = mergeNotes(views, 'border').slice(0, 12).map(([value, e]) => ({ value, count: round(e.count, 0), on: topN(e.kinds, 3).map(([k]) => k), samples: e.samples }));
  const textShadows = mergeNotes(views, 'textShadow').slice(0, 6).map(([value, e]) => ({ value: hexify(value), count: round(e.count, 0) }));
  const filters = mergeNotes(views, 'filters').slice(0, 8).map(([value, e]) => ({ value, count: round(e.count, 0), on: topKey(e.kinds) }));
  return { radius: { values: radius, byComponent: byKind }, shadows, borders, textShadows, filters };
}

function analyzeBreakpoints(css) {
  const bp = {}, features = {};
  const toPx = (n, u) => (u === 'px' ? +n : +n * 16);
  for (const [cond, rules] of Object.entries(css?.media || {})) {
    for (const m of cond.matchAll(/\((min|max)-width:\s*([\d.]+)(px|em|rem)\)/g)) inc(bp, `${m[1]}|${round(toPx(m[2], m[3]), 2)}`, rules);
    for (const m of cond.matchAll(/\(\s*width\s*(>=|<=|>|<)\s*([\d.]+)(px|em|rem)\s*\)/g)) inc(bp, `${m[1].startsWith('>') ? 'min' : 'max'}|${round(toPx(m[2], m[3]), 2)}`, rules);
    for (const f of ['prefers-color-scheme: dark', 'prefers-reduced-motion', 'hover: hover', 'orientation', 'print', 'min-resolution', '-webkit-min-device-pixel-ratio']) if (cond.includes(f)) inc(features, f, rules);
  }
  const list = topN(bp, 14).map(([k, rules]) => { const [type, v] = k.split('|'); return { type, px: +v, rules }; }).sort((a, b) => b.px - a.px);
  const maxRules = sum(list.filter((b) => b.type === 'max').map((b) => b.rules)), minRules = sum(list.filter((b) => b.type === 'min').map((b) => b.rules));
  return { list, strategy: maxRules > minRules * 1.3 ? 'desktop-first (max-width queries dominate)' : minRules > maxRules * 1.3 ? 'mobile-first (min-width queries dominate)' : 'mixed', features: topN(features, 8).map(([f, n]) => ({ feature: f, rules: n })) };
}

function analyzeMotion(views, run) {
  const tr = mergeNotes(views, 'transition', 1, 'desktop');
  const durations = {}, easings = {};
  for (const [k, e] of tr) {
    const m = k.match(/ ([\d.]+m?s) (.+)$/);
    if (m) { inc(durations, m[1], e.count); inc(easings, m[2], e.count); }
  }
  const entrance = { aos: {}, elementor: {}, wow: {}, animateCss: {} };
  for (const x of views.filter((y) => y.vp === 'desktop')) for (const [k, h] of Object.entries(x.d.entrance || {})) for (const [n, c] of Object.entries(h)) inc(entrance[k], n, c);
  const libs = mergeTech(views);
  const libraries = ['gsap', 'scrollTrigger', 'aos', 'wow', 'animateCss', 'swiper', 'slick', 'owl', 'splide', 'flickity', 'lottie', 'smoothScroll'].filter((k) => libs[k]);
  const hover = run.pages[0]?.views.desktop?.hover || [];
  return {
    transitions: tr.slice(0, 14).map(([value, e]) => ({ value: hexify(value), count: round(e.count, 0), on: topN(e.kinds, 3).map(([k]) => k) })),
    durations: topN(durations, 6).map(([d, n]) => ({ duration: d, count: round(n, 0) })),
    easings: topN(easings, 6).map(([d, n]) => ({ easing: d, count: round(n, 0) })),
    running: mergeNotes(views, 'animation', 1, 'desktop').slice(0, 10).map(([value, e]) => ({ value, count: round(e.count, 0) })),
    keyframes: dedupeBy(run.css?.keyframes || [], (k) => k.name).slice(0, 40),
    entrance: Object.fromEntries(Object.entries(entrance).filter(([, h]) => Object.keys(h).length).map(([k, h]) => [k, Object.fromEntries(topN(h, 12))])),
    libraries, hover,
  };
}
const dedupeBy = (arr, f) => { const seen = new Set(); return arr.filter((x) => { const k = f(x); if (seen.has(k)) return false; seen.add(k); return true; }); };

// ------------------------------------------------------------------------------- components
function analyzeComponents(views, run) {
  const home = run.pages[0]?.views || {};
  const hd = home.desktop || {};
  const hover = hd.hover || [];
  const hoverFor = (kind, dx) => hover.find((h) => h.kind === kind && h.dx === dx);
  const header = {};
  for (const vp of VP_ORDER) {
    const v = home[vp];
    if (!v?.data?.header && !v?.header) continue;
    header[vp] = { ...(v.header?.top || v.data.header), sticky: v.header?.sticky ?? null, revealOnScrollUp: v.header?.revealOnUp ?? null, changesOnScroll: v.header?.changes || null, shots: v.header?.shots || [] };
    if (header[vp].logo) header[vp].logo = { ...header[vp].logo, svg: undefined };
  }
  const bmap = {};
  for (const x of views.filter((y) => y.vp === 'desktop')) {
    for (const b of x.d.buttons) {
      const key = [b.bg, b.color, b.border, b.shape === 'pill' ? 'pill' : b.radius, Math.round(b.fontSize), b.fontWeight, b.height].join('|');
      const e = bmap[key] || (bmap[key] = { ...b, count: 0, labels: [], regions: {}, pages: 0, widths: [] });
      if (e.count === 0 || x.page === run.pages[0]) e.dx = e.dx || b.dx;
      e.count += b.count; e.pages++;
      for (const [r, n] of Object.entries(b.regions)) inc(e.regions, r, n);
      e.labels = [...new Set([...e.labels, ...b.labels])].slice(0, 6);
      e.widths = [...e.widths, ...b.widths].slice(0, 30);
      if (x.page === run.pages[0] && !e.homeDx) e.homeDx = b.dx;
    }
  }
  const buttons = Object.values(bmap).sort((a, b) => b.count - a.count).slice(0, 10).map((b, i) => {
    const h = hoverFor('button', b.homeDx);
    const shot = (hd.components || []).find((c) => c.kind === 'button' && c.dx === b.homeDx);
    return {
      variant: i + 1, bg: b.bg, gradient: b.gradient ? hexify(b.gradient) : undefined, color: b.color, border: b.border, radius: b.radius, shape: b.shape,
      font: `${b.fontWeight} ${b.fontSize}px ${b.fontFamily}`, textTransform: b.textTransform !== 'none' ? b.textTransform : undefined, letterSpacing: b.letterSpacing !== 'normal' ? b.letterSpacing : undefined,
      padding: b.padding, height: b.height, width: median(b.widths), shadow: b.shadow ? hexify(b.shadow) : undefined, icon: b.icon || undefined,
      transition: b.transition || undefined, count: b.count, regions: b.regions, labels: b.labels,
      hover: h?.changes && Object.keys(h.changes).length ? h.changes : undefined, shots: [shot?.file, ...(h?.shots || [])].filter(Boolean),
    };
  });
  const lmap = {};
  for (const x of views.filter((y) => y.vp === 'desktop')) for (const l of x.d.links) {
    const key = [l.region, l.color, l.decoration, l.weight, Math.round(l.size)].join('|');
    const e = lmap[key] || (lmap[key] = { ...l, count: 0, samples: [] });
    e.count += l.count; e.samples = [...new Set([...e.samples, ...l.samples])].slice(0, 4);
  }
  const links = Object.values(lmap).sort((a, b) => b.count - a.count).slice(0, 10).map((l) => {
    const h = hover.find((hv) => (hv.kind === 'link' || hv.kind === 'nav-link') && hv.dx === l.dx);
    return { ...l, dx: undefined, hover: h?.changes && Object.keys(h.changes).length ? h.changes : undefined };
  });
  const imap = {};
  for (const x of views.filter((y) => y.vp === 'desktop')) for (const f of x.d.inputs) {
    const key = [f.tag === 'textarea' ? 'ta' : f.height, f.bg, f.border, f.borderBottom, f.radius, f.fontSize].join('|');
    const e = imap[key] || (imap[key] = { ...f, count: 0, samples: [] });
    e.count += f.count; e.samples = [...new Set([...e.samples, ...f.samples])].slice(0, 5);
  }
  const inputs = Object.values(imap).sort((a, b) => b.count - a.count).slice(0, 6).map((f) => ({ ...f, dx: undefined, shadow: f.shadow ? hexify(f.shadow) : undefined }));
  const cards = [];
  for (const x of views.filter((y) => y.vp === 'desktop')) for (const c of x.d.cards) {
    if (cards.length >= 12) break;
    const h = x.page === run.pages[0] ? hoverFor('card', c.sampleDx) : null;
    const shot = x.page === run.pages[0] ? (hd.components || []).find((s) => s.kind === 'card' && (s.dx === c.surfaceDx || s.dx === c.sampleDx)) : null;
    cards.push({ page: x.page.slug, ...c, style: c.style ? { ...c.style, shadow: c.style.shadow ? hexify(c.style.shadow) : null } : null, sampleDx: undefined, surfaceDx: undefined, hover: h?.changes && Object.keys(h.changes).length ? h.changes : undefined, shots: [shot?.file, ...(h?.shots || [])].filter(Boolean) });
  }
  const footer = {};
  for (const vp of VP_ORDER) if (home[vp]?.data?.footer) footer[vp] = home[vp].data.footer;
  const pinned = (hd.data?.fixed || []).filter((f) => !(f.rect.w >= (hd.data.viewport?.w || 1440) * 0.9 && f.rect.y <= 5)).slice(0, 10).map((f) => ({ ...f, shot: (hd.components || []).find((c) => c.kind === 'pinned' && c.dx === f.dx)?.file, dx: undefined }));
  const ov = new Map();
  for (const p of run.pages) for (const vp of VP_ORDER) for (const o of p.views[vp]?.overlays || []) {
    const k = `${o.kind}|${o.text.slice(0, 80)}`;
    const e = ov.get(k) || { kind: o.kind, text: o.text, el: o.el, cover: 0, seen: [], shot: o.shot };
    e.cover = Math.max(e.cover, o.cover);
    e.seen.push(`${p.slug}/${vp}`);
    ov.set(k, e);
  }
  const overlays = [...ov.values()].slice(0, 12);
  const mobileMenu = home.mobile?.menu || home.tablet?.menu || null;
  const imgs = views.filter((x) => x.vp === 'desktop').flatMap((x) => x.d.images);
  const aspect = {};
  for (const x of views.filter((y) => y.vp === 'desktop')) for (const [k, n] of Object.entries(x.d.hist.aspect)) inc(aspect, k, n);
  const fits = {}, radii = {};
  for (const i of imgs) { inc(fits, i.fit); inc(radii, i.radius); }
  const bgImgs = views.filter((x) => x.vp === 'desktop').flatMap((x) => x.d.bgImages);
  const images = { count: imgs.length, aspect: roundProps(aspect), objectFit: roundProps(fits), radius: roundProps(radii), backgroundImages: bgImgs.length, parallaxFixed: bgImgs.filter((b) => b.attachment === 'fixed').length, filters: [...new Set(imgs.map((i) => i.filter).filter(Boolean))].slice(0, 5), largest: [...imgs].sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 6).map((i) => ({ src: i.src, w: i.w, h: i.h, alt: i.alt, region: i.region })) };
  const iconFonts = {}, svgSizes = {};
  let svgCount = 0;
  for (const x of views.filter((y) => y.vp === 'desktop')) { for (const [k, n] of Object.entries(x.d.hist.iconFonts)) inc(iconFonts, k, n); svgCount += x.d.svgs.count; for (const [k, n] of Object.entries(x.d.svgs.sizes)) inc(svgSizes, k, n); }
  const icons = { iconFonts: roundProps(iconFonts), inlineSvg: svgCount, commonSvgSizes: topN(svgSizes, 6).map(([k]) => k) };
  const embeds = dedupeBy(views.filter((x) => x.vp === 'desktop').flatMap((x) => x.d.embeds), (e) => e.src).slice(0, 12);
  const nav = home.desktop?.data?.nav || null;
  return { header, nav, buttons, links, inputs, cards, footer, pinned, overlays, mobileMenu, images, icons, embeds };
}

function analyzeLayout(run) {
  return run.pages.map((p) => {
    const d = p.views.desktop?.data;
    const shots = Object.fromEntries(VP_ORDER.map((vp) => [vp, p.views[vp]?.shots || null]));
    const sections = (d?.sections || []).map((s) => {
      const mob = p.views.mobile?.data?.sections?.find((m) => m.heading?.text && m.heading.text === s.heading?.text);
      return {
        i: s.i, kind: s.kind, top: s.top, height: s.height, mobileHeight: mob?.height ?? null,
        bg: s.bg?.color, bgImage: s.bg?.image ? hexify(s.bg.image).slice(0, 200) : null, bgKind: s.bg?.imageKind || null, overlays: s.overlays?.map((o) => ({ color: o.color, video: o.video || undefined, image: o.image ? o.image.slice(0, 120) : undefined })),
        paddingY: s.paddingY, columns: s.columns?.cols, columnWidths: s.columns?.widths, gap: s.columns?.gap, align: s.align,
        heading: s.heading ? { level: s.heading.level, text: s.heading.text, size: s.heading.size, weight: s.heading.weight, color: s.heading.color } : null,
        counts: { headings: s.headings, images: s.images, buttons: s.buttons, forms: s.forms, words: s.words },
        shots: VP_ORDER.map((vp) => p.views[vp]?.sectionShots?.find((x) => x.i === s.i)?.file).filter(Boolean),
        mobileShot: p.views.mobile?.sectionShots?.find((x) => mob && x.i === mob.i)?.file || null,
      };
    });
    return { url: p.url, slug: p.slug, title: d?.meta?.title || null, docHeight: { desktop: d?.docH ?? null, tablet: p.views.tablet?.data?.docH ?? null, mobile: p.views.mobile?.data?.docH ?? null }, shots, sections, errors: VP_ORDER.map((vp) => p.views[vp]?.error && `${vp}: ${p.views[vp].error}`).filter(Boolean) };
  });
}

function mergeTech(views) {
  const out = {};
  for (const x of views) for (const [k, v] of Object.entries(x.d.tech || {})) if (v) out[k] = v === true ? true : v;
  return out;
}

function collectWarnings(run, views, type) {
  const w = [...(run.warnings || [])];
  for (const p of run.pages) for (const vp of VP_ORDER) {
    const v = p.views[vp];
    if (!v) continue;
    if (v.error) w.push(`${p.slug} (${vp}) failed: ${v.error}`);
    for (const x of v.warnings || []) w.push(`${p.slug} (${vp}): ${x}`);
    const cfg = run.options.viewportSizes?.[vp];
    const cfgW = cfg ? parseInt(cfg, 10) : null;
    if (cfgW && v.data?.viewport?.w > cfgW + 2) w.push(`${p.slug} (${vp}): content is ${v.data.viewport.w}px wide on a ${cfgW}px screen — horizontal overflow; the browser zoomed out, so this viewport's measurements are distorted.`);
    if (v.data?.stats?.truncated) w.push(`${p.slug} (${vp}): very large DOM — element scan was truncated at ${v.data.stats.visited} elements.`);
  }
  const blocked = run.network?.failedHosts?.filter((h) => h.blocked) || [];
  if (blocked.length) w.push(`Requests to ${blocked.map((h) => h.host).join(', ')} were blocked (network policy/proxy). Fonts, images or styles from these hosts may be missing — allow them and re-run.`);
  for (const f of type.families) {
    // A web font may carry a different internal name than its CSS alias — only a *system* fallback is a problem.
    if (f.faces.length && f.renderedAs.length && f.renderedAs.every((r) => r.endsWith('(system)'))) w.push(`Web font "${f.family}" did not load — text rendered with ${f.renderedAs.join(', ')}. Screenshots show the fallback, not the real typeface.`);
  }
  if (!views.length) w.push('No page could be analyzed.');
  return [...new Set(w)];
}

// ------------------------------------------------------------------------------- outputs
function tokensCss(t, run, vps) {
  const L = [];
  const c = t.color.roles;
  const kebab = (s) => s.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase());
  const famStack = (f) => (f ? `"${f.family}", ${(f.stack || '').split(',').slice(1).map((s) => s.trim()).filter(Boolean).join(', ') || 'sans-serif'}` : null);
  const roles = t.typography.roles.desktop || {};
  const headingFam = t.typography.families.find((f) => f.family === (roles.h1 || roles.h2)?.family) || t.typography.families[0];
  const bodyFam = t.typography.families.find((f) => f.family === roles.body?.family) || t.typography.families[0];
  L.push(`/* Design tokens measured from ${t.$meta.source} on ${t.$meta.extractedAt?.slice(0, 10)} (design-extractor).`);
  L.push('   Role names are inferred from usage — see report.md for the evidence behind each value. */');
  L.push(':root {');
  L.push('  /* color roles */');
  for (const [k, v] of Object.entries(c)) L.push(`  --color-${kebab(k)}: ${v};`);
  L.push('  /* full palette, most used first */');
  t.color.palette.slice(0, 16).forEach((p, i) => L.push(`  --palette-${i + 1}: ${p.hex}; /* ${p.name} · ${p.share}% */`));
  L.push('  /* typography */');
  if (headingFam) L.push(`  --font-heading: ${famStack(headingFam)};`);
  if (bodyFam) L.push(`  --font-body: ${famStack(bodyFam)};`);
  for (const [role, s] of Object.entries(roles)) {
    if (!s?.size) continue;
    const r = kebab(role);
    L.push(`  --text-${r}: ${s.size}px;${s.weight ? ` --weight-${r}: ${s.weight};` : ''}${typeof s.lineHeight === 'number' ? ` --leading-${r}: ${s.lineHeight};` : ''}`);
  }
  L.push('  /* spacing & layout */');
  if (t.spacing.base) L.push(`  --space-unit: ${t.spacing.base.unit}px;`);
  if (t.spacing.container) L.push(`  --container-width: ${t.spacing.container}px;`);
  if (t.spacing.sectionPadding.desktop?.median) L.push(`  --section-padding-y: ${t.spacing.sectionPadding.desktop.median}px;`);
  L.push('  /* shape */');
  for (const [k, v] of Object.entries(t.radius.byComponent)) L.push(`  --radius-${k}: ${v};`);
  t.shadow.slice(0, 4).forEach((s, i) => L.push(`  --shadow-${i + 1}: ${s.value}; /* ${s.on.join(', ')} */`));
  if (t.motion.durations[0]) L.push(`  --duration-base: ${t.motion.durations[0].duration};`);
  if (t.motion.easings[0]) L.push(`  --ease-base: ${t.motion.easings[0].easing};`);
  L.push('}');
  const overrides = (vp, query) => {
    const r = t.typography.roles[vp];
    if (!r) return;
    const lines = [];
    for (const [role, s] of Object.entries(r)) if (s?.size && roles[role]?.size !== s.size) lines.push(`    --text-${kebab(role)}: ${s.size}px;`);
    const pad = t.spacing.sectionPadding[vp]?.median;
    if (pad && pad !== t.spacing.sectionPadding.desktop?.median) lines.push(`    --section-padding-y: ${pad}px;`);
    if (lines.length) L.push('', `@media ${query} {`, '  :root {', ...lines, '  }', '}');
  };
  if (vps.includes('tablet')) overrides('tablet', '(max-width: 1024px)');
  if (vps.includes('mobile')) overrides('mobile', '(max-width: 767px)');
  return L.join('\n') + '\n';
}

function tailwindCss(t) {
  const c = t.color.roles;
  const r = t.typography.roles.desktop || {};
  const fam = (name) => { const f = t.typography.families.find((x) => x.family === name); return f ? `"${f.family}", ${(f.stack || '').split(',').slice(1).map((s) => s.trim()).filter(Boolean).join(', ') || 'sans-serif'}` : null; };
  const L = [`/* Tailwind CSS v4 theme measured from ${t.$meta.source} — paste into globals.css. */`, '@theme inline {'];
  const map = { primary: c.primary, secondary: c.secondary, accent: c.accent, background: c.background, surface: c.surface, foreground: c.text, muted: c.textMuted, dark: c.dark, border: c.border, 'on-primary': c.onPrimary };
  for (const [k, v] of Object.entries(map)) if (v) L.push(`  --color-${k}: ${v};`);
  const body = fam(r.body?.family || t.typography.families[0]?.family);
  const heading = fam((r.h1 || r.h2)?.family);
  if (body) L.push(`  --font-sans: ${body};`);
  if (heading) L.push(`  --font-heading: ${heading};`);
  for (const role of ['h1', 'h2', 'h3', 'h4', 'body', 'small', 'lead']) {
    const s = r[role];
    if (!s?.size) continue;
    L.push(`  --text-${role}: ${round(s.size / 16, 3)}rem;${typeof s.lineHeight === 'number' ? ` --text-${role}--line-height: ${s.lineHeight};` : ''}${s.weight ? ` --text-${role}--font-weight: ${s.weight};` : ''}`);
  }
  for (const [k, v] of Object.entries(t.radius.byComponent)) L.push(`  --radius-${k}: ${v};`);
  t.shadow.slice(0, 3).forEach((s, i) => L.push(`  --shadow-site-${i + 1}: ${s.value};`));
  if (t.spacing.container) L.push(`  --container-site: ${t.spacing.container}px;`);
  L.push('}');
  if (t.breakpoints.list.length) L.push('', `/* Site breakpoints (${t.breakpoints.strategy}): ${t.breakpoints.list.slice(0, 6).map((b) => `${b.type}-width ${b.px}px`).join(', ')} */`);
  return L.join('\n') + '\n';
}

function paletteSvg(color) {
  const items = [...Object.entries(color.roles).map(([role, hex]) => ({ hex, role })), ...color.palette.filter((p) => !Object.values(color.roles).includes(p.hex)).slice(0, 12).map((p) => ({ hex: p.hex, role: `${p.share}%` }))];
  const cols = 6, w = 150, h = 118, gap = 12;
  const rows = Math.ceil(items.length / cols) || 1;
  const W = cols * w + (cols - 1) * gap + 32, H = rows * h + (rows - 1) * gap + 32;
  const cell = ({ hex, role }, i) => {
    const x = 16 + (i % cols) * (w + gap), y = 16 + Math.floor(i / cols) * (h + gap);
    const fg = contrast(hex, '#000000') >= contrast(hex, '#ffffff') ? '#111111' : '#ffffff';
    return `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${hex}" stroke="#00000022"/>` +
      `<text x="${x + 12}" y="${y + 26}" fill="${fg}" font-size="14" font-weight="700">${role}</text>` +
      `<text x="${x + 12}" y="${y + h - 32}" fill="${fg}" font-size="15" font-family="ui-monospace, Menlo, Consolas, monospace">${hex}</text>` +
      `<text x="${x + 12}" y="${y + h - 13}" fill="${fg}" font-size="12" opacity="0.85">${colorName(hex)}</text></g>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Helvetica, Arial, sans-serif"><rect width="100%" height="100%" fill="#ffffff"/>${items.map(cell).join('')}</svg>\n`;
}

function contentMd(page) {
  const d = page.views.desktop?.data;
  const L = [`# ${d?.meta?.title || page.slug}`, '', `Source: ${page.url}`, ''];
  if (!d) return L.concat(['(page failed to load)']).join('\n');
  if (d.meta.description) L.push(`> ${d.meta.description}`, '');
  for (const s of d.sections) {
    L.push(`## ${s.i + 1}. ${s.kind} — bg ${s.bg?.color}${s.bg?.image ? ' + image' : ''} · ${Math.round(s.height)}px · ${s.columns?.cols || 1} col`);
    for (const it of s.items) {
      if (/^h[1-6]$/.test(it.t)) L.push(`- **${it.t.toUpperCase()}** ${it.text}`);
      else if (it.t === 'button') L.push(`- [button] ${it.text}${it.href ? ` → ${it.href}` : ''}`);
      else if (it.t === 'img') L.push(`- (image: ${it.text})`);
      else L.push(`- ${it.text}`);
    }
    L.push('');
  }
  return L.join('\n');
}

function stripRaw(run) {
  return JSON.parse(JSON.stringify(run, (k, v) => (k === 'inlineCss' ? undefined : k === 'svg' && typeof v === 'string' ? `(${v.length} chars, see brand/)` : v)));
}

// ------------------------------------------------------------------------------- report.md
function reportMd(x) {
  const { run, tokens: t, color, type, space, shape, breakpoints, motion, components: cp, layout, tech, warnings, vps } = x;
  const L = [];
  const h = (lvl, s) => L.push('', `${'#'.repeat(lvl)} ${s}`, '');
  const table = (head, rows) => { if (!rows.length) { L.push('_none found_'); return; } L.push(`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map((c) => esc(c ?? '—')).join(' | ')} |`)); };
  const img = (f, w = 360) => (f ? `<img src="${f}" width="${w}">` : '—');
  const styleStr = (s) => (s ? `${s.weight ?? ''} ${s.size}px${typeof s.lineHeight === 'number' ? '/' + s.lineHeight : ''} ${s.family}${s.letterSpacing ? ` · ls ${s.letterSpacing}px` : ''}${s.transform ? ' · ' + s.transform : ''}` : '—');
  const home = layout[0];

  L.push(`# Design report — ${new URL(run.target).host || run.target}`, '');
  L.push(`Measured from the live, rendered site with a real browser (Chromium ${run.browser}). Generated ${t.$meta.extractedAt?.replace('T', ' ').slice(0, 16)} UTC by design-extractor ${run.tool.version}.`);
  L.push('', `**Pages:** ${run.pages.length} · **Viewports:** ${vps.map((v) => `${v} (${run.options.viewportSizes[v]})`).join(', ')} · **Title:** ${home?.title || '—'}`);
  const WIDGET_KEYS = ['whatsapp', 'cookieBanner', 'accessibilityWidget'];
  const stack = Object.entries(tech).filter(([k, v]) => v && k !== 'generator' && !WIDGET_KEYS.includes(k)).map(([k]) => k);
  const widgets = WIDGET_KEYS.filter((k) => tech[k]);
  L.push('', `**Built with:** ${tech.generator ? code(tech.generator) + ' · ' : ''}${stack.join(', ') || 'plain HTML/CSS'}${widgets.length ? ` · **widgets:** ${widgets.join(', ')}` : ''}`);
  const dirInfo = run.pages[0]?.views.desktop?.data?.meta;
  if (dirInfo) L.push('', `**Language / direction:** ${dirInfo.lang || '—'} / ${dirInfo.dir || '—'}`);
  if (warnings.length) { h(2, '⚠️ Warnings'); for (const w of warnings) L.push(`- ${w}`); }

  h(2, 'Screenshots');
  L.push('| desktop | tablet | mobile |', '| --- | --- | --- |');
  L.push(`| ${VP_ORDER.map((vp) => img(home?.shots?.[vp]?.full?.[0], vp === 'desktop' ? 420 : 220)).join(' | ')} |`);
  L.push('', 'Full-page and above-the-fold shots for every page are in `screenshots/<viewport>/`; one image per page section in `sections/`.');

  h(2, '1. Color');
  L.push('![palette](palette.svg)', '');
  h(3, 'Roles (inferred from usage)');
  table(['role', 'hex', 'name', 'contrast on white'], Object.entries(color.roles).map(([k, v]) => [k, code(v), colorName(v), contrast(v, '#ffffff')]));
  h(3, 'Palette by usage');
  L.push('`share` blends painted area, amount of text and number of elements. Shades that differ by less than ΔE2000 2.3 are merged.', '');
  table(['#', 'hex', 'name', 'share', 'used for', 'CSS variables', 'merged shades', 'seen on'], color.palette.slice(0, 22).map((c, i) => [i + 1, code(c.hex), c.name, c.share + '%', (c.widgetOnly ? 'floating widget · ' : '') + topN(c.props, 3).map(([k]) => k).join(', '), c.vars?.join(', ') || '', c.members.slice(1, 4).join(' '), c.samples[0] || '']));
  if (color.translucent.length) { h(3, 'Translucent colors (overlays, scrims, shadows)'); table(['rgba', 'used for'], color.translucent.map((c) => [code(toRgbString(c.hex)), topN(c.props, 3).map(([k]) => k).join(', ')])); }
  if (color.gradients.length) { h(3, 'Gradients'); table(['gradient', 'count', 'on'], color.gradients.map((g) => [code(g.value), g.count, g.on])); }
  const decl = Object.entries(color.declared);
  if (decl.length) { h(3, 'Color variables declared in CSS'); table(['variable', 'value'], decl.slice(0, 40).map(([k, v]) => [code(k), code(v)])); }

  const dv = Object.entries(t.designVariables || {});
  h(2, '2. Typography');
  table(['family', 'share of text', 'weights used', 'source', 'loaded faces', 'rendered as'], type.families.map((f) => [code(f.family), f.share + '%', f.weightsUsed.join(', '), f.source, f.loaded.join(', ') || f.faces.join(', ') || '—', f.renderedAs.join(', ') || '—']));
  h(3, 'Text roles per viewport');
  const roleNames = [...new Set(vps.flatMap((vp) => Object.keys(type.roles[vp] || {})))].sort((a, b) => roleOrder(a) - roleOrder(b));
  const alts = (s) => (s?.alternatives?.length ? ` <sub>also ${s.alternatives.map((a) => `${a.size}px/${a.weight}`).join(', ')}</sub>` : '');
  table(['role', ...vps, 'color', 'sample'], roleNames.map((r) => [r, ...vps.map((vp) => styleStr(type.roles[vp]?.[r]) + alts(type.roles[vp]?.[r])), type.roles.desktop?.[r]?.color || '', type.roles.desktop?.[r]?.samples?.[0] || '']));
  h(3, 'Type scale (desktop)');
  table(['size', 'weight', 'family', 'line-height', 'share', 'used as', 'sample'], (type.scale.desktop || []).map((s) => [s.size + 'px', s.weight, s.family, typeof s.lineHeight === 'number' ? `${s.lineHeight}px (${round(s.lineHeight / s.size, 2)})` : s.lineHeight, s.share + '%', s.roles.join(', '), s.sample]));
  if (type.lineHeights.length) L.push('', `Most common line-height ratios: ${type.lineHeights.map((l) => `${l.ratio} (${l.share}%)`).join(', ')}`);
  if (dv.length) {
    h(3, 'Design variables declared by the site (typography, spacing, radius…)');
    L.push('Builders such as Elementor (`--e-global-typography-*`) and WordPress (`--wp--preset--*`) store the official design tokens here.', '');
    table(['variable', 'value'], dv.slice(0, 60).map(([k, v]) => [code(k), code(v)]));
  }

  h(2, '3. Spacing & layout');
  L.push(`- **Spacing base unit:** ${space.base ? `${space.base.unit}px (${space.base.fit}% of spacing values are multiples)` : 'irregular (no single base unit)'}`);
  L.push(`- **Common spacing values:** ${space.scale.map((v) => v + 'px').join(', ')}`);
  L.push(`- **Content container:** ${space.container ? space.container + 'px' : '—'} (centered widths: ${space.centeredWidths.map((c) => `${c.width}px×${c.count}`).join(', ') || '—'})`);
  L.push(`- **max-width values:** ${space.maxWidths.map((m) => `${m.value}×${m.count}`).join(', ') || '—'}`);
  L.push(`- **Section vertical padding:** ${vps.map((vp) => `${vp} ${space.sectionPadding[vp]?.median ?? '—'}px`).join(' · ')}`);
  L.push(`- **Typical section height:** ${vps.map((vp) => `${vp} ${space.sectionHeights[vp] ? Math.round(space.sectionHeights[vp]) + 'px' : '—'}`).join(' · ')}`);
  L.push(`- **Gaps:** ${space.gaps.map((g) => g.px + 'px').join(', ') || '—'} · **Section columns:** ${Object.entries(space.columns).map(([k, n]) => `${k}×${n}`).join(', ') || '—'} · **Layout engines:** ${Object.entries(space.layoutEngines).map(([k, n]) => `${k} ${n}`).join(', ') || '—'}`);

  h(2, '4. Shape — radius, shadow, border');
  table(['radius', 'count', 'used on', 'example'], shape.radius.values.map((r) => [code(r.value), r.count, r.on.join(', '), r.samples[0] || '']));
  L.push('');
  table(['box-shadow', 'count', 'used on'], shape.shadows.map((s) => [code(s.value), s.count, s.on.join(', ')]));
  L.push('');
  table(['border', 'count', 'used on'], shape.borders.map((b) => [code(b.value), b.count, b.on.join(', ')]));
  if (shape.textShadows.length) { L.push(''); table(['text-shadow', 'count'], shape.textShadows.map((s) => [code(s.value), s.count])); }
  if (shape.filters.length) { L.push(''); table(['filter / backdrop-filter', 'count', 'on'], shape.filters.map((f) => [code(f.value), f.count, f.on])); }

  h(2, '5. Breakpoints');
  L.push(`Strategy: **${breakpoints.strategy}**`, '');
  table(['query', 'rules inside'], breakpoints.list.map((b) => [`${b.type}-width: ${b.px}px`, b.rules]));
  if (breakpoints.features.length) L.push('', `Other media features: ${breakpoints.features.map((f) => `${f.feature} (${f.rules})`).join(', ')}`);

  h(2, '6. Components');
  h(3, 'Header');
  for (const vp of VP_ORDER) {
    const hd = cp.header[vp];
    if (!hd) continue;
    L.push(`- **${vp}:** height ${hd.height}px · position ${code(hd.position)}${hd.pinned?.length ? ` (pinned: ${hd.pinned.map((p) => p.position).join(', ')})` : ''} · bg ${code(hd.bg || 'transparent')}${hd.shadow ? ` · shadow ${code(hexify(hd.shadow))}` : ''}${hd.borderBottom ? ` · border-bottom ${code(hd.borderBottom)}` : ''} · sticky on scroll: **${hd.sticky === null ? '?' : hd.sticky ? 'yes' : 'no'}**${hd.revealOnScrollUp ? ' (reveals on scroll-up)' : ''}${hd.logo ? ` · logo ${Math.round(hd.logo.w)}×${Math.round(hd.logo.h)} ${hd.logo.tag}` : ''}`);
    if (hd.changesOnScroll && Object.keys(hd.changesOnScroll).length) L.push(`  - changes after scrolling: ${Object.entries(hd.changesOnScroll).map(([k, v]) => `${k}: ${v}`).join('; ')}`);
    if (hd.shots?.length) L.push(`  - ${hd.shots.map((s) => `![header ${vp}](${s})`).join(' ')}`);
  }
  if (cp.nav) {
    L.push(`- **Navigation:** ${cp.nav.count} links (${cp.nav.items.slice(0, 12).join(' · ')}) · ${styleStr(cp.nav.style)} · color ${code(cp.nav.style?.color)} · gap ≈ ${cp.nav.gap ?? '—'}px · padding ${code(cp.nav.padding)}${cp.nav.dropdowns ? ` · ${cp.nav.dropdowns} dropdown menus` : ''}`);
    if (cp.nav.ctas?.length) L.push(`- **Header CTAs:** ${cp.nav.ctas.map((c) => c.text).join(', ')}`);
    if (cp.nav.phones?.length) L.push(`- **Phone in header:** ${cp.nav.phones.join(', ')}`);
    L.push(`- social icons: ${cp.nav.social} · search: ${cp.nav.search ? 'yes' : 'no'} · cart: ${cp.nav.cart ? 'yes' : 'no'}`);
  }
  if (cp.mobileMenu) {
    const m = cp.mobileMenu;
    L.push(`- **Mobile menu:** ${m.found ? (m.opened ? `opens a panel — ${m.panel ? `${code(m.panel.position)} ${Math.round(m.panel.rect.w)}×${Math.round(m.panel.rect.h)}, bg ${code(m.panel.bg)}, links ${styleStr(m.panel.linkStyle)}` : 'panel detected'}` : 'toggle found but no new panel detected') : 'no hamburger toggle detected'}${m.shot ? `<br>${img(m.shot, 220)}` : ''}`);
  }
  h(3, 'Buttons');
  table(['#', 'preview', 'background', 'text', 'border', 'radius', 'font', 'padding', 'height', 'count', 'labels', 'hover'], cp.buttons.map((b) => [b.variant, b.shots[0] ? `<img src="${b.shots[0]}" height="44">` : '', code(b.gradient || b.bg), code(b.color), code(b.border), `${b.radius} (${b.shape})`, b.font + (b.textTransform ? ' ' + b.textTransform : ''), code(b.padding), b.height + 'px', b.count, b.labels.slice(0, 3).join(' / '), b.hover ? Object.entries(b.hover).map(([k, v]) => `${k}: ${v}`).join('; ') : '']));
  const hoverPairs = cp.buttons.filter((b) => b.shots.length >= 3);
  if (hoverPairs.length) { L.push('', 'Hover — before → after:', ''); for (const b of hoverPairs.slice(0, 6)) L.push(`- variant ${b.variant}: <img src="${b.shots[1]}" height="40"> → <img src="${b.shots[2]}" height="40">`); }
  h(3, 'Links');
  table(['region', 'color', 'decoration', 'weight', 'size', 'samples', 'hover'], cp.links.map((l) => [l.region, code(l.color), l.decoration, l.weight, l.size + 'px', l.samples.join(' / '), l.hover ? Object.entries(l.hover).map(([k, v]) => `${k}: ${v}`).join('; ') : '']));
  h(3, 'Form fields');
  table(['type', 'height', 'background', 'border', 'bottom border', 'radius', 'font', 'placeholder color', 'padding', 'count', 'examples'], cp.inputs.map((f) => [f.type, f.height + 'px', code(f.bg), code(f.border), code(f.borderBottom), f.radius, `${f.fontSize}px ${f.fontFamily}`, code(f.placeholderColor), code(f.padding), f.count, f.samples.join(' / ')]));
  h(3, 'Cards & repeated items');
  table(['page', 'preview', 'items', 'per row', 'size', 'surface', 'radius', 'shadow', 'image', 'heading', 'hover'], cp.cards.map((c) => [c.page, c.shots[0] ? `<img src="${c.shots[0]}" width="160">` : '', c.count, c.perRow, `${c.w}×${c.h}`, code(c.style?.bg || c.style?.bgImage || 'none') + (c.style?.border ? ` ${code(c.style.border)}` : ''), c.style?.radius, code(c.style?.shadow), c.img ? `${c.img.w}×${c.img.h} (${c.img.ratio}) ${c.img.fit}` : '', c.heading ? `${styleStr(c.heading)} "${c.heading.text}"` : '', c.hover ? Object.entries(c.hover).map(([k, v]) => `${k}: ${v}`).join('; ') : '']));
  h(3, 'Footer');
  for (const vp of VP_ORDER) {
    const f = cp.footer[vp];
    if (!f) continue;
    L.push(`- **${vp}:** ${Math.round(f.height)}px · bg ${code(f.bg?.color)}${f.bg?.image ? ' + image' : ''} · text ${f.textColors.map(code).join(' ')} · ${f.columns?.cols || 1} columns · headings ${styleStr(f.headingStyle)} · links ${styleStr(f.linkStyle)} ${code(f.linkStyle?.color)} · social icons ${f.social}${f.copyright ? ` · “${f.copyright}”` : ''}`);
  }
  if (cp.pinned.length) { h(3, 'Floating / pinned elements'); table(['element', 'position', 'place', 'size', 'bg', 'radius', 'text / link', 'shot'], cp.pinned.map((p) => [p.el, p.position, `x ${Math.round(p.rect.x)}, y ${Math.round(p.rect.y)}`, `${Math.round(p.rect.w)}×${Math.round(p.rect.h)}`, code(p.bg), p.radius, p.text || p.href || '', p.shot ? `<img src="${p.shot}" height="40">` : ''])); }
  if (cp.overlays.length) { h(3, 'Popups & banners (hidden before capture)'); table(['kind', 'covers', 'text', 'seen on', 'shot'], cp.overlays.map((o) => [o.kind, Math.round(o.cover * 100) + '%', o.text.slice(0, 110), `${o.seen.length} views (${o.seen.slice(0, 3).join(', ')}${o.seen.length > 3 ? '…' : ''})`, o.shot ? `[view](${o.shot})` : ''])); }
  h(3, 'Images & icons');
  L.push(`- ${cp.images.count} images (desktop, all pages) · aspect: ${Object.entries(cp.images.aspect).map(([k, n]) => `${k} ${n}`).join(', ') || '—'} · object-fit: ${Object.entries(cp.images.objectFit).map(([k, n]) => `${k} ${n}`).join(', ') || '—'} · image radius: ${Object.entries(cp.images.radius).slice(0, 3).map(([k, n]) => `${k} ×${n}`).join(', ') || '—'}`);
  L.push(`- ${cp.images.backgroundImages} CSS background images${cp.images.parallaxFixed ? ` (${cp.images.parallaxFixed} with background-attachment: fixed → parallax)` : ''}${cp.images.filters.length ? ` · filters: ${cp.images.filters.map(code).join(', ')}` : ''}`);
  L.push(`- icons: ${Object.entries(cp.icons.iconFonts).map(([k, n]) => `${k} ×${n}`).join(', ') || 'no icon font'} · ${cp.icons.inlineSvg} inline SVGs (common sizes ${cp.icons.commonSvgSizes.join(', ') || '—'})`);
  if (cp.embeds.length) L.push(`- embeds: ${cp.embeds.map((e) => `${e.type} ${e.host || ''}${e.autoplay ? ' autoplay' : ''}`).join(', ')}`);

  h(2, '7. Motion & interaction');
  L.push(`- **Libraries:** ${motion.libraries.join(', ') || 'none detected (CSS only)'}`);
  L.push(`- **Durations:** ${motion.durations.map((d) => `${d.duration} ×${d.count}`).join(', ') || '—'} · **Easings:** ${motion.easings.map((e) => `${code(e.easing)} ×${e.count}`).join(', ') || '—'}`);
  for (const [k, hh] of Object.entries(motion.entrance)) L.push(`- **Entrance animations (${k}):** ${Object.entries(hh).map(([n, c]) => `${n} ×${c}`).join(', ')}`);
  if (motion.running.length) L.push(`- **Running CSS animations:** ${motion.running.map((a) => `${code(a.value)} ×${a.count}`).join(', ')}`);
  if (motion.keyframes.length) L.push(`- **@keyframes defined:** ${motion.keyframes.slice(0, 30).map((k) => k.name).join(', ')}`);
  L.push('');
  table(['transition', 'count', 'on'], motion.transitions.map((tr) => [code(tr.value), tr.count, tr.on.join(', ')]));
  const hv = motion.hover.filter((m) => m.changes && Object.keys(m.changes).length);
  if (hv.length) { h(3, 'Measured hover effects'); table(['element', 'label', 'what changes'], hv.map((m) => [`${m.kind} ${m.idx}`, m.label, Object.entries(m.changes).map(([k, v]) => `${k}: ${v}`).join('; ')])); }

  h(2, '8. Page layouts');
  for (const p of layout) {
    h(3, `${p.slug} — ${p.title || ''}`);
    L.push(`${p.url} · page height ${VP_ORDER.map((vp) => p.docHeight[vp] ? `${vp} ${p.docHeight[vp]}px` : null).filter(Boolean).join(' · ')}`);
    if (p.errors.length) L.push('', ...p.errors.map((e) => `- ⚠️ ${e}`));
    L.push('');
    table(['#', 'kind', 'height (desk / mob)', 'background', 'padding-y', 'columns', 'align', 'heading', 'shot'], p.sections.map((s) => [s.i + 1, s.kind, `${Math.round(s.height)} / ${s.mobileHeight ? Math.round(s.mobileHeight) : '—'}`, (s.bgKind === 'gradient' ? code(s.bgImage) : code(s.bg) + (s.bgImage ? ` + ${s.bgKind || 'image'}` : '')) + (s.overlays?.length ? ` + overlay ${s.overlays.map((o) => code(o.color || (o.video ? 'video' : 'image'))).join(' ')}` : ''), s.paddingY.join(' / '), s.columns + (s.columnWidths && s.columns > 1 ? ` (${s.columnWidths.join('/')}%)` : ''), s.align, s.heading ? `H${s.heading.level} ${s.heading.size}px ${s.heading.weight} “${s.heading.text.slice(0, 60)}”` : '', s.shots[0] ? `<img src="${s.shots[0]}" width="220">` : '']));
    L.push('', `Text outline: [pages/${p.slug}.md](pages/${p.slug}.md)`);
  }

  h(2, '9. Sources & files');
  const n = run.network || {};
  L.push(`- Stylesheets: ${n.cssFiles ?? 0} files (+ inline <style> blocks) · ${run.css?.rules ?? 0} rules · ${run.css?.vars?.length ?? 0} custom properties · ${run.css?.fontFaces?.length ?? 0} @font-face · ${run.css?.keyframes?.length ?? 0} @keyframes${run.css?.errors?.length ? ` · parse errors: ${run.css.errors.length}` : ''}`);
  L.push(`- Assets seen: ${Object.entries(n.byType || {}).map(([k, v]) => `${k} ${v}`).join(', ') || '—'} · saved locally: ${n.savedMb ?? 0} MB (fonts/ and images/ are git-ignored)`);
  if (n.failedHosts?.length) L.push(`- Failed requests by host: ${n.failedHosts.map((f) => `${f.host} ×${f.count}${f.blocked ? ' (blocked)' : ''}`).join(', ')}`);
  L.push('- Files: `tokens.json` (all measured tokens) · `tokens.css` (CSS variables) · `tailwind-theme.css` (Tailwind v4 @theme) · `data/raw.json` (every measurement) · `css/` (original stylesheets) · `pages/*.html` (rendered DOM) · `pages/*.md` (text outline)');
  return L.join('\n') + '\n';
}
const roleOrder = (r) => ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'lead', 'body', 'small', 'nav', 'button', 'input', 'footerLink'].indexOf(r) + 1 || 99;
