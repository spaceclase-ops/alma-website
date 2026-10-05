#!/usr/bin/env node
// Design Extractor — captures a live website's visual design with a real browser:
// tokens (colors, type, spacing, radius, shadows, motion), components, page layouts and screenshots.
//
//   node extract.mjs https://www.example.co.il            # home + up to 6 internal pages
//   node extract.mjs example.co.il --pages 10 --headed    # show the browser (captcha / cookie walls)
//   node extract.mjs ./saved-page/index.html              # a page saved with "Save as → Web page, complete"
//
// Output: sites/<host>/report.md, tokens.json, tokens.css, tailwind-theme.css, screenshots/, sections/, ...
import { chromium, devices } from 'playwright';
import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildReport } from './analyze.mjs';

const VERSION = '1.0.0';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const INPAGE = fs.readFileSync(path.join(HERE, 'inpage.js'), 'utf8');

const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  tablet: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: devices['iPad Mini'].userAgent },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: devices['iPhone 13'].userAgent },
};

// Entrance animations (AOS, WOW, Elementor) keep content invisible until it scrolls into view;
// after the scroll-through we pin everything to its final, visible state so screenshots are complete.
// content-visibility:auto (WP Rocket "lazy render" and similar) skips painting off-screen
// sections, which leaves them blank in full-page and section screenshots.
const STABILIZE_CSS = `
html { scroll-behavior: auto !important; }
*, *::before, *::after { content-visibility: visible !important; }
[data-aos] { opacity: 1 !important; transform: none !important; visibility: visible !important; }
.elementor-invisible { visibility: visible !important; opacity: 1 !important; }
.wow { visibility: visible !important; animation-name: none !important; }
.elementor-motion-effects-layer { opacity: 1 !important; }
`;
// Elementor's scroll "transparency" effect fades background layers in and out by scroll
// position — at scrollY 0 everything further down is at opacity 0 (pinned visible above).

// Lazy-load libraries (WP Rocket, lazysizes, a3) park a data: placeholder in src and only swap
// in the real image when it scrolls — or slides — into view. Carousel slides never do.
async function forceLazyMedia(page) {
  return page.evaluate(async () => {
    const swapped = [];
    for (const el of document.querySelectorAll('img, source')) {
      const src = el.getAttribute('data-lazy-src') || el.getAttribute('data-src');
      const set = el.getAttribute('data-lazy-srcset') || el.getAttribute('data-srcset');
      const cur = el.getAttribute(el.tagName === 'SOURCE' ? 'srcset' : 'src') || '';
      if (el.tagName === 'IMG' && el.loading === 'lazy') el.loading = 'eager';
      if (!src && !set) continue;
      if (cur && !cur.startsWith('data:')) continue;
      if (set) el.setAttribute('srcset', set);
      if (src && el.tagName === 'IMG') el.setAttribute('src', src);
      swapped.push(el);
    }
    const imgs = swapped.filter((e) => e.tagName === 'IMG');
    await Promise.race([Promise.all(imgs.map((i) => (i.decode ? i.decode().catch(() => {}) : null))), new Promise((r) => setTimeout(r, 8000))]);
    return swapped.length;
  }).catch(() => 0);
}

const HELP = `Design Extractor ${VERSION}

Usage: node extract.mjs <url | saved .html file> [options]

  --pages <n>            internal pages to capture besides the home page (default 6)
  --urls <u1,u2,...>     capture exactly these extra pages instead of crawling
  --viewports <list>     desktop,tablet,mobile (default: all three)
  --out <dir>            output folder (default: sites/<host>)
  --wait <sec>           extra settle time after each page load (default 2)
  --timeout <ms>         navigation timeout (default 60000)
  --headed               show the browser window (solve a captcha / cookie wall by hand)
  --no-hover             skip hover-state capture
  --no-sections          skip per-section screenshots
  --max-assets-mb <n>    cap for fonts/images saved locally (default 80)
  --extra-ca <pem>       trust this CA in the browser (a TLS-inspecting proxy). Auto-detected
                         in Claude Code cloud sessions; also read from DX_EXTRA_CA.
`;

// ---------------------------------------------------------------------------------- CLI
function parseArgs(argv) {
  const o = { target: null, pages: 6, urls: [], viewports: ['desktop', 'tablet', 'mobile'], out: null, wait: 2, timeout: 60000, headed: false, hover: true, sectionShots: true, maxAssetsMb: 80 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const val = () => { const v = argv[++i]; if (v === undefined) throw new Error(`Missing value for ${a}`); return v; };
    if (a === '-h' || a === '--help') o.help = true;
    else if (a === '--pages') o.pages = Math.max(0, parseInt(val(), 10) || 0);
    else if (a === '--urls') o.urls = val().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--viewports') o.viewports = val().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--out') o.out = val();
    else if (a === '--wait') o.wait = Math.max(0, parseFloat(val()) || 0);
    else if (a === '--timeout') o.timeout = Math.max(5000, parseInt(val(), 10) || 60000);
    else if (a === '--headed') o.headed = true;
    else if (a === '--no-hover') o.hover = false;
    else if (a === '--no-sections') o.sectionShots = false;
    else if (a === '--max-assets-mb') o.maxAssetsMb = Math.max(0, parseFloat(val()) || 0);
    else if (a === '--extra-ca') o.extraCa = val();
    else if (a.startsWith('-')) throw new Error(`Unknown option ${a}\n\n${HELP}`);
    else if (!o.target) o.target = a;
    else throw new Error(`Unexpected argument "${a}"`);
  }
  for (const v of o.viewports) if (!VIEWPORTS[v]) throw new Error(`Unknown viewport "${v}" — use ${Object.keys(VIEWPORTS).join(', ')}`);
  o.viewports = ['desktop', ...o.viewports.filter((v) => v !== 'desktop')];
  return o;
}

