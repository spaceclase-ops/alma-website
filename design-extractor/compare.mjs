#!/usr/bin/env node
// Visual check for a rebuild: screenshot a local page (or URL) at a given viewport and
// compare it pixel by pixel with a reference screenshot from the extractor.
// Writes <name>-replica.png, <name>-diff.png (mismatches in red) and <name>-compare.png
// (reference | replica | diff), and prints the mismatch percentage.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const HELP = `Usage: node compare.mjs <page.html | url> <reference.png|jpg> [options]

  --viewport <WxH>     viewport in CSS px (default 1440x900)
  --dpr <n>            device scale factor (default 1; use 2 for the extractor's mobile shots)
  --mobile             emulate a phone (touch + mobile viewport meta)
  --out <dir>          where to write the images (default: next to the page)
  --name <name>        file prefix (default: viewport name)
  --region <x,y,w,h>   compare only this rectangle, CSS px (default: whole viewport)
  --mask <x,y,w,h>     ignore this rectangle (repeatable) — e.g. a live animation or a plugin widget
  --threshold <n>      per-pixel colour distance that counts as different, 0–441 (default 40)
  --tolerance <px>     also report a score that forgives anti-aliasing: a pixel only counts if no pixel
                       within this radius in the other image matches it (default 1; 0 = off)
  --wait <ms>          settle time before the screenshot (default 600)
`;

function parseArgs(argv) {
  const o = { viewport: '1440x900', dpr: 1, mobile: false, masks: [], threshold: 40, tolerance: 1, wait: 600 };
  const pos = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--viewport') o.viewport = next();
    else if (a === '--dpr') o.dpr = +next();
    else if (a === '--mobile') o.mobile = true;
    else if (a === '--out') o.out = next();
    else if (a === '--name') o.name = next();
    else if (a === '--region') o.region = next().split(',').map(Number);
    else if (a === '--mask') o.masks.push(next().split(',').map(Number));
    else if (a === '--threshold') o.threshold = +next();
    else if (a === '--tolerance') o.tolerance = +next();
    else if (a === '--wait') o.wait = +next();
    else if (a === '-h' || a === '--help') { console.log(HELP); process.exit(0); }
    else pos.push(a);
  }
  if (pos.length < 2) { console.log(HELP); process.exit(1); }
  [o.target, o.reference] = pos;
  const [w, h] = o.viewport.split('x').map(Number);
  o.w = w; o.h = h;
  return o;
}

const dataUrl = (file) => `data:image/${path.extname(file).toLowerCase() === '.png' ? 'png' : 'jpeg'};base64,${fs.readFileSync(file).toString('base64')}`;

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const isUrl = /^https?:\/\//.test(o.target);
  const target = isUrl ? o.target : pathToFileURL(path.resolve(o.target)).href;
  const outDir = path.resolve(o.out || (isUrl ? '.' : path.dirname(o.target)));
  fs.mkdirSync(outDir, { recursive: true });
  const name = o.name || `${o.w}x${o.h}`;
  // Grayscale text anti-aliasing: builder sites (Elementor, transforms everywhere) render text in
  // composited layers without LCD sub-pixel AA, so a plain rebuild would differ on every glyph edge.
  const browser = await chromium.launch({ args: ['--disable-lcd-text'] });
  try {
    const ctx = await browser.newContext({ viewport: { width: o.w, height: o.h }, deviceScaleFactor: o.dpr, isMobile: o.mobile, hasTouch: o.mobile });
    const page = await ctx.newPage();
    await page.goto(target, { waitUntil: 'load' });
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null));
    await page.waitForTimeout(o.wait);
    const replicaFile = path.join(outDir, `${name}-replica.png`);
    await page.screenshot({ path: replicaFile, animations: 'disabled', caret: 'hide' });

    // Compare inside a blank page with canvases — no image libraries needed.
    const cmp = await ctx.newPage();
    const res = await cmp.evaluate(async ({ ref, rep, region, masks, threshold, tolerance, dpr }) => {
      const load = (src) => new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = src; });
      const [a, b] = await Promise.all([load(ref), load(rep)]);
      const W = Math.min(a.naturalWidth, b.naturalWidth), H = Math.min(a.naturalHeight, b.naturalHeight);
      const [rx, ry, rw, rh] = (region || [0, 0, W / dpr, H / dpr]).map((v) => Math.round(v * dpr));
      const px = (img) => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, W, H).data; };
      const A = px(a), B = px(b);
      const diff = document.createElement('canvas'); diff.width = W; diff.height = H;
      const g = diff.getContext('2d'); const out = g.createImageData(W, H);
      const masked = (x, y) => masks.some(([mx, my, mw, mh]) => x >= mx * dpr && x < (mx + mw) * dpr && y >= my * dpr && y < (my + mh) * dpr);
      const R = Math.round(tolerance * dpr);
      const dist = (P, i, Q, j) => Math.hypot(P[i] - Q[j], P[i + 1] - Q[j + 1], P[i + 2] - Q[j + 2]);
      // true when some pixel of Q within radius R of (x,y) matches P(x,y) — i.e. only a sub-pixel shift / anti-aliasing
      const near = (P, Q, x, y) => { const i = (y * W + x) * 4; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue; if (dist(P, i, Q, (yy * W + xx) * 4) <= threshold) return true; } return false; };
      let total = 0, bad = 0, badTol = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const inside = x >= rx && x < rx + rw && y >= ry && y < ry + rh && !masked(x, y);
        const d = dist(A, i, B, i);
        const grey = (A[i] + A[i + 1] + A[i + 2]) / 3;
        let hit = false;
        if (inside) { total++; if (d > threshold) { bad++; hit = !R || !(near(A, B, x, y) && near(B, A, x, y)); if (hit) badTol++; } }
        out.data[i] = hit ? 255 : grey * 0.35 + 160; out.data[i + 1] = hit ? 0 : grey * 0.35 + 160; out.data[i + 2] = hit ? 0 : grey * 0.35 + 160; out.data[i + 3] = inside ? 255 : 90;
      }
      g.putImageData(out, 0, 0);
      const side = document.createElement('canvas'); side.width = W * 3 + 40; side.height = H;
      const s = side.getContext('2d'); s.fillStyle = '#fff'; s.fillRect(0, 0, side.width, H);
      s.drawImage(a, 0, 0); s.drawImage(b, W + 20, 0); s.drawImage(diff, W * 2 + 40, 0);
      return { W, H, total, bad, badTol, diff: diff.toDataURL('image/png'), side: side.toDataURL('image/png') };
    }, { ref: dataUrl(o.reference), rep: dataUrl(replicaFile), region: o.region || null, masks: o.masks, threshold: o.threshold, tolerance: o.tolerance, dpr: o.dpr });
    const save = (file, url) => fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
    save(path.join(outDir, `${name}-diff.png`), res.diff);
    save(path.join(outDir, `${name}-compare.png`), res.side);
    const pct = (100 * res.bad / Math.max(1, res.total)).toFixed(2);
    console.log(`${name}: ${pct}% of compared pixels differ (${res.bad} / ${res.total}, threshold ${o.threshold})`);
    if (o.tolerance) console.log(`  ${(100 * res.badTol / Math.max(1, res.total)).toFixed(2)}% differ beyond ${o.tolerance}px anti-aliasing tolerance — red in the diff image`);
    console.log(`  ${path.relative(process.cwd(), path.join(outDir, `${name}-compare.png`))}  (reference | replica | diff)`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
