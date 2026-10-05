#!/usr/bin/env node
// Self-test: builds a small RTL site with every pattern the extractor must understand
// (sticky header, hamburger menu, popup + cookie bar, AOS-style reveal, cards with hover,
// form, floating WhatsApp button, cross-origin stylesheet + web font), runs extract.mjs on it
// and checks the measurements. Needs no internet.   Usage: node selftest.mjs [--keep]
import http from 'node:http';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { deltaE } from './color.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const KEEP = process.argv.includes('--keep');
const FONT_CANDIDATES = [
  ['/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'],
  ['/Library/Fonts/Arial Unicode.ttf', '/Library/Fonts/Arial Unicode.ttf'],
  ['C:\\Windows\\Fonts\\arial.ttf', 'C:\\Windows\\Fonts\\arialbd.ttf'],
];

function serve(dir) {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.js': 'text/javascript' };
  const server = http.createServer((req, res) => {
    const p = path.join(dir, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    const file = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, 'index.html') : p;
    if (!file.startsWith(dir) || !fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'content-type': types[path.extname(file)] || 'application/octet-stream', 'access-control-allow-origin': '*' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

const svg = (w, h, fill, label) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${fill}"/><text x="50%" y="55%" text-anchor="middle" font-size="${Math.round(h / 3)}" fill="#fff" font-family="Arial">${label}</text></svg>`;

function page({ title, body, portB }) {
  return `<!doctype html>
<html lang="he" dir="rtl">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="אתר בדיקה עבור design-extractor">
<link rel="stylesheet" href="http://127.0.0.1:${portB}/theme.css">
<link rel="stylesheet" href="/site.css">
</head>
<body>
<header class="site-header">
  <div class="container bar">
    <div class="elementor-widget-lottie"><svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#f5a623"/></svg></div>
    <a class="logo" href="/" aria-label="דף הבית"><svg width="132" height="40" viewBox="0 0 132 40"><rect width="132" height="40" rx="8" fill="#0a5ea8"/><text x="66" y="27" text-anchor="middle" font-size="18" fill="#fff" font-family="Arial">LOGO</text></svg></a>
    <nav class="main-nav"><a href="/about.html">אודות</a><a href="/services/one.html">שירותים</a><a href="/services/two.html">שירות נוסף</a><a href="/contact.html">צור קשר</a></nav>
    <a class="btn btn-primary header-cta" href="/contact.html">דברו איתנו</a>
    <div class="search-form"><button class="search-form__toggle" type="button"><svg width="20" height="20" viewBox="0 0 20 20"><circle cx="8" cy="8" r="6" fill="none" stroke="#1d2433" stroke-width="2"/></svg></button></div>
    <div class="mobile-menu"><div class="icon-wrapper"><a class="icon-link" href="#menu"><span></span><span></span><span></span></a></div></div>
  </div>
  <nav class="mobile-panel" hidden><a href="/about.html">אודות</a><a href="/services/one.html">שירותים</a><a href="/contact.html">צור קשר</a><a href="/privacy.html">פרטיות</a></nav>
</header>
<main>${body}</main>
<footer class="site-footer"><div class="footer-inner">
  <div class="container cols">
    <div><h4>הסטודיו</h4><p>סטודיו לעיצוב ופיתוח אתרים. אנחנו בונים חוויות דיגיטליות.</p></div>
    <div><h4>ניווט</h4><a href="/about.html">אודות</a><a href="/contact.html">צור קשר</a></div>
    <div><h4>מידע</h4><a href="/privacy.html">מדיניות פרטיות</a><a href="/services/two.html">שירות נוסף</a></div>
    <div><h4>עקבו</h4><a href="https://facebook.com/x">פייסבוק</a><a href="https://instagram.com/x">אינסטגרם</a></div>
  </div>
  <div class="container copy">© 2026 כל הזכויות שמורות לסטודיו בדיקה</div>
</div></footer>
<a class="whatsapp-float" href="https://wa.me/972500000000" aria-label="וואטסאפ">WA</a>
<div class="popup-modal" id="promo-popup" role="dialog" aria-modal="true"><div class="box"><h3>מבצע השקה</h3><p>הצטרפו לרשימת התפוצה וקבלו 10% הנחה.</p><button class="btn btn-primary">הרשמה</button></div></div>
<div class="cookie-bar">אנחנו משתמשים בעוגיות כדי לשפר את חוויית הגלישה. <button class="btn btn-outline">אישור</button></div>
<script type="rocketlazyloadscript">document.querySelectorAll('.late-note').forEach(function (e) { e.textContent = 'נטען אחרי אינטראקציה'; });</script>
<script>(function () { var ev = ['mousemove', 'keydown', 'touchstart', 'wheel']; var go = function () { ev.forEach(function (t) { removeEventListener(t, go); }); document.querySelectorAll('script[type="rocketlazyloadscript"]').forEach(function (s) { var n = document.createElement('script'); n.textContent = s.textContent; s.replaceWith(n); }); }; ev.forEach(function (t) { addEventListener(t, go, { passive: true }); }); })();</script>
<script>
  setTimeout(function () { document.getElementById('promo-popup').classList.add('open'); }, 300);
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('aos-animate'); }); });
  document.querySelectorAll('[data-aos]').forEach(function (el) { io.observe(el); });
  document.querySelector('.icon-link').addEventListener('click', function (e) { e.preventDefault(); var p = document.querySelector('.mobile-panel'); p.hidden = !p.hidden; });
  addEventListener('scroll', function () { document.querySelector('.site-header').classList.toggle('is-scrolled', scrollY > 50); });
</script>
</body>
</html>`;
}

const SITE_CSS = `
:root { --brand: #0a5ea8; --brand-2: #f5a623; --ink: #1d2433; --muted: #6b7280; --surface: #f4f6fa; }
* { box-sizing: border-box; }
body { margin: 0; font-family: "Fixture Sans", Arial, sans-serif; color: var(--ink); background: #ffffff; font-size: 17px; line-height: 1.6; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.site-header { position: sticky; top: 0; z-index: 50; background: #ffffff; transition: box-shadow .3s ease; }
.site-header.is-scrolled { box-shadow: 0 4px 20px rgba(0, 0, 0, .08); }
.bar { display: flex; align-items: center; justify-content: space-between; gap: 32px; height: 84px; }
.main-nav { display: flex; gap: 28px; }
.main-nav a { color: var(--ink); text-decoration: none; font-weight: 500; font-size: 16px; transition: color .2s ease; }
.main-nav a:hover { color: var(--brand); }
.search-form__toggle { width: 36px; height: 36px; background: none; border: 0; padding: 8px; }
.icon-link { display: none; width: 44px; height: 44px; flex-direction: column; justify-content: center; gap: 5px; padding: 8px; }
.icon-link span { display: block; height: 3px; background: var(--ink); border-radius: 2px; }
.mobile-panel { position: fixed; top: 84px; left: 0; right: 0; background: var(--ink); padding: 24px; z-index: 40; }
.mobile-panel[hidden] { display: none; }
.mobile-panel a { display: block; color: #fff; font-size: 20px; padding: 12px 0; text-decoration: none; }
.btn { display: inline-flex; align-items: center; justify-content: center; height: 52px; padding: 0 30px; border-radius: 999px; font-weight: 700; font-size: 17px; text-decoration: none; border: 0; font-family: inherit; transition: background-color .25s ease, transform .25s ease, box-shadow .25s ease; cursor: pointer; }
.btn-primary { background: var(--brand); color: #fff; }
.btn-primary:hover { background: #084a86; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(10, 94, 168, .3); }
.btn-outline { border: 2px solid var(--brand); color: var(--brand); background: transparent; }
.btn-outline:hover { background: var(--brand); color: #fff; }
.hero { min-height: 100vh; display: flex; align-items: center; background: linear-gradient(135deg, #0a5ea8 0%, #083b6b 100%); color: #fff; position: relative; padding: 96px 0; }
.hero::before { content: ""; position: absolute; inset: 0; background: rgba(0, 0, 0, .25); }
.hero .container { position: relative; width: 100%; }
.hero h1 { font-size: 56px; line-height: 1.15; font-weight: 700; margin: 0 0 20px; letter-spacing: -0.5px; color: #fff; }
.hero p { font-size: 20px; max-width: 640px; }
.hero .btn-outline { border-color: #fff; color: #fff; }
.hero .actions { display: flex; gap: 16px; margin-top: 32px; }
section { padding: 96px 0; }
.logos { padding: 48px 0; background: var(--surface); }
.logos .row { display: flex; justify-content: space-between; align-items: center; }
.logos img { height: 40px; width: 120px; opacity: .7; filter: grayscale(1); }
h2 { font-size: 40px; line-height: 1.2; margin: 0 0 16px; font-weight: 700; color: var(--ink); }
h3 { font-size: 22px; line-height: 1.3; margin: 16px 0 8px; font-weight: 700; }
.features .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; margin-top: 40px; }
.card { background: #fff; border-radius: var(--radius-card); box-shadow: var(--shadow-card); padding: 28px; transition: transform .3s cubic-bezier(.2, .8, .2, 1), box-shadow .3s ease; }
.card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(10, 94, 168, .18); }
.card img { width: 100%; aspect-ratio: 16 / 10; object-fit: cover; border-radius: 10px; display: block; }
.card p { color: var(--muted); font-size: 16px; }
.link-more { color: var(--brand); font-weight: 700; text-decoration: none; }
.stats { background: #0b1f33; color: #fff; }
.stats h2 { color: #fff; }
.stats .grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; text-align: center; }
.stats strong { display: block; font-size: 48px; color: var(--brand-2); }
[data-aos] { opacity: 0; transform: translateY(40px); transition: opacity .8s ease, transform .8s ease; }
[data-aos].aos-animate { opacity: 1; transform: none; }
.cta-band { background: var(--brand-2); padding: 56px 0; text-align: center; position: relative; }
.cta-band .container { position: relative; }
.contact-sec form { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 760px; }
input, textarea { height: 52px; border: 1px solid #d6dbe4; border-radius: 10px; padding: 0 16px; font: inherit; font-size: 16px; background: #fff; }
input::placeholder, textarea::placeholder { color: #9aa3b2; }
textarea { height: 140px; grid-column: 1 / -1; padding-top: 12px; }
.faq { content-visibility: auto; contain-intrinsic-size: auto 500px; }
.faq details { border-bottom: 1px solid #e5e7eb; padding: 18px 0; }
.two-col { display: grid; grid-template-columns: 1.2fr 1fr; gap: 48px; align-items: center; }
.two-col img { width: 100%; border-radius: 16px; }
.footer-inner { background: #0b1f33; color: #c7d0dd; padding: 72px 0 24px; }
.site-footer .cols { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; }
.site-footer h4 { color: #fff; font-size: 18px; margin: 0 0 16px; }
.site-footer a { color: #c7d0dd; text-decoration: none; display: block; padding: 4px 0; }
.site-footer .copy { border-top: 1px solid rgba(255, 255, 255, .12); margin-top: 48px; padding-top: 20px; font-size: 14px; }
.whatsapp-float { position: fixed; bottom: 24px; left: 24px; width: 60px; height: 60px; border-radius: 50%; background: #25d366; color: #fff; display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 20px rgba(0, 0, 0, .2); text-decoration: none; font-weight: 700; z-index: 60; animation: pulse-ring 2s infinite; }
.popup-modal { position: fixed; inset: 0; background: rgba(0, 0, 0, .6); z-index: 1000; display: none; align-items: center; justify-content: center; }
.popup-modal.open { display: flex; }
.popup-modal .box { background: #fff; padding: 40px; border-radius: 16px; width: 480px; max-width: 90vw; }
.cookie-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #1d2433; color: #fff; padding: 16px 24px; z-index: 900; display: flex; justify-content: space-between; align-items: center; }
.page-title { font-size: 48px; line-height: 1.2; margin: 0 0 16px; }
@media (max-width: 1024px) { .features .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 767px) {
  .features .grid, .two-col, .site-footer .cols, .contact-sec form { grid-template-columns: 1fr; }
  .hero h1 { font-size: 34px; }
  .page-title { font-size: 30px; }
  h2 { font-size: 30px; }
  section { padding: 56px 0; }
  .main-nav, .header-cta { display: none; }
  .icon-link { display: flex; }
  .bar { height: 68px; }
  .mobile-panel { top: 68px; }
  .logos .row { flex-wrap: wrap; gap: 16px; justify-content: center; }
  .stats .grid4 { grid-template-columns: 1fr 1fr; }
}
`;

const THEME_CSS = (portB, hasFont) => `
${hasFont ? `@font-face { font-family: "Fixture Sans"; src: url("http://127.0.0.1:${portB}/fonts/fixture.ttf") format("truetype"); font-weight: 400; font-display: swap; }
@font-face { font-family: "Fixture Sans"; src: url("http://127.0.0.1:${portB}/fonts/fixture-bold.ttf") format("truetype"); font-weight: 700; font-display: swap; }` : ''}
:root { --radius-card: 14px; --shadow-card: 0 10px 30px rgba(10, 94, 168, 0.12); }
@keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, .5); } 100% { box-shadow: 0 0 0 18px rgba(37, 211, 102, 0); } }
@media (max-width: 1024px) { html body .stats .grid4 { grid-template-columns: repeat(2, 1fr); } }
`;

const HOME_BODY = `
<section class="hero"><div class="container">
  <h1>אתרים שמביאים לקוחות</h1>
  <p>אנחנו מתכננים, מעצבים ובונים אתרים מהירים שמותאמים לכל מסך ומייצרים פניות אמיתיות.</p>
  <div class="actions"><a class="btn btn-primary" href="/contact.html">לתיאום שיחה</a><a class="btn btn-outline" href="/about.html">עוד עלינו</a></div>
</div></section>
<section class="logos"><div class="container row">
  ${[1, 2, 3, 4, 5, 6].map((i) => `<img src="/img/logo${i}.svg" alt="לקוח ${i}">`).join('')}
</div></section>
<section class="features"><div class="container">
  <h2>מה אנחנו עושים</h2>
  <p>שלושה תחומים שבהם אנחנו הכי טובים.</p>
  <div class="grid">
    ${['עיצוב', 'פיתוח', 'שיווק'].map((t, i) => `<article class="card"><img src="/img/card${i + 1}.svg" alt="${t}"><h3>${t}</h3><p>תיאור קצר של השירות שמסביר ללקוח מה הוא מקבל ולמה זה חשוב לו.</p><a class="link-more" href="/services/one.html">לפרטים ←</a></article>`).join('')}
  </div>
</div></section>
<section class="stats" data-aos="fade-up"><div class="container">
  <h2>במספרים</h2>
  <div class="grid4"><div><strong>120+</strong>פרויקטים</div><div><strong>15</strong>שנות ניסיון</div><div><strong>98%</strong>שביעות רצון</div><div><strong>24/7</strong>תמיכה</div></div>
</div></section>
<section class="cta-band"><div class="elementor-motion-effects-layer" style="position:absolute;inset:0;opacity:0;background-image:linear-gradient(#f5a623,#f5a623)"></div><div class="container"><h2>מוכנים להתחיל?</h2><p class="late-note"></p><a class="btn btn-primary" href="/contact.html">דברו איתנו עכשיו</a></div></section>
<section class="contact-sec"><div class="container">
  <h2>השאירו פרטים</h2>
  <form><input placeholder="שם מלא"><input placeholder="טלפון"><input placeholder="אימייל" type="email"><input placeholder="חברה"><textarea placeholder="איך נוכל לעזור?"></textarea><button class="btn btn-primary" type="submit">שליחה</button></form>
</div></section>
<section class="faq"><div class="container">
  <h2>שאלות נפוצות</h2>
  <details><summary>כמה זמן לוקח לבנות אתר?</summary><p>בין שלושה לשמונה שבועות, תלוי בהיקף.</p></details>
  <details><summary>האם האתר מותאם למובייל?</summary><p>כן, כל אתר נבנה קודם כל למובייל.</p></details>
  <img loading="lazy" src="/img/lazy.svg" alt="תמונה עצלה" width="300" height="120">
  <img src="data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20300%20120'%3E%3C/svg%3E" data-lazy-src="/img/lazy.svg" alt="שקופית עצלה" width="300" height="120">
</div></section>`;

const INNER = (h1, extra = '') => `
<section><div class="container two-col">
  <div><h1 class="page-title">${h1}</h1><p>עמוד פנימי לבדיקה עם טקסט רץ שמתאר את התוכן, כדי שנוכל למדוד את הטיפוגרפיה של גוף הטקסט.</p><a class="btn btn-primary" href="/contact.html">צור קשר</a></div>
  <img src="/img/card2.svg" alt="${h1}">
</div></section>${extra}`;

async function main() {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), 'dx-selftest-'));
  const siteA = path.join(root, 'a'), siteB = path.join(root, 'b'), out = path.join(root, 'out');
  for (const d of [siteA, path.join(siteA, 'img'), path.join(siteA, 'services'), siteB, path.join(siteB, 'fonts')]) await fsp.mkdir(d, { recursive: true });
  const serverA = await serve(siteA), serverB = await serve(siteB);
  const portA = serverA.address().port, portB = serverB.address().port;
  const fontPair = FONT_CANDIDATES.find(([r, b]) => fs.existsSync(r) && fs.existsSync(b));
  if (fontPair) { await fsp.copyFile(fontPair[0], path.join(siteB, 'fonts', 'fixture.ttf')); await fsp.copyFile(fontPair[1], path.join(siteB, 'fonts', 'fixture-bold.ttf')); }
  await fsp.writeFile(path.join(siteB, 'theme.css'), THEME_CSS(portB, !!fontPair));
  await fsp.writeFile(path.join(siteA, 'site.css'), SITE_CSS);
  for (let i = 1; i <= 6; i++) await fsp.writeFile(path.join(siteA, 'img', `logo${i}.svg`), svg(120, 40, '#8a94a6', `L${i}`));
  for (let i = 1; i <= 3; i++) await fsp.writeFile(path.join(siteA, 'img', `card${i}.svg`), svg(480, 300, ['#0a5ea8', '#f5a623', '#0b1f33'][i - 1], `C${i}`));
  await fsp.writeFile(path.join(siteA, 'img', 'lazy.svg'), svg(300, 120, '#6b7280', 'lazy'));
  const pages = {
    'index.html': page({ title: 'סטודיו בדיקה — דף הבית', body: HOME_BODY, portB }),
    'about.html': page({ title: 'אודות', body: INNER('אודות הסטודיו'), portB }),
    'services/one.html': page({ title: 'שירות', body: INNER('שירות ראשון'), portB }),
    'services/two.html': page({ title: 'שירות נוסף', body: INNER('שירות שני'), portB }),
    'contact.html': page({ title: 'צור קשר', body: INNER('צור קשר', HOME_BODY.split('<section class="contact-sec">')[1].replace(/^/, '<section class="contact-sec">').split('<section class="faq">')[0]), portB }),
    'privacy.html': page({ title: 'מדיניות פרטיות', body: INNER('מדיניות פרטיות'), portB }),
  };
  for (const [f, html] of Object.entries(pages)) await fsp.writeFile(path.join(siteA, f), html);

  console.log(`fixture: http://127.0.0.1:${portA}/  (cross-origin assets on :${portB}, web font: ${fontPair ? 'yes' : 'no'})`);
  const t0 = Date.now();
  const code = await new Promise((resolve) => {
    const p = spawn(process.execPath, [path.join(HERE, 'extract.mjs'), `http://127.0.0.1:${portA}/`, '--out', out, '--wait', '0.3', '--pages', '6'], { stdio: 'inherit' });
    p.on('exit', resolve);
  });
  serverA.close(); serverB.close();
  console.log(`\nextractor exit code ${code} after ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);

  const results = [];
  const check = (name, cond, detail = '') => { results.push({ name, ok: !!cond, detail }); console.log(`${cond ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`); };
  const exists = (f) => fs.existsSync(path.join(out, f)) && fs.statSync(path.join(out, f)).size > 0;
  check('extractor exits cleanly', code === 0);
  for (const f of ['report.md', 'tokens.json', 'tokens.css', 'tailwind-theme.css', 'palette.svg', 'data/raw.json', 'screenshots/desktop/01-home-full.jpg', 'screenshots/mobile/01-home-full.jpg', 'screenshots/tablet/01-home-viewport.jpg', 'pages/01-home.html', 'pages/01-home.md', 'brand/logo.svg', 'brand/logo.png']) check(`writes ${f}`, exists(f));
  if (!exists('tokens.json')) return finish(results, root);
  const t = JSON.parse(await fsp.readFile(path.join(out, 'tokens.json'), 'utf8'));
  const raw = JSON.parse(await fsp.readFile(path.join(out, 'data', 'raw.json'), 'utf8'));
  const near = (a, b, max = 3) => !!a && deltaE(a.slice(0, 7), b) < max;
  const roles = t.color.roles;
  check('primary color = #0a5ea8', near(roles.primary, '#0a5ea8'), roles.primary);
  check('background = #ffffff', near(roles.background, '#ffffff', 1), roles.background);
  check('text color = #1d2433', near(roles.text, '#1d2433'), roles.text);
  check('dark surface = #0b1f33', near(roles.dark, '#0b1f33'), roles.dark);
  check('secondary/accent includes #f5a623', [roles.secondary, roles.accent].some((c) => near(c, '#f5a623')), `${roles.secondary} / ${roles.accent}`);
  check('declared --brand variable is linked to the palette', t.color.palette.some((p) => p.vars?.includes('--brand')));
  const fam = t.typography.families[0];
  if (fontPair) {
    check('main family = Fixture Sans (web font)', fam?.family === 'Fixture Sans' && /self-hosted/.test(fam.source), `${fam?.family} · ${fam?.source}`);
    check('web font really rendered (CDP platform fonts)', fam?.renderedAs?.length && !fam.renderedAs.every((r) => r.endsWith('(system)')), fam?.renderedAs?.join(', '));
  }
  const r = t.typography.roles;
  const sizes = (s) => [s?.size, ...(s?.alternatives || []).map((a) => a.size)];
  check('h1: inner pages 48px dominate, home hero 56px kept as variant', r.desktop?.h1?.size === 48 && sizes(r.desktop?.h1).includes(56) && String(r.desktop.h1.weight) === '700', sizes(r.desktop?.h1).join(', '));
  check('h1 on mobile: 30px pages / 34px hero (responsive)', r.mobile?.h1?.size === 30 && sizes(r.mobile?.h1).includes(34), sizes(r.mobile?.h1).join(', '));
  check('no horizontal overflow on mobile', raw.pages.every((p) => p.views.mobile?.data?.viewport?.w === 390), raw.pages.map((p) => p.views.mobile?.data?.viewport?.w).join(', '));
  check('desktop h2 = 40px, mobile h2 = 30px', r.desktop?.h2?.size === 40 && r.mobile?.h2?.size === 30);
  check('body text = 17px', r.desktop?.body?.size === 17 || r.desktop?.body?.size === 16, String(r.desktop?.body?.size));
  const bps = t.breakpoints.list.map((b) => `${b.type}${b.px}`);
  check('breakpoints 767 & 1024 found', bps.includes('max767') && bps.includes('max1024'), bps.join(', '));
  check('container width ≈ 1200px', Math.abs((t.spacing.container || 0) - 1152) <= 50 || Math.abs((t.spacing.container || 0) - 1200) <= 2, String(t.spacing.container));
  const btn = t.components.buttons;
  const primaryBtn = btn.find((b) => near(b.bg, '#0a5ea8'));
  check('primary button variant (pill, 52px)', primaryBtn && primaryBtn.shape === 'pill' && Math.abs(primaryBtn.height - 52) <= 1, primaryBtn && `${primaryBtn.shape} ${primaryBtn.height}px`);
  check('outline button variant', btn.some((b) => b.bg === 'transparent' && /2px solid/.test(b.border)));
  check('primary button hover measured (bg + lift)', primaryBtn?.hover && Object.keys(primaryBtn.hover).some((k) => /backgroundColor/.test(k)) && Object.keys(primaryBtn.hover).some((k) => /transform/.test(k)), primaryBtn?.hover && Object.keys(primaryBtn.hover).join(', '));
  const card = t.components.cards.find((c) => c.count === 3 && c.perRow === 3);
  check('card group: 3 per row, radius 14px, shadow', card && card.style?.radius === '14px' && card.style?.shadow, card && `${card.style?.radius} ${card.style?.shadow}`);
  check('card hover lift measured', card?.hover && Object.keys(card.hover).some((k) => /transform/.test(k)));
  check('input fields (52px, radius 10px, placeholder color)', t.components.inputs.some((f) => f.height === 52 && f.radius === '10px' && near(f.placeholderColor, '#9aa3b2')));
  check('sticky header detected (desktop)', t.components.header.desktop?.sticky === true);
  check('header shadow appears on scroll', Object.keys(t.components.header.desktop?.changesOnScroll || {}).includes('shadow'));
  check('mobile hamburger menu opens', t.components.mobileMenu?.opened === true, JSON.stringify(t.components.mobileMenu?.panel?.items || []));
  check('popup + cookie bar detected and hidden', t.components.overlays.some((o) => o.kind === 'modal') && t.components.overlays.some((o) => o.kind === 'cookie'));
  check('floating WhatsApp button detected', t.components.pinned.some((p) => /wa\.me/.test(p.href || '')));
  check('footer: dark bg, 4 columns', near(t.components.footer.desktop?.bg?.color, '#0b1f33') && t.components.footer.desktop?.columns?.cols === 4, `${t.components.footer.desktop?.bg?.color} ${t.components.footer.desktop?.columns?.cols}`);
  const home = t.layout[0];
  const kinds = home.sections.map((s) => s.kind);
  check('home sections: hero, logos, grid, form, footer', ['hero', 'logos', 'grid/cards', 'form', 'footer'].every((k) => kinds.includes(k)), kinds.join(' → '));
  check('AOS-hidden section captured visible', home.sections.some((s) => /במספרים/.test(s.heading?.text || '')));
  check('one section screenshot per section', home.sections.every((s) => s.shots.length >= 1));
  const crawled = raw.pages.map((p) => new URL(p.url).pathname);
  check('crawl: nav pages, one per template, footer page', ['/about.html', '/services/one.html', '/contact.html', '/privacy.html'].every((p) => crawled.includes(p)) && !crawled.includes('/services/two.html'), crawled.join(' '));
  check('cross-origin stylesheet parsed (@font-face, @keyframes, vars)', (!fontPair || raw.css.fontFaces.length >= 2) && raw.css.keyframes.some((k) => k.name === 'pulse-ring') && raw.css.vars.some((v) => v.name === '--radius-card'));
  check('motion: transitions + running animation recorded', t.motion.transitions.length > 0 && raw.pages[0].views.desktop.data.hist.animation && Object.keys(raw.pages[0].views.desktop.data.hist.animation).some((k) => k.startsWith('pulse-ring')));
  // regressions found while reviewing real output
  check('floating WhatsApp green is not a brand role', !Object.values(roles).some((c) => near(c, '#25d366')), JSON.stringify(roles));
  check('nav style = the menu links (16px/500 #1d2433), not the logo', t.components.nav?.style?.size === 16 && String(t.components.nav.style.weight) === '500' && near(t.components.nav.style.color, '#1d2433'), JSON.stringify(t.components.nav?.style));
  check('body text color comes from main content (#1d2433)', near(r.desktop?.body?.color, '#1d2433'), r.desktop?.body?.color);
  const hero = home.sections.find((s) => s.kind === 'hero');
  check('hero background = gradient + ::before scrim', hero?.bgKind === 'gradient' && hero.overlays?.some((o) => near(o.color, '#000000', 60) && /40$/.test(o.color)), JSON.stringify({ bg: hero?.bgImage, overlays: hero?.overlays }));
  check('hero buttons are not counted as columns', hero?.columns === 1, String(hero?.columns));
  check('exactly one hero per page', t.layout.every((pg) => pg.sections.filter((s) => s.kind === 'hero').length <= 1), t.layout.map((pg) => pg.sections.filter((s) => s.kind === 'hero').length).join(','));
  check('popups de-duplicated (1 modal + 1 cookie bar)', t.components.overlays.length === 2, String(t.components.overlays.length));
  check('component radii: button pill, card 14px, input 10px', t.radius.byComponent.button === '9999px' && t.radius.byComponent.card === '14px' && t.radius.byComponent.input === '10px', JSON.stringify(t.radius.byComponent));
  check('no widget shadow in shadow tokens', !t.shadow.some((sh) => sh.on.includes('widget')), t.shadow.map((sh) => sh.value).join(' | '));
  check('pulsing widget is not reported as a hover effect', !t.components.links.some((l) => /wa/i.test(l.samples.join(' '))) && !(raw.pages[0].views.desktop.hover || []).some((h) => /^WA$/.test(h.label)));
  check('site design variables captured (--radius-card: 14px)', t.designVariables?.['--radius-card'] === '14px', JSON.stringify(t.designVariables));
  const homeHtml = await fsp.readFile(path.join(out, 'pages', '01-home.html'), 'utf8');
  check('delayed scripts (WP Rocket style) released before measuring', homeHtml.includes('נטען אחרי אינטראקציה') && raw.pages[0].views.desktop.delayedScripts === 1, String(raw.pages[0].views.desktop.delayedScripts));
  check('content-visibility:auto section measured and painted', home.sections.some((s) => /שאלות נפוצות/.test(s.heading?.text || '')));
  check('transparent <footer> takes the color of its inner container', near(raw.pages[0].views.desktop.data.footer?.bg?.color, '#0b1f33'), raw.pages[0].views.desktop.data.footer?.bg?.color);
  check('hamburger found through its wrapper, search toggle ignored', /icon-link/.test(t.components.mobileMenu?.toggle?.el || ''), t.components.mobileMenu?.toggle?.el);
  check('placeholder lazy image (data-lazy-src) swapped in for screenshots', homeHtml.includes('<img src="/img/lazy.svg" data-lazy-src') && raw.pages[0].views.desktop.lazyForced >= 1, String(raw.pages[0].views.desktop.lazyForced));
  const cta = raw.pages[0].views.desktop.data.sections.find((sec) => /מוכנים להתחיל/.test(sec.heading?.text || ''));
  check('scroll-faded Elementor background layer shown at full opacity', cta?.overlays?.some((o) => o.opacity === 1), JSON.stringify(cta?.overlays));
  check('logo = the wordmark, not the Lottie icon before it', t.components.header.desktop?.logo?.w === 132, JSON.stringify(t.components.header.desktop?.logo && { w: t.components.header.desktop.logo.w, h: t.components.header.desktop.logo.h }));
  check('saved HTML and logo are clean of extractor markers', !(await fsp.readFile(path.join(out, 'pages', '01-home.html'), 'utf8')).includes('data-dx=') && !(await fsp.readFile(path.join(out, 'brand', 'logo.svg'), 'utf8')).includes('data-dx='));
  const md = await fsp.readFile(path.join(out, 'report.md'), 'utf8');
  const missing = [...md.matchAll(/(?:src="|\]\()([^")]+\.(?:png|jpg|svg))/g)].map((m) => m[1]).filter((f) => !fs.existsSync(path.join(out, f)));
  check('every image referenced by report.md exists', missing.length === 0, missing.slice(0, 3).join(', '));
  return finish(results, root, out);
}

async function finish(results, root, out) {
  const bad = results.filter((r) => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed.`);
  if (KEEP && out) console.log(`output kept at ${out}`);
  else await fsp.rm(root, { recursive: true, force: true });
  process.exit(bad.length ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