function normalizeTarget(t) {
  if (/^(https?|file):\/\//i.test(t)) return new URL(t).href;
  if (fs.existsSync(t)) {
    const p = path.resolve(t);
    return pathToFileURL(fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p).href;
  }
  return new URL('https://' + t).href;
}
const siteSlug = (u) => {
  const url = new URL(u);
  if (url.protocol === 'file:') return 'local-' + path.basename(path.dirname(fileURLToPath(url))).replace(/[^\w.-]+/g, '_');
  return url.host.replace(/^www\./, '').replace(/[^\w.-]+/g, '_');
};
function pageSlug(u, n) {
  const url = new URL(u);
  let p = url.pathname;
  try { p = decodeURIComponent(p); } catch { /* keep encoded */ }
  if (url.protocol === 'file:') p = path.basename(p, path.extname(p)).replace(/^index$/, '');
  p = p.replace(/^\/+|\/+$/g, '').replace(/[^\w֐-׿-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
  return `${String(n).padStart(2, '0')}-${p || 'home'}`;
}
const log = (...a) => console.log(...a);
const errLine = (e) => String(e?.message || e).split('\n')[0];

// ---------------------------------------------------------------------------------- output folders
const GENERATED = ['screenshots', 'sections', 'components', 'css', 'fonts', 'images', 'pages', 'brand', 'data', 'report.md', 'tokens.json', 'tokens.css', 'tailwind-theme.css', 'palette.svg'];
async function prepareOut(root) {
  await fsp.mkdir(root, { recursive: true });
  // Only our own generated outputs are replaced — hand-written notes in the folder survive re-runs.
  for (const g of GENERATED) await fsp.rm(path.join(root, g), { recursive: true, force: true });
  const dirs = { root };
  for (const d of ['sections', 'components', 'css', 'fonts', 'images', 'pages', 'brand', 'data']) { dirs[d] = path.join(root, d); await fsp.mkdir(dirs[d], { recursive: true }); }
  dirs.screens = path.join(root, 'screenshots');
  for (const v of Object.keys(VIEWPORTS)) await fsp.mkdir(path.join(dirs.screens, v), { recursive: true });
  dirs.rel = (f) => path.relative(root, f).split(path.sep).join('/');
  return dirs;
}

// ---------------------------------------------------------------------------------- network capture
const MIME_EXT = { 'text/css': '.css', 'font/woff2': '.woff2', 'font/woff': '.woff', 'font/ttf': '.ttf', 'font/otf': '.otf', 'application/font-woff': '.woff', 'application/font-woff2': '.woff2', 'application/x-font-ttf': '.ttf', 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/avif': '.avif', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'image/x-icon': '.ico', 'image/vnd.microsoft.icon': '.ico' };
class NetworkLog {
  constructor(dirs, maxBytes) {
    this.dirs = dirs; this.maxBytes = maxBytes; this.saved = 0;
    this.entries = new Map(); this.css = new Map(); this.failed = []; this.pending = new Set(); this.names = new Set();
  }
  attach(ctx) {
    ctx.on('response', (res) => { const p = this.onResponse(res).catch(() => {}); this.pending.add(p); p.finally(() => this.pending.delete(p)); });
    ctx.on('requestfailed', (req) => {
      if (this.failed.length < 800) this.failed.push({ url: req.url().slice(0, 300), type: req.resourceType(), error: req.failure()?.errorText || 'failed' });
    });
  }
  fileName(url, dir, ext) {
    let base = 'asset';
    try { const u = new URL(url); base = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || u.host); } catch { /* keep default */ }
    base = base.replace(/[^\w.֐-׿-]+/g, '_').slice(-80) || 'asset';
    if (!path.extname(base) && ext) base += ext;
    let name = base;
    for (let i = 2; this.names.has(`${dir}/${name}`); i++) name = `${i}-${base}`;
    this.names.add(`${dir}/${name}`);
    return name;
  }
  async onResponse(res) {
    const type = res.request().resourceType();
    if (!['stylesheet', 'font', 'image', 'media'].includes(type)) return;
    const url = res.url();
    if (url.startsWith('data:') || this.entries.has(url)) return;
    const status = res.status();
    const mime = (res.headers()['content-type'] || '').split(';')[0].trim().toLowerCase();
    const entry = { url, type, status, mime, bytes: null, file: null };
    this.entries.set(url, entry);
    if (status < 200 || status >= 300 || type === 'media') return;
    const body = await res.body();
    entry.bytes = body.length;
    if (type === 'stylesheet') {
      const name = this.fileName(url, 'css', '.css');
      entry.file = `css/${name}`;
      this.css.set(url, { name, text: body.toString('utf8') });
      await fsp.writeFile(path.join(this.dirs.css, name), body);
      return;
    }
    if (body.length > (type === 'font' ? 15e6 : 8e6) || this.saved + body.length > this.maxBytes) return;
    this.saved += body.length;
    const dir = type === 'font' ? 'fonts' : 'images';
    const name = this.fileName(url, dir, MIME_EXT[mime] || '');
    entry.file = `${dir}/${name}`;
    await fsp.writeFile(path.join(this.dirs[dir], name), body);
  }
  async flush() { await Promise.allSettled([...this.pending]); }
  summary() {
    const byType = {};
    for (const e of this.entries.values()) byType[e.type] = (byType[e.type] || 0) + 1;
    const hosts = {};
    for (const f of this.failed) {
      let host = '?';
      try { host = new URL(f.url).host; } catch { /* ignore */ }
      const h = (hosts[host] = hosts[host] || { host, count: 0, blocked: false, errors: {} });
      h.count++;
      h.errors[f.error] = (h.errors[f.error] || 0) + 1;
      if (/TUNNEL_CONNECTION_FAILED|PROXY|BLOCKED_BY_ADMINISTRATOR|ERR_ACCESS_DENIED/i.test(f.error)) h.blocked = true;
    }
    return {
      byType, cssFiles: this.css.size, savedMb: Math.round((this.saved / 1e6) * 10) / 10,
      failedHosts: Object.values(hosts).sort((a, b) => b.count - a.count).slice(0, 20),
      fonts: [...this.entries.values()].filter((e) => e.type === 'font').map((e) => ({ url: e.url, status: e.status, bytes: e.bytes, file: e.file })),
      stylesheets: [...this.entries.values()].filter((e) => e.type === 'stylesheet').map((e) => ({ url: e.url, status: e.status, bytes: e.bytes, file: e.file })),
    };
  }
}

// ---------------------------------------------------------------------------------- browser
// Claude Code cloud sandboxes route HTTPS through a TLS-inspecting proxy whose CA lives here.
const SANDBOX_PROXY_CA = '/root/.ccr/agent-proxy-ca.crt';

// Chromium on Linux trusts only its NSS store, and certutil is often missing. Instead of turning
// verification off, we pin exactly the proxy's CA keys (SPKI SHA-256) for this browser process.
function caPins(file) {
  const pems = fs.readFileSync(file, 'utf8').match(/-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g) || [];
  return pems.map((pem) => {
    const c = new crypto.X509Certificate(pem);
    if (!c.ca) return null;
    const cn = c.subject.split('\n').find((l) => l.startsWith('CN='));
    return { name: cn ? cn.slice(3) : c.subject, spki: crypto.createHash('sha256').update(c.publicKey.export({ type: 'spki', format: 'der' })).digest('base64') };
  }).filter(Boolean);
}

async function launchBrowser(opts) {
  const base = { headless: !opts.headed, args: ['--font-render-hinting=none'] };
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  if (proxy) {
    // Raw Chromium flags on purpose: Playwright's `proxy` option appends <-loopback>, which would
    // push localhost (local test servers, saved pages) through the proxy as well.
    base.args.push(`--proxy-server=${proxy}`);
    const bypass = (process.env.NO_PROXY || process.env.no_proxy || '').split(',').map((s) => s.trim()).filter(Boolean).map((t) => (t.startsWith('.') ? '*' + t : t));
    if (bypass.length) base.args.push(`--proxy-bypass-list=${bypass.join(';')}`);
  }
  const caFile = opts.extraCa || process.env.DX_EXTRA_CA || (proxy && fs.existsSync(SANDBOX_PROXY_CA) ? SANDBOX_PROXY_CA : null);
  if (caFile) {
    const pins = caPins(caFile);
    if (!pins.length) throw new Error(`No CA certificate found in ${caFile}`);
    base.args.push(`--ignore-certificate-errors-spki-list=${pins.map((p) => p.spki).join(',')}`);
    log(`  trusting proxy CA${pins.length > 1 ? 's' : ''} from ${caFile}: ${pins.map((p) => p.name).join('; ')}`);
  }
  let last;
  for (const extra of [{}, { channel: 'chrome' }, { channel: 'msedge' }]) {
    try { return await chromium.launch({ ...base, ...extra }); } catch (e) {
      last = e;
      if (!/Executable doesn't exist|executable|ENOENT|not found|is not installed/i.test(e.message)) break;
    }
  }
  throw new Error(`Could not start a browser — run "npx playwright install chromium" once (or install Google Chrome).\n${errLine(last)}`);
}

async function newContext(browser, vp, opts, net, desktopUA) {
  const ctx = await browser.newContext({
    ...VIEWPORTS[vp],
    userAgent: VIEWPORTS[vp].userAgent || desktopUA,
    locale: 'he-IL', timezoneId: 'Asia/Jerusalem', colorScheme: 'light', reducedMotion: 'no-preference',
    bypassCSP: true, serviceWorkers: 'block',
    extraHTTPHeaders: { 'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7' },
  });
  ctx.setDefaultNavigationTimeout(opts.timeout);
  ctx.setDefaultTimeout(20000);
  await ctx.addInitScript(INPAGE);
  net.attach(ctx);
  return ctx;
}

async function ensureInpage(page) {
  const ok = await page.evaluate(() => !!window.__DX__).catch(() => false);
  if (!ok) await page.evaluate(INPAGE);
}

async function open(page, url, opts) {
  let last;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: opts.timeout });
      await page.waitForLoadState('load', { timeout: Math.min(opts.timeout, 45000) }).catch(() => {});
      await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {});
      page.__delayedScripts = await releaseDelayedScripts(page); // goto() returns null for file:// pages
      await page.evaluate(() => (document.fonts ? document.fonts.ready.then(() => true) : true)).catch(() => {});
      if (opts.wait) await page.waitForTimeout(opts.wait * 1000);
      return res;
    } catch (e) {
      last = e;
      // Policy / DNS / TLS failures will not fix themselves — do not hammer the host.
      if (/ERR_TUNNEL_CONNECTION_FAILED|ERR_PROXY|ERR_NAME_NOT_RESOLVED|ERR_CERT|ERR_BLOCKED|ERR_ACCESS_DENIED|ERR_FILE_NOT_FOUND/.test(e.message)) break;
    }
  }
  throw last;
}

// Speed plugins (WP Rocket "delay JS", Perfmatters, Flying Scripts, LiteSpeed) hold back every
// script — jQuery, Elementor, sliders, sticky headers — until the first user interaction.
// A real visitor always interacts, so we do it for them and wait until the scripts have run.
const HELD_SCRIPTS = 'script[type="rocketlazyloadscript"], script[type="pmdelayedscript"], script[type="lazyscript"], script[type="litespeed/javascript"], script[type="text/plain"][data-src]';
async function releaseDelayedScripts(page) {
  const held = await page.evaluate((sel) => document.querySelectorAll(sel).length, HELD_SCRIPTS).catch(() => 0);
  await page.mouse.move(40, 40).catch(() => {});
  await page.mouse.move(140, 180).catch(() => {});
  await page.evaluate(() => {
    for (const t of ['mousemove', 'keydown', 'touchstart', 'touchmove', 'wheel', 'scroll']) {
      window.dispatchEvent(new Event(t)); document.dispatchEvent(new Event(t));
    }
  }).catch(() => {});
  if (!held) return 0;
  await page.waitForFunction((sel) => !document.querySelector(sel), HELD_SCRIPTS, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(800);
  return held;
}

async function botWall(page) {
  return page.evaluate(() => {
    const body = document.body ? document.body.innerText : '';
    const t = `${document.title} ${body.slice(0, 3000)}`;
    return /just a moment|attention required|checking your browser|verify you are human|are you a robot|captcha|access denied|ddos protection/i.test(t) && body.length < 4000 ? document.title || 'challenge page' : null;
  }).catch(() => null);
}

async function scrollThrough(page) {
  const r = await page.evaluate(async () => {
    const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
    const H = () => Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
    const step = Math.max(300, Math.floor(innerHeight * 0.7));
    const t0 = Date.now();
    let y = 0, maxY = 0;
    while (Date.now() - t0 < 30000 && y < 60000) {
      y += step;
      window.scrollTo({ top: y, behavior: 'instant' });
      await sleep(170);
      maxY = Math.max(maxY, window.scrollY);
      if (y + innerHeight >= H() - 4) break;
    }
    await sleep(700);
    return { maxY, height: H() };
  }).catch(() => ({ maxY: 0, height: 0 }));
  if (r.maxY < 50 && r.height > 2500) {
    // Scroll is hijacked (smooth-scroll library) — drive it with the mouse wheel instead.
    await page.mouse.move(200, 200);
    for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 700); await page.waitForTimeout(120); }
    for (let i = 0; i < 60; i++) await page.mouse.wheel(0, -2000);
    r.wheel = true;
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })).catch(() => {});
  await page.waitForTimeout(500);
  return r;
}

async function handleOverlays(page, dirs, label) {
  const found = await page.evaluate(() => window.__DX__.findOverlays()).catch(() => []);
  if (!found.length) return [];
  const f = path.join(dirs.components, `overlay-${label}.jpg`);
  const ok = await page.screenshot({ path: f, type: 'jpeg', quality: 80 }).then(() => true).catch(() => false);
  await page.evaluate((ids) => window.__DX__.hideOverlays(ids), found.map((o) => o.dx)).catch(() => {});
  await page.waitForTimeout(250);
  return found.map((o) => ({ ...o, shot: ok ? dirs.rel(f) : null }));
}

const docSize = (page) => page.evaluate(() => ({ w: document.documentElement.clientWidth, h: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0) }));
const SHOT = { animations: 'disabled', caret: 'hide' };

async function fullPageShot(page, file, dirs) {
  const { w, h } = await docSize(page);
  const MAX = 14000; // Chromium cannot paint one texture much taller than ~16k px
  const opts = { ...SHOT, type: 'jpeg', quality: 80, scale: 'css', fullPage: true };
  if (h <= MAX) { await page.screenshot({ ...opts, path: file }); return [dirs.rel(file)]; }
  const parts = [];
  for (let y = 0, i = 1; y < h; y += MAX, i++) {
    const f = file.replace(/\.jpg$/, `-part${i}.jpg`);
    await page.screenshot({ ...opts, path: f, clip: { x: 0, y, width: w, height: Math.min(MAX, h - y) } });
    parts.push(dirs.rel(f));
  }
  return parts;
}

async function sectionShots(page, sections, dirs, slug, vp) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const { w, h } = await docSize(page);
  const out = [];
  for (const s of sections.slice(0, 40)) {
    const b = await page.evaluate((id) => window.__DX__.box(id), s.dx).catch(() => null);
    if (!b || b.h < 24) continue;
    const y = Math.max(0, Math.floor(b.y));
    const height = Math.min(Math.ceil(b.h), 5000, h - y);
    if (height < 24) continue;
    const f = path.join(dirs.sections, `${slug}-${vp}-${String(s.i + 1).padStart(2, '0')}-${s.kind.replace(/[^a-z]+/gi, '-')}.jpg`);
    try {
      await page.screenshot({ ...SHOT, path: f, fullPage: true, clip: { x: 0, y, width: w, height }, type: 'jpeg', quality: 82, scale: vp === 'desktop' ? 'css' : 'device' });
      out.push({ i: s.i, file: dirs.rel(f) });
    } catch (e) { out.push({ i: s.i, error: errLine(e) }); }
  }
  return out;
}

async function clipShot(page, rect, file, dirs, pad = 14) {
  const vp = page.viewportSize();
  const x = Math.max(0, Math.floor(rect.left - pad)), y = Math.max(0, Math.floor(rect.top - pad));
  const width = Math.min(vp.width - x, Math.ceil(rect.w + pad * 2)), height = Math.min(vp.height - y, Math.ceil(rect.h + pad * 2));
  if (width < 4 || height < 4) return null;
  await page.screenshot({ ...SHOT, path: file, clip: { x, y, width, height }, type: 'png' });
  return dirs.rel(file);
}

async function elementShot(page, dx, file, dirs) {
  const c = await page.evaluate((id) => window.__DX__.center(id), dx).catch(() => null);
  if (!c || c.w < 2) return null;
  await page.waitForTimeout(250);
  return clipShot(page, c, file, dirs).catch(() => null);
}

async function componentShots(page, data, dirs, slug) {
  const out = [];
  const add = async (kind, i, dx, ext = 'png') => {
    if (!dx) return;
    const file = await elementShot(page, dx, path.join(dirs.components, `${slug}-${kind}-${i}.${ext}`), dirs);
    if (file) out.push({ kind, i, dx, file });
  };
  for (const [i, b] of data.buttons.slice(0, 8).entries()) await add('button', i + 1, b.dx);
  for (const [i, c] of data.cards.slice(0, 5).entries()) await add('card', i + 1, c.surfaceDx || c.sampleDx);
  for (const [i, f] of data.forms.slice(0, 2).entries()) await add('form', i + 1, f.dx);
  for (const [i, f] of data.inputs.slice(0, 3).entries()) await add('input', i + 1, f.dx);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const vw = page.viewportSize().width;
  for (const [i, f] of data.fixed.filter((x) => !(x.rect.w >= vw * 0.9 && x.rect.y <= 5)).slice(0, 8).entries()) {
    const rect = await page.evaluate((id) => { const el = document.querySelector(`[data-dx="${id}"]`); if (!el) return null; const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, w: r.width, h: r.height }; }, f.dx);
    if (!rect || rect.top > page.viewportSize().height || rect.top + rect.h < 0) continue;
    const file = await clipShot(page, rect, path.join(dirs.components, `${slug}-pinned-${i + 1}.png`), dirs, 8).catch(() => null);
    if (file) out.push({ kind: 'pinned', i: i + 1, dx: f.dx, file });
  }
  return out;
}

const msOf = (transition) => {
  let max = 0;
  for (const part of String(transition || '').split(/,(?![^(]*\))/)) {
    const times = [...part.matchAll(/([\d.]+)(ms|s)\b/g)].map((m) => parseFloat(m[1]) * (m[2] === 's' ? 1000 : 1));
    max = Math.max(max, (times[0] || 0) + (times[1] || 0));
  }
  return max;
};
const hexify = (s) => String(s ?? '').replace(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/g, (_, r, g, b, a) => {
  const h = (n) => (+n).toString(16).padStart(2, '0');
  return `#${h(r)}${h(g)}${h(b)}${a === undefined || +a >= 1 ? '' : h(Math.round(+a * 255))}`;
});
// `idle` is a second snapshot taken without hovering: anything that changed between the two
// is a running animation (pulsing buttons, carousels), not a hover effect.
function diffSnap(a, b, idle) {
  const out = {};
  if (!a || !b) return out;
  for (const part of ['self', 'text', 'img', 'icon']) {
    if (!a[part] || !b[part]) continue;
    for (const [k, v] of Object.entries(a[part])) {
      if (k === 'width' || k === 'height' || b[part][k] === v) continue;
      if (idle?.[part] && idle[part][k] !== v) continue;
      out[`${part === 'self' ? '' : part + '.'}${k}`] = `${hexify(v)} → ${hexify(b[part][k])}`;
    }
    const dw = parseFloat(b[part].width) - parseFloat(a[part].width);
    if (part === 'self' && Math.abs(dw) >= 1 && !(idle?.self && idle.self.width !== a.self.width)) out.width = `${a[part].width} → ${b[part].width}`;
  }
  return out;
}

async function hoverStates(page, data, dirs, slug) {
  const targets = [
    ...data.buttons.slice(0, 8).map((b, i) => ({ kind: 'button', idx: i + 1, dx: b.dx, label: b.labels[0] || '' })),
    ...(data.nav?.sampleDx ? [{ kind: 'nav-link', idx: 1, dx: data.nav.sampleDx, label: data.nav.items[0] || '' }] : []),
    ...data.links.filter((l) => l.region === 'main').slice(0, 2).map((l, i) => ({ kind: 'link', idx: i + 1, dx: l.dx, label: l.samples[0] || '' })),
    ...data.cards.slice(0, 4).map((c, i) => ({ kind: 'card', idx: i + 1, dx: c.sampleDx, label: c.heading?.text || '' })),
  ];
  const out = [];
  for (const t of targets) {
    try {
      await page.mouse.move(1, 1);
      const c = await page.evaluate((id) => window.__DX__.center(id), t.dx);
      if (!c || c.w < 2) continue;
      await page.waitForTimeout(350);
      const before = await page.evaluate((id) => window.__DX__.snap(id), t.dx);
      await page.waitForTimeout(160);
      const idle = await page.evaluate((id) => window.__DX__.snap(id), t.dx);
      const a = await clipShot(page, c, path.join(dirs.components, `${slug}-hover-${t.kind}-${t.idx}-a.png`), dirs, 18);
      await page.mouse.move(c.x, c.y, { steps: 5 });
      await page.waitForTimeout(Math.min(1600, msOf(before?.transition) + 200));
      const after = await page.evaluate((id) => window.__DX__.snap(id), t.dx);
      const b = await clipShot(page, c, path.join(dirs.components, `${slug}-hover-${t.kind}-${t.idx}-b.png`), dirs, 18);
      out.push({ ...t, reachable: c.reachable, changes: diffSnap(idle, after, before), shots: [a, b].filter(Boolean) });
    } catch (e) { out.push({ ...t, error: errLine(e) }); }
  }
  await page.mouse.move(1, 1).catch(() => {});
  return out;
}

function diffHeader(a, b) {
  const out = {};
  if (!a || !b) return out;
  for (const k of ['height', 'position', 'bg', 'bgImage', 'shadow', 'borderBottom', 'backdrop', 'classes']) {
    if (JSON.stringify(a[k]) !== JSON.stringify(b[k])) out[k] = `${hexify(a[k] ?? 'none')} → ${hexify(b[k] ?? 'none')}`;
  }
  if (a.logo && b.logo && Math.abs(a.logo.h - b.logo.h) >= 1) out.logoHeight = `${a.logo.h} → ${b.logo.h}`;
  return out;
}

async function headerBehaviour(page, dirs, slug, vp) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);
  const top = await page.evaluate(() => window.__DX__.headerState()).catch(() => null);
  if (!top) return null;
  const size = page.viewportSize();
  const hh = Math.min(size.height, Math.max(60, Math.ceil(top.height + 24)));
  const f1 = path.join(dirs.components, `${slug}-header-${vp}-top.png`);
  await page.screenshot({ ...SHOT, path: f1, clip: { x: 0, y: 0, width: size.width, height: hh } });
  await page.evaluate(() => window.scrollTo({ top: Math.min(1400, Math.max(600, document.documentElement.scrollHeight / 3)), behavior: 'instant' }));
  await page.waitForTimeout(1000);
  const scrolled = await page.evaluate(() => window.__DX__.headerState()).catch(() => null);
  const f2 = path.join(dirs.components, `${slug}-header-${vp}-scrolled.png`);
  await page.screenshot({ ...SHOT, path: f2, clip: { x: 0, y: 0, width: size.width, height: hh } });
  await page.evaluate(() => window.scrollBy({ top: -350, behavior: 'instant' }));
  await page.waitForTimeout(800);
  const up = await page.evaluate(() => window.__DX__.headerState()).catch(() => null);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  return { top, scrolled, up, sticky: !!scrolled?.coversTop, revealOnUp: !scrolled?.coversTop && !!up?.coversTop, changes: diffHeader(top, scrolled), shots: [dirs.rel(f1), dirs.rel(f2)] };
}

async function mobileMenu(page, dirs, slug, vp) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(300);
  const toggle = await page.evaluate(() => window.__DX__.findMenuToggle()).catch(() => null);
  if (!toggle) return { found: false };
  const before = new Set(await page.evaluate(() => window.__DX__.visibleLayers()));
  try {
    await page.locator(`[data-dx="${toggle.dx}"]`).click({ timeout: 5000 });
  } catch (e) {
    return { found: true, toggle, opened: false, error: `click failed: ${errLine(e)}` };
  }
  await page.waitForTimeout(1100);
  const after = await page.evaluate(() => window.__DX__.visibleLayers()).catch(() => []);
  const fresh = after.filter((id) => !before.has(id));
  const panels = [];
  for (const id of fresh.slice(0, 8)) { const d = await page.evaluate((i) => window.__DX__.describeLayer(i), id).catch(() => null); if (d) panels.push(d); }
  const panel = panels.sort((a, b) => b.rect.w * b.rect.h - a.rect.w * a.rect.h)[0] || null;
  const f = path.join(dirs.components, `${slug}-menu-${vp}-open.png`);
  await page.screenshot({ ...SHOT, path: f }).catch(() => {});
  await page.keyboard.press('Escape').catch(() => {});
  return { found: true, toggle, opened: fresh.length > 0, panel, shot: dirs.rel(f) };
}

async function platformFonts(page, data) {
  const ids = [...new Set([...Object.values(data.text).sort((a, b) => b.chars - a.chars).slice(0, 30).map((t) => t.dx), ...data.headings.slice(0, 12).map((h) => h.dx)])].filter(Boolean);
  const out = {};
  let cdp;
  try {
    cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable');
    await cdp.send('CSS.enable');
    const { root } = await cdp.send('DOM.getDocument', { depth: 0 });
    for (const id of ids) {
      try {
        const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-dx="${id}"]` });
        if (!nodeId) continue;
        const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
        out[id] = fonts.map((f) => ({ family: f.familyName, postScript: f.postScriptName, custom: f.isCustomFont, glyphs: f.glyphCount }));
      } catch { /* node vanished */ }
    }
  } catch (e) {
    out._error = errLine(e);
  } finally {
    await cdp?.detach().catch(() => {});
  }
  return out;
}

async function saveBrand(page, data, net, dirs) {
  const logo = data.header?.logo;
  const out = {};
  if (!logo) return out;
  if (logo.svg) { await fsp.writeFile(path.join(dirs.brand, 'logo.svg'), logo.svg.replace(/ data-dx="\d+"/g, '')); out.svg = 'brand/logo.svg'; }
  else if (logo.src) {
    const e = net.entries.get(logo.src);
    if (e?.file) { const ext = path.extname(e.file) || '.img'; await fsp.copyFile(path.join(dirs.root, e.file), path.join(dirs.brand, `logo-source${ext}`)).catch(() => {}); out.source = `brand/logo-source${ext}`; }
  }
  const shot = await elementShot(page, logo.dx, path.join(dirs.brand, 'logo.png'), dirs);
  if (shot) out.png = shot;
  return out;
}

// ---------------------------------------------------------------------------------- one page, one viewport
async function captureView(ctx, url, vp, info, opts, dirs, net) {
  const page = await ctx.newPage();
  const v = { viewport: vp, url, ok: false, shots: {}, warnings: [], overlays: [] };
  const label = `${info.slug}-${vp}`;
  const t0 = Date.now();
  let stage = 'load';
  try {
    const res = await open(page, url, opts);
    stage = 'prepare';
    v.status = res?.status() ?? null;
    v.delayedScripts = page.__delayedScripts || 0;
    v.finalUrl = page.url();
    if (v.status && v.status >= 400) v.warnings.push(`HTTP ${v.status}`);
    const wall = await botWall(page);
    if (wall) v.warnings.push(`bot-protection page ("${wall}") — re-run with --headed and pass it by hand, or save the page locally`);
    await ensureInpage(page);
    await page.waitForTimeout(1200);
    v.overlays.push(...(await handleOverlays(page, dirs, `${label}-load`)));
    v.scroll = await scrollThrough(page);
    v.lazyForced = await forceLazyMedia(page);
    await page.addStyleTag({ content: STABILIZE_CSS }).catch(() => v.warnings.push('could not inject stabilizing CSS'));
    v.overlays.push(...(await handleOverlays(page, dirs, `${label}-late`)));
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(400);
    stage = 'measure';
    const vf = path.join(dirs.screens, vp, `${info.slug}-viewport.jpg`);
    await page.screenshot({ ...SHOT, path: vf, type: 'jpeg', quality: 85 });
    v.shots.viewport = dirs.rel(vf);
    v.data = await page.evaluate((o) => window.__DX__.collect(o), {});
    if (v.data?.error) throw new Error(v.data.error);
    stage = 'screenshots';
    v.shots.full = await fullPageShot(page, path.join(dirs.screens, vp, `${info.slug}-full.jpg`), dirs);
    if (vp === 'desktop') {
      v.links = await page.evaluate(() => window.__DX__.links()).catch(() => []);
      await fsp.writeFile(path.join(dirs.pages, `${info.slug}.html`), (await page.content()).replace(/ data-dx="\d+"/g, ''));
    }
    v.ok = true; // measurements are in — the steps below are extras and must not discard them
    stage = 'components';
    const extra = async (name, fn) => { try { return await fn(); } catch (e) { v.warnings.push(`${name} skipped: ${errLine(e)}`); return undefined; } };
    if (info.deep) {
      if (opts.sectionShots) v.sectionShots = await extra('section screenshots', () => sectionShots(page, v.data.sections, dirs, info.slug, vp));
      if (vp === 'desktop') {
        v.platformFonts = await extra('font check', () => platformFonts(page, v.data));
        v.brand = await extra('logo', () => saveBrand(page, v.data, net, dirs));
        v.components = await extra('component shots', () => componentShots(page, v.data, dirs, info.slug));
        if (opts.hover) v.hover = await extra('hover states', () => hoverStates(page, v.data, dirs, info.slug));
      }
      v.header = await extra('header behaviour', () => headerBehaviour(page, dirs, info.slug, vp));
      if (VIEWPORTS[vp].isMobile) v.menu = await extra('mobile menu', () => mobileMenu(page, dirs, info.slug, vp));
    } else if (opts.sectionShots && vp === 'desktop') {
      v.sectionShots = await extra('section screenshots', () => sectionShots(page, v.data.sections, dirs, info.slug, vp));
    }
  } catch (e) {
    v.error = stage === 'load' ? errLine(e) : `${stage} step failed — ${errLine(e)}`;
    v.stage = stage;
  } finally {
    v.ms = Date.now() - t0;
    await page.close().catch(() => {});
  }
  return v;
}

async function capturePage(ctxs, url, info, opts, dirs, net) {
  const page = { url, slug: info.slug, deep: info.deep, views: {} };
  for (const vp of opts.viewports) {
    const v = await captureView(ctxs[vp], url, vp, info, opts, dirs, net);
    page.views[vp] = v;
    log(`  ${v.ok ? '✓' : '✗'} ${vp.padEnd(7)} ${v.ok ? `${v.data.sections.length} sections, ${v.data.stats.visible} elements, ${(v.ms / 1000).toFixed(1)}s` : v.error}${v.warnings.length ? `  ⚠ ${v.warnings.join('; ')}` : ''}`);
  }
  return page;
}

// Pick internal pages the way a designer would browse: menu first, one example per template.
function pickPages(links, startUrl, max) {
  if (!max) return [];
  const start = new URL(startUrl);
  const bare = (h) => h.replace(/^www\./, '');
  const key = (u) => { let p = u.pathname; try { p = decodeURIComponent(p); } catch { /* keep */ } return (bare(u.host) + p.replace(/\/+$/, '') + u.search).toLowerCase(); };
  const FILE_RE = /\.(pdf|jpe?g|png|gif|webp|svg|zip|rar|docx?|xlsx?|pptx?|mp4|mp3|mov|avi)$/i;
  const SKIP_RE = /wp-admin|wp-login|xmlrpc|\/feed\/?$|\/cart\b|\/checkout\b|my-account|\/login|\/register|add-to-cart|\/wp-json|[?&]s=|\/tag\/|\/author\/|\/page\/\d+|replytocom|\/amp\/?$|\/cdn-cgi\//i;
  const rank = { nav: 0, header: 1, main: 2, footer: 3 };
  const seen = new Set([key(start)]);
  const cands = [];
  for (const l of links) {
    let u;
    try { u = new URL(l.href); } catch { continue; }
    if (!/^https?:$/.test(u.protocol) || bare(u.host) !== bare(start.host)) continue;
    u.hash = '';
    if (FILE_RE.test(u.pathname) || SKIP_RE.test(u.pathname + u.search)) continue;
    const k = key(u);
    if (seen.has(k)) continue;
    seen.add(k);
    cands.push({ url: u.href, rank: rank[l.region] ?? 2, segs: u.pathname.split('/').filter(Boolean) });
  }
  cands.sort((a, b) => a.rank - b.rank || a.segs.length - b.segs.length);
  const perTemplate = new Map();
  const picked = [];
  for (const c of cands) {
    const tpl = c.segs.length <= 1 ? `/${c.segs[0] || ''}` : `${c.segs[0]}/*${c.segs.length}`;
    if (c.segs.length > 1 && perTemplate.get(tpl)) continue;
    perTemplate.set(tpl, 1);
    picked.push(c.url);
    if (picked.length >= max) break;
  }
  return picked;
}

// ---------------------------------------------------------------------------------- main
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help || !opts.target) { log(HELP); process.exit(opts.help ? 0 : 1); }
  const start = normalizeTarget(opts.target);
  const outDir = path.resolve(opts.out || path.join(HERE, 'sites', siteSlug(start)));
  const dirs = await prepareOut(outDir);
  log(`▶ ${start}\n  output → ${path.relative(process.cwd(), outDir) || '.'}`);

  const browser = await launchBrowser(opts);
  const net = new NetworkLog(dirs, opts.maxAssetsMb * 1e6);
  const desktopUA = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version().split('.')[0]}.0.0.0 Safari/537.36`;
  const run = {
    tool: { name: 'design-extractor', version: VERSION }, target: start, startedAt: new Date().toISOString(), browser: browser.version(),
    options: { ...opts, viewportSizes: Object.fromEntries(opts.viewports.map((v) => [v, `${VIEWPORTS[v].viewport.width}×${VIEWPORTS[v].viewport.height}`])) },
    pages: [], warnings: [],
  };
  try {
    const ctxs = {};
    for (const vp of opts.viewports) ctxs[vp] = await newContext(browser, vp, opts, net, desktopUA);

    log(`\n[1] ${start}`);
    const home = await capturePage(ctxs, start, { slug: pageSlug(start, 1), deep: true }, opts, dirs, net);
    run.pages.push(home);
    const hd = home.views.desktop;
    if (!hd.ok) {
      const blocked = /TUNNEL_CONNECTION_FAILED|ERR_PROXY|ERR_BLOCKED|ERR_ACCESS_DENIED/.test(hd.error || '');
      throw new Error(blocked
        ? `${new URL(start).host} is blocked by this machine's network policy (${hd.error}). Allow the domain (and its font/CDN hosts) or run the extractor on a computer with open internet.`
        : hd.stage === 'load' ? `Could not load ${start}: ${hd.error}` : `${start} loaded, but the ${hd.error}`);
    }
    const extra = opts.urls.length ? opts.urls.map(normalizeTarget) : new URL(start).protocol === 'file:' ? [] : pickPages(hd.links || [], hd.finalUrl || start, opts.pages);
    for (const [i, u] of extra.entries()) {
      log(`\n[${i + 2}] ${u}`);
      run.pages.push(await capturePage(ctxs, u, { slug: pageSlug(u, i + 2), deep: false }, opts, dirs, net));
    }
    await net.flush();

    // CSS as written by the site: external sheets + unique inline <style> blocks, parsed by Chromium itself.
    const sheets = [...net.css.values()].map((c) => ({ name: c.name, text: c.text }));
    const inline = new Set();
    for (const p of run.pages) for (const v of Object.values(p.views)) for (const t of v.data?.inlineCss || []) inline.add(t);
    let n = 0;
    for (const text of inline) {
      const name = `inline-${String(++n).padStart(2, '0')}.css`;
      await fsp.writeFile(path.join(dirs.css, name), text);
      sheets.push({ name, text });
    }
    const cssPage = await ctxs.desktop.newPage();
    await cssPage.setContent('<!doctype html><html><head></head><body></body></html>');
    await ensureInpage(cssPage);
    run.css = await cssPage.evaluate((s) => window.__DX__.parseCss(s), sheets);
    await cssPage.close();
    run.network = net.summary();
  } catch (e) {
    run.fatal = errLine(e);
    throw e;
  } finally {
    run.finishedAt = new Date().toISOString();
    await browser.close().catch(() => {});
    if (run.fatal) await fsp.writeFile(path.join(dirs.data, 'run-error.json'), JSON.stringify({ error: run.fatal, network: net.summary() }, null, 2)).catch(() => {});
  }

  const { warnings } = await buildReport({ outDir, run });
  const ok = run.pages.filter((p) => Object.values(p.views).every((v) => v.ok)).length;
  log(`\n✔ Done — ${ok}/${run.pages.length} pages fully captured.`);
  log(`  report: ${path.relative(process.cwd(), path.join(outDir, 'report.md'))}`);
  if (warnings.length) log(`  ⚠ ${warnings.length} warning(s):\n  - ${warnings.slice(0, 12).join('\n  - ')}`);
}

main().catch((e) => {
  console.error(`\n✖ ${e.message}`);
  process.exit(1);
});
