/* Design Extractor — in-page collector.
 * Injected into every inspected page (context.addInitScript) and exposed as window.__DX__.
 * It runs inside someone else's site, so it is dependency-free and read-only: the only DOM
 * writes are data-dx="<id>" tags (so Node can screenshot/hover an element later) and the
 * explicit hideOverlays() call. */
(() => {
  if (window.__DX__) return;
  const DX = (window.__DX__ = { version: 1 });

  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'META', 'LINK', 'BR', 'HEAD', 'TITLE', 'BASE', 'WBR', 'PARAM', 'SOURCE', 'TRACK']);
  const HEADER_SEL = 'header, [role="banner"], [data-elementor-type="header"], .elementor-location-header, #masthead, .site-header, #site-header, #header';
  const FOOTER_SEL = 'footer, [role="contentinfo"], [data-elementor-type="footer"], .elementor-location-footer, #colophon, .site-footer, #site-footer, #footer';
  const NAV_SEL = 'nav, [role="navigation"], .elementor-nav-menu, .main-navigation, .navbar, .menu';
  const ICON_FONT_RE = /awesome|eicons|icomoon|dashicons|material icons|material symbols|fontello|bootstrap-icons|themify|ionicons|elementskit|jkiticon|feather|remixicon|line awesome|glyphicons|et-line|simple-line|linearicons|icofont|flaticon/i;
  const OVERLAY_RE = /popup|pop-up|modal|overlay|lightbox|newsletter|cookie|consent|gdpr|dialog|subscribe|promo|pum-|mfp-|fancybox|onetrust|cky-|cmplz|borlabs|iubenda|termly|preload|loader/i;
  const COOKIE_TEXT_RE = /cookie|עוגיות|עוגיה|privacy policy|מדיניות פרטיות/i;
  const MENU_RE = /menu|תפריט|burger|hamburger|toggle|navbar-toggler|nav-toggle|offcanvas|off-canvas|mobile-nav/i;

  const px = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const r0 = (n) => Math.round(n);
  const r1 = (n) => Math.round(n * 10) / 10;
  const r2 = (n) => Math.round(n * 100) / 100;
  const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const cut = (s, n = 80) => { s = clean(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; };
  const inc = (h, k, n = 1) => { if (k === undefined || k === null || k === '') return; h[k] = (h[k] || 0) + n; };
  const median = (arr) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
  const firstFamily = (stack) => String(stack || '').split(',')[0].trim().replace(/^["']|["']$/g, '');
  const byDx = (id) => document.querySelector(`[data-dx="${id}"]`);
  const hostOf = (u) => { try { return new URL(u, location.href).host; } catch { return null; } };

  // ------------------------------------------------------------------ colors
  let ctx2d = null;
  function canvas() {
    if (ctx2d !== null) return ctx2d;
    try { const c = document.createElement('canvas'); c.width = c.height = 1; ctx2d = c.getContext('2d', { willReadFrequently: true }) || false; } catch { ctx2d = false; }
    return ctx2d;
  }
  const hex2 = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  const toHex = (r, g, b, a = 1) => '#' + hex2(r) + hex2(g) + hex2(b) + (a < 0.999 ? hex2(a * 255) : '');
  const RGB_RE = /^rgba?\(\s*(-?[\d.]+)(%?)[\s,]+(-?[\d.]+)(%?)[\s,]+(-?[\d.]+)(%?)\s*(?:[,/]\s*([\d.]+)(%?))?\s*\)$/i;
  const colorCache = new Map();

  // Any CSS color -> '#rrggbb' or '#rrggbbaa'; null when transparent/invalid.
  function normColor(str) {
    if (!str) return null;
    str = String(str).trim();
    if (colorCache.has(str)) return colorCache.get(str);
    let out = null;
    const m = str.match(RGB_RE);
    if (m) {
      const ch = (v, pct) => (pct ? parseFloat(v) * 2.55 : parseFloat(v));
      const a = m[7] === undefined ? 1 : m[8] ? parseFloat(m[7]) / 100 : parseFloat(m[7]);
      out = a <= 0.004 ? null : toHex(ch(m[1], m[2]), ch(m[3], m[4]), ch(m[5], m[6]), Math.min(1, a));
    } else if (!/^(transparent|none|currentcolor|inherit|initial|unset|auto)$/i.test(str)) {
      const c = canvas();
      if (c) {
        c.fillStyle = '#010203';
        c.fillStyle = str;
        if (c.fillStyle !== '#010203') {
          c.clearRect(0, 0, 1, 1);
          c.fillRect(0, 0, 1, 1);
          const d = c.getImageData(0, 0, 1, 1).data;
          out = d[3] === 0 ? null : toHex(d[0], d[1], d[2], d[3] / 255);
        }
      }
    }
    colorCache.set(str, out);
    return out;
  }
  function withAlpha(hex, opacity) {
    if (!hex || opacity >= 0.999) return hex;
    if (opacity <= 0.004) return null;
    const a = (hex.length === 9 ? parseInt(hex.slice(7), 16) / 255 : 1) * opacity;
    return hex.slice(0, 7) + (a < 0.999 ? hex2(a * 255) : '');
  }
  const COLOR_TOKEN_RE = /(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^()]*\)|#[0-9a-f]{3,8}\b/gi;
  const colorsIn = (value) => {
    if (!value || value === 'none') return [];
    const out = [];
    for (const m of String(value).matchAll(COLOR_TOKEN_RE)) { const h = normColor(m[0]); if (h) out.push(h); }
    return out;
  };
  function splitTop(str) {
    const out = []; let depth = 0, cur = '';
    for (const ch of String(str || '')) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  // ------------------------------------------------------------------ element helpers
  function shown(el, cs) {
    if (typeof el.checkVisibility === 'function') {
      return el.checkVisibility({ opacityProperty: true, visibilityProperty: true, contentVisibilityAuto: true });
    }
    cs = cs || getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility === 'visible' && +cs.opacity > 0;
  }
  function docBox(el) {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    const x = r.left + scrollX, y = r.top + scrollY;
    const W = Math.max(document.documentElement.scrollWidth, innerWidth);
    if (x + r.width <= 1 || x >= W - 1 || y + r.height <= 0) return null;
    return { x: r1(x), y: r1(y), w: r1(r.width), h: r1(r.height) };
  }
  let dxSeq = 0;
  function tag(el) {
    let id = el.getAttribute('data-dx');
    if (!id) { id = String(++dxSeq); el.setAttribute('data-dx', id); }
    return id;
  }
  function describe(el) {
    const parts = [];
    let e = el;
    for (let i = 0; e && e.nodeType === 1 && i < 4; i++, e = e.parentElement) {
      let s = e.tagName.toLowerCase();
      if (e.id && !/\d{3,}/.test(e.id) && e.id.length < 40) { parts.unshift(s + '#' + e.id); break; }
      const cls = typeof e.className === 'string'
        ? e.className.split(/\s+/).filter((c) => c && c.length < 40 && !/^elementor-element-[0-9a-f]+$/.test(c) && !/^(e-con-inner|elementor-widget-container)$/.test(c)).slice(0, 2)
        : [];
      if (cls.length) s += '.' + cls.join('.');
      parts.unshift(s);
      if (e.tagName === 'BODY') break;
    }
    return parts.join(' > ');
  }
  function ownText(el) {
    let t = '';
    for (const n of el.childNodes) if (n.nodeType === 3) t += n.nodeValue;
    return clean(t);
  }
  function textHolder(el) {
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.nodeValue.trim() && !n.parentElement?.closest('svg') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP) });
    const n = w.nextNode();
    return n ? n.parentElement : null;
  }
  function region(el) {
    if (el.closest(FOOTER_SEL)) return 'footer';
    if (el.closest(HEADER_SEL)) return el.closest(NAV_SEL) ? 'nav' : 'header';
    if (el.closest('nav, [role="navigation"]')) return 'nav';
    return 'main';
  }
  function textRole(el) {
    const h = el.closest('h1,h2,h3,h4,h5,h6');
    if (h) return h.tagName.toLowerCase();
    if (el.closest('button, [role="button"], .elementor-button, .btn, .button')) return 'button';
    if (el.closest('a')) return 'a';
    if (el.closest('label')) return 'label';
    if (el.closest('li')) return 'li';
    if (el.closest('p')) return 'p';
    return el.tagName.toLowerCase();
  }
  const hasPaint = (cs) => !!normColor(cs.backgroundColor) || cs.backgroundImage !== 'none' || (px(cs.borderTopWidth) > 0 && cs.borderTopStyle !== 'none') || cs.boxShadow !== 'none';
  const borderOf = (cs, side = 'Top') => {
    const w = px(cs['border' + side + 'Width']);
    if (!w || cs['border' + side + 'Style'] === 'none' || cs['border' + side + 'Style'] === 'hidden') return null;
    const c = normColor(cs['border' + side + 'Color']);
    return c ? `${r1(w)}px ${cs['border' + side + 'Style']} ${c}` : null;
  };
  const padOf = (cs) => [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) => r0(px(v)) + 'px').join(' ');

  function buttonLike(el, cs, box) {
    const t = el.tagName;
    const ctl = t === 'BUTTON' || t === 'A' || el.getAttribute('role') === 'button' ||
      (t === 'INPUT' && /^(submit|button|reset)$/i.test(el.type)) ||
      (typeof el.className === 'string' && /(^|\s)(btn|button|elementor-button|wp-block-button__link|cta)(\s|$|-)/i.test(el.className) && !el.closest('a, button'));
    if (!ctl) return false;
    if (box.h < 24 || box.h > 110 || box.w < 32 || box.w > 640) return false;
    if (!clean(el.innerText || el.value) && !el.querySelector('svg, img, i')) return false;
    const hasBg = !!normColor(cs.backgroundColor) || cs.backgroundImage.includes('gradient');
    const hasBorder = !!borderOf(cs, 'Top') && !!borderOf(cs, 'Bottom');
    return (hasBg || hasBorder) && px(cs.paddingLeft) + px(cs.paddingRight) >= 10;
  }
  function kindOf(el, tagName, isBtn) {
    if (isBtn) return 'button';
    if (/^(input|textarea|select)$/.test(tagName)) return 'input';
    if (/^(img|picture|video|svg|canvas|iframe)$/.test(tagName)) return 'media';
    if (/^h[1-6]$/.test(tagName)) return 'heading';
    if (tagName === 'a') return 'link';
    return 'box';
  }
  function styleOfText(el) {
    const cs = getComputedStyle(textHolder(el) || el);
    return {
      family: firstFamily(cs.fontFamily), size: r1(px(cs.fontSize)), weight: cs.fontWeight,
      lineHeight: cs.lineHeight === 'normal' ? 'normal' : r1(px(cs.lineHeight)),
      letterSpacing: cs.letterSpacing === 'normal' ? 0 : r2(px(cs.letterSpacing)),
      transform: cs.textTransform, color: normColor(cs.color), align: cs.textAlign,
      decoration: cs.textDecorationLine,
    };
  }

  // ------------------------------------------------------------------ page structure
  function flowKids(el) {
    const out = [];
    for (const c of el.children) {
      if (SKIP.has(c.tagName)) continue;
      const cs = getComputedStyle(c);
      if (cs.position === 'fixed' || cs.position === 'absolute') continue;
      if (!shown(c, cs)) continue;
      const r = c.getBoundingClientRect();
      if (r.height >= 4 && r.width >= 4) out.push(c);
    }
    return out;
  }
  // Split the page into its visual bands: descend through wrappers until we reach a stack
  // of edge-to-edge blocks (relative to the page width, so boxed layouts work too).
  function sectionize() {
    const body = document.body;
    const W = (e) => e.getBoundingClientRect().width;
    const H = (e) => e.getBoundingClientRect().height;
    const top = flowKids(body);
    const pageW = Math.min(document.documentElement.clientWidth, Math.max(0, ...top.map(W)));
    const isFull = (c) => W(c) >= pageW * 0.98 - 1;
    const out = [];
    const walk = (el, depth, anchor) => {
      const kids = flowKids(el);
      const full = kids.filter(isFull);
      const h = H(el) || 1;
      const fullH = full.reduce((s, c) => s + H(c), 0);
      if (depth < 16 && full.length >= 2 && fullH >= h * 0.5) {
        for (const c of kids) {
          if (isFull(c)) walk(c, depth + 1, null);
          else if (H(c) >= 24) out.push({ el: c, inner: c });
        }
        return;
      }
      if (depth < 16 && full.length === 1 && H(full[0]) >= h * 0.8) {
        walk(full[0], depth + 1, anchor || (el === body ? null : el));
        return;
      }
      out.push({ el: anchor || el, inner: el });
    };
    walk(body, 0, null);
    return out.sort((a, b) => a.el.getBoundingClientRect().top - b.el.getBoundingClientRect().top);
  }
  function effectiveBg(el) {
    let color = null, from = null;
    for (let e = el; e; e = e.parentElement) {
      const c = normColor(getComputedStyle(e).backgroundColor);
      if (c) { color = c; from = e === el ? 'self' : describe(e); break; }
    }
    const cs = getComputedStyle(el);
    const img = cs.backgroundImage !== 'none' ? cut(cs.backgroundImage, 400) : null;
    const imageKind = img ? (img.includes('url(') ? (img.includes('gradient') ? 'image+gradient' : 'image') : 'gradient') : null;
    return { color: color || '#ffffff', from: color ? from : 'default', image: img, imageKind, size: img ? cs.backgroundSize : null, position: img ? cs.backgroundPosition : null, attachment: img ? cs.backgroundAttachment : null };
  }
  // A transparent wrapper (Elementor <footer> / section) often gets its color from an inner
  // container that fills it — that inner paint is what the visitor sees, not the page behind.
  function paintedBg(el) {
    const own = effectiveBg(el);
    if (own.from === 'self' || own.image) return own;
    const r = el.getBoundingClientRect();
    if (r.width * r.height < 1) return own;
    const fill = [...el.querySelectorAll('div, section, footer, header, main, article')].slice(0, 400).find((e) => {
      const c = getComputedStyle(e);
      if (!normColor(c.backgroundColor) && c.backgroundImage === 'none') return false;
      const rr = e.getBoundingClientRect();
      return rr.width >= r.width * 0.9 && rr.height >= r.height * 0.6 && shown(e, c);
    });
    return fill ? { ...effectiveBg(fill), from: describe(fill) } : own;
  }
  function overlaysOf(el) {
    const r = el.getBoundingClientRect();
    const out = [];
    const scan = (root, depth) => {
      for (const c of root.children) {
        if (SKIP.has(c.tagName)) continue;
        const cs = getComputedStyle(c);
        if (cs.position === 'absolute' || cs.position === 'fixed' || c.tagName === 'VIDEO') {
          const cr = c.getBoundingClientRect();
          if (cr.width * cr.height >= r.width * r.height * 0.85 && r.width * r.height > 0) {
            const color = withAlpha(normColor(cs.backgroundColor), +cs.opacity);
            const video = c.tagName === 'VIDEO' || !!c.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"]');
            if (color || cs.backgroundImage !== 'none' || video) {
              out.push({ color, image: cs.backgroundImage !== 'none' ? cut(cs.backgroundImage, 300) : null, opacity: +cs.opacity, blend: cs.mixBlendMode !== 'normal' ? cs.mixBlendMode : null, video, el: describe(c) });
            }
          }
        }
        if (depth < 1) scan(c, depth + 1);
      }
    };
    scan(el, 0);
    for (const pseudo of ['::before', '::after']) {
      const ps = getComputedStyle(el, pseudo);
      if (!ps.content || ps.content === 'none' || ps.content === 'normal' || (ps.position !== 'absolute' && ps.position !== 'fixed')) continue;
      if (px(ps.width) < r.width * 0.8 || px(ps.height) < r.height * 0.8) continue;
      const color = withAlpha(normColor(ps.backgroundColor), +ps.opacity);
      if (color || ps.backgroundImage !== 'none') out.push({ color, image: ps.backgroundImage !== 'none' ? cut(ps.backgroundImage, 300) : null, opacity: +ps.opacity, blend: ps.mixBlendMode !== 'normal' ? ps.mixBlendMode : null, video: false, el: describe(el) + pseudo });
    }
    return out.slice(0, 4);
  }
  function columnsOf(root) {
    const rootW = root.getBoundingClientRect().width || 1;
    const isItem = (k, r) => {
      if (r.width < rootW * 0.1 || r.height < 40) return false;
      if (/^(A|BUTTON)$/.test(k.tagName) && r.height < 70) return false;
      if (/^(IMG|SVG|PICTURE)$/.test(k.tagName) && r.height < 90) return false;
      return true;
    };
    const queue = [[root, 0]];
    let steps = 0;
    while (queue.length && steps++ < 500) {
      const [el, d] = queue.shift();
      const kids = flowKids(el);
      const rects = kids.map((k) => [k, k.getBoundingClientRect()]).filter(([k, r]) => isItem(k, r)).map(([, r]) => r);
      if (rects.length >= 2) {
        const t = Math.min(...rects.map((r) => r.top));
        const row = rects.filter((r) => Math.abs(r.top - t) < 14).sort((a, b) => a.left - b.left);
        if (row.length >= 2) {
          const gaps = row.slice(1).map((r, i) => r1(r.left - row[i].right)).filter((g) => g >= 0);
          return { cols: row.length, widths: row.map((r) => r1((r.width / rootW) * 100)), gap: gaps.length ? median(gaps) : 0, items: rects.length, rows: Math.ceil(rects.length / row.length) };
        }
      }
      if (d < 8) for (const k of kids) queue.push([k, d + 1]);
    }
    return { cols: 1, items: 1, rows: 1 };
  }
  function sectionItems(el) {
    const items = [];
    const walker = el.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,a,button,img,input[type=submit],label');
    for (const e of walker) {
      if (items.length >= 45) break;
      if (!shown(e)) continue;
      const t = e.tagName.toLowerCase();
      if (/^h[1-6]$/.test(t)) items.push({ t, text: cut(e.innerText, 160) });
      else if (t === 'img') { if (e.alt) items.push({ t: 'img', text: cut(e.alt, 80) }); }
      else if (t === 'a' || t === 'button' || t === 'input') {
        const cs = getComputedStyle(e); const b = docBox(e);
        if (b && buttonLike(e, cs, b)) items.push({ t: 'button', text: cut(e.innerText || e.value, 50), href: e.href ? e.href.slice(0, 200) : null });
      } else if (t === 'blockquote' || ((t === 'p' || t === 'li' || t === 'label') && !e.closest('nav'))) {
        const tx = cut(e.innerText, 280);
        if (tx.length >= 12 && !items.some((i) => i.text === tx)) items.push({ t, text: tx });
      }
    }
    return items;
  }

  DX.sections = function () {
    const vh = innerHeight;
    let heroDone = false;
    return sectionize().slice(0, 80).map(({ el, inner }, i) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el), ics = getComputedStyle(inner);
      const bg = paintedBg(el);
      if (!bg.image && inner !== el) { const ib = getComputedStyle(inner).backgroundImage; if (ib !== 'none') bg.image = cut(ib, 400); }
      const overlays = overlaysOf(el);
      const hs = [...el.querySelectorAll('h1,h2,h3,h4,h5,h6')].filter((h) => shown(h) && clean(h.innerText));
      const h = hs[0];
      const imgs = [...el.querySelectorAll('img')].filter((m) => shown(m));
      const smallRowImgs = imgs.filter((m) => { const b = m.getBoundingClientRect(); return b.height > 0 && b.height <= 130 && b.width <= 260; }).length;
      let buttons = 0;
      for (const b of el.querySelectorAll('a, button, input[type=submit]')) { const bx = docBox(b); if (bx && shown(b) && buttonLike(b, getComputedStyle(b), bx)) buttons++; }
      const forms = el.querySelectorAll('form').length;
      const cols = columnsOf(inner);
      const words = clean(el.innerText).split(' ').filter(Boolean).length;
      const aligns = {};
      for (const t of [...hs, ...el.querySelectorAll('p')].slice(0, 30)) inc(aligns, getComputedStyle(t).textAlign);
      const align = Object.entries(aligns).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      const isFooter = el.matches(FOOTER_SEL) || !!el.closest(FOOTER_SEL);
      const isHeader = el.matches(HEADER_SEL) || !!el.closest(HEADER_SEL);
      const kind = isFooter ? 'footer' : isHeader ? 'header'
        : !heroDone && r.top + scrollY < vh && r.height >= vh * 0.3 && (el.querySelector('h1') || (h && px(getComputedStyle(h).fontSize) >= 32)) ? (heroDone = true, 'hero')
        : forms ? 'form'
        : smallRowImgs >= 5 && words < 80 ? 'logos'
        : el.querySelector('details, .elementor-accordion, .elementor-toggle, [class*="faq"], [class*="accordion"]') ? 'faq/accordion'
        : el.querySelector('.swiper, .slick-slider, .owl-carousel, .splide, .flickity-enabled, [class*="carousel"]') ? 'carousel'
        : /testimonial|review|המלצ/i.test(`${el.className} ${el.id} ${inner.className}`) ? 'testimonials'
        : cols.cols >= 3 && (imgs.length >= 3 || cols.items >= 3) ? 'grid/cards'
        : r.height < vh * 0.5 && buttons >= 1 && hs.length <= 2 ? 'cta band'
        : 'content';
      return {
        i, dx: tag(el), el: describe(el), tag: el.tagName.toLowerCase(), id: el.id || null,
        top: r1(r.top + scrollY), height: r1(r.height), width: r1(r.width),
        kind, bg, overlays,
        paddingY: [Math.max(px(cs.paddingTop), px(ics.paddingTop)), Math.max(px(cs.paddingBottom), px(ics.paddingBottom))].map(r0),
        minHeight: cs.minHeight !== '0px' && cs.minHeight !== 'auto' ? cs.minHeight : null,
        heading: h ? { level: +h.tagName[1], text: cut(h.innerText, 120), ...styleOfText(h) } : null,
        headings: hs.length, images: imgs.length, buttons, forms, words, align, columns: cols,
        items: sectionItems(el),
      };
    });
  };

  // ------------------------------------------------------------------ header / footer / nav
  function findHeader() {
    if (DX._header && DX._header.isConnected) return DX._header;
    const found = detectHeader();
    if (found && scrollY < 80) DX._header = found;
    return found;
  }
  function detectHeader() {
    const vw = document.documentElement.clientWidth;
    const cands = [...document.querySelectorAll(HEADER_SEL)].filter((h) => {
      const r = h.getBoundingClientRect();
      return shown(h) && r.width >= vw * 0.8 && r.height >= 30 && r.top + scrollY < 260;
    });
    const outer = cands.filter((h) => !cands.some((o) => o !== h && o.contains(h)));
    if (outer.length) return outer.sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
    for (const el of document.body.querySelectorAll('header, div, section, nav')) {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      const r = el.getBoundingClientRect();
      if (r.width >= vw * 0.9 && r.height >= 40 && r.height <= 260 && r.top <= 5 && shown(el, cs)) return el;
    }
    return null;
  }
  DX.headerState = function () {
    const h = findHeader();
    if (!h) return null;
    const cs = getComputedStyle(h);
    const r = h.getBoundingClientRect();
    let paint = h;
    if (!hasPaint(cs)) {
      paint = [...h.querySelectorAll('*')].find((e) => { const c = getComputedStyle(e); const rr = e.getBoundingClientRect(); return hasPaint(c) && rr.width >= r.width * 0.9 && rr.height >= 30 && shown(e, c); }) || h;
    }
    const pcs = getComputedStyle(paint);
    const pr = paint.getBoundingClientRect();
    const pinned = [h, ...h.querySelectorAll('*')].filter((e) => { const p = getComputedStyle(e).position; return (p === 'fixed' || p === 'sticky') && e.getBoundingClientRect().width >= r.width * 0.8; }).map((e) => ({ el: describe(e), position: getComputedStyle(e).position }));
    const probe = document.elementFromPoint(innerWidth / 2, 4);
    // The first picture in the header is often an icon or a Lottie animation, not the logo.
    const logoScore = (e) => {
      let sig = '', s = 0;
      for (let a = e, d = 0; a && a !== h && d < 5; a = a.parentElement, d++) sig += ` ${a.id} ${typeof a.className === 'string' ? a.className : a.getAttribute('class') || ''} ${a.getAttribute('alt') || ''} ${a.getAttribute('src') || ''}`;
      if (/logo/i.test(sig)) s += 5;
      const home = e.closest('a')?.getAttribute('href') || '';
      if (/^(\/|https?:\/\/[^/]+\/?)$/.test(home)) s += 3;
      if (/lottie/i.test(sig)) s -= 6;
      const b = e.getBoundingClientRect();
      if (b.width / b.height >= 2) s += 1;
      return s;
    };
    const logo = [...h.querySelectorAll('img, svg')].filter((e) => { const b = e.getBoundingClientRect(); return shown(e) && b.height >= 16 && b.width >= 30; }).map((e, i) => ({ e, s: logoScore(e) - i * 0.01 })).sort((a, b) => b.s - a.s)[0]?.e;
    const lb = logo && logo.getBoundingClientRect();
    return {
      dx: tag(h), el: describe(h), scrollY: r0(scrollY), top: r1(r.top), height: r1(r.height), position: cs.position, pinned,
      paint: describe(paint), bg: withAlpha(normColor(pcs.backgroundColor), +pcs.opacity), bgImage: pcs.backgroundImage !== 'none' ? cut(pcs.backgroundImage, 200) : null,
      shadow: pcs.boxShadow !== 'none' ? pcs.boxShadow : null, borderBottom: borderOf(pcs, 'Bottom'),
      // Floating "pill" headers: the painted bar is narrower than the header and rounded.
      bar: paint !== h ? { w: r1(pr.width), h: r1(pr.height), insetX: r1(pr.left - r.left), insetTop: r1(pr.top - r.top), radius: pcs.borderRadius, border: borderOf(pcs, 'Top'), padding: padOf(pcs) } : null,
      backdrop: pcs.backdropFilter !== 'none' ? pcs.backdropFilter : null,
      classes: typeof h.className === 'string' ? h.className.slice(0, 200) : '',
      coversTop: !!(probe && (h.contains(probe) || probe.closest(HEADER_SEL))),
      logo: logo ? { tag: logo.tagName.toLowerCase(), src: logo.currentSrc || logo.src || null, alt: logo.alt || null, w: r1(lb.width), h: r1(lb.height), x: r1(lb.left), dx: tag(logo), svg: logo.tagName.toLowerCase() === 'svg' ? logo.outerHTML.slice(0, 200000) : null } : null,
    };
  };
  DX.navInfo = function () {
    const h = findHeader();
    if (!h) return null;
    const inMenus = [...h.querySelectorAll(NAV_SEL)].flatMap((n) => [...n.querySelectorAll('a')]);
    const menuLink = (a) => {
      const cs = getComputedStyle(a); const b = docBox(a);
      if (!b || !shown(a, cs) || buttonLike(a, cs, b) || a.querySelector('img')) return false;
      const href = a.getAttribute('href') || '';
      if (/^(tel:|mailto:)/i.test(href) || /facebook|instagram|linkedin|youtube|tiktok|wa\.me|whatsapp|twitter\.com|x\.com/i.test(href)) return false;
      const th = textHolder(a);
      return !!th && !!clean(th.textContent);
    };
    let links = [...new Set(inMenus)].filter(menuLink);
    if (!links.length) links = [...h.querySelectorAll('a')].filter(menuLink);
    const items = links.map((a) => ({ a, r: a.getBoundingClientRect() }));
    const sorted = [...items].sort((x, y) => x.r.left - y.r.left);
    const gaps = sorted.slice(1).map((it, i) => it.r.left - sorted[i].r.right).filter((g) => g >= 0 && g < 200);
    const ctas = [...h.querySelectorAll('a, button')].filter((a) => { const cs = getComputedStyle(a); const b = docBox(a); return b && shown(a, cs) && buttonLike(a, cs, b); }).map((a) => ({ text: cut(a.innerText, 40), dx: tag(a) }));
    return {
      count: items.length, items: items.slice(0, 25).map(({ a }) => cut(a.innerText, 40)),
      style: links[0] ? styleOfText(links[0]) : null, sampleDx: links[0] ? tag(links[0]) : null,
      padding: links[0] ? padOf(getComputedStyle(links[0])) : null,
      gap: gaps.length ? r1(median(gaps)) : null,
      dropdowns: h.querySelectorAll('.sub-menu, .dropdown-menu, ul ul').length,
      ctas, phones: [...h.querySelectorAll('a[href^="tel:"]')].map((a) => cut(a.innerText || a.href, 30)),
      social: [...h.querySelectorAll('a[href*="facebook"], a[href*="instagram"], a[href*="linkedin"], a[href*="youtube"], a[href*="tiktok"], a[href*="wa.me"], a[href*="whatsapp"]')].length,
      search: !!h.querySelector('input[type="search"], [class*="search"]'),
      cart: !!h.querySelector('[class*="cart"], [href*="cart"]'),
    };
  };
  DX.footerInfo = function () {
    const f = [...document.querySelectorAll(FOOTER_SEL)].filter((e) => shown(e) && e.getBoundingClientRect().height > 40).pop();
    if (!f) return null;
    const cs = getComputedStyle(f);
    const texts = {};
    for (const e of f.querySelectorAll('*')) { if (ownText(e)) { const c = normColor(getComputedStyle(e).color); inc(texts, c, ownText(e).length); } }
    const headings = [...f.querySelectorAll('h1,h2,h3,h4,h5,h6, .widget-title, .elementor-heading-title')].filter((e) => shown(e));
    const link = [...f.querySelectorAll('a')].find((a) => shown(a) && clean(a.innerText));
    const copy = [...f.querySelectorAll('*')].find((e) => /©|כל הזכויות|all rights reserved/i.test(ownText(e)));
    const r = f.getBoundingClientRect();
    return {
      dx: tag(f), el: describe(f), height: r1(r.height), bg: paintedBg(f), paddingY: [cs.paddingTop, cs.paddingBottom],
      textColors: Object.entries(texts).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => c),
      columns: columnsOf(f), headingStyle: headings[0] ? styleOfText(headings[0]) : null, headings: headings.slice(0, 8).map((h) => cut(h.innerText, 40)),
      linkStyle: link ? styleOfText(link) : null,
      social: f.querySelectorAll('a[href*="facebook"], a[href*="instagram"], a[href*="linkedin"], a[href*="youtube"], a[href*="tiktok"], a[href*="wa.me"], a[href*="whatsapp"]').length,
      copyright: copy ? cut(copy.innerText, 160) : null, logo: !!f.querySelector('img[src*="logo"], [class*="logo"] img, svg'),
    };
  };

  // ------------------------------------------------------------------ cards
  function findSurface(el, area) {
    let cur = el;
    for (let d = 0; d < 5 && cur; d++) {
      if (hasPaint(getComputedStyle(cur))) return cur;
      cur = [...cur.children].find((c) => { const cr = c.getBoundingClientRect(); return cr.width * cr.height >= area * 0.8; });
    }
    return null;
  }
  function cardGroups() {
    const vw = document.documentElement.clientWidth;
    const out = [];
    for (const p of document.body.querySelectorAll('*')) {
      if (SKIP.has(p.tagName) || p.children.length < 3 || p.children.length > 48) continue;
      const kids = [];
      for (const k of p.children) {
        if (SKIP.has(k.tagName)) continue;
        const r = k.getBoundingClientRect();
        if (r.width >= 110 && r.height >= 90 && r.width < vw * 0.9 && shown(k)) kids.push([k, r]);
      }
      if (kids.length < 3) continue;
      const sig = (k) => k.tagName + '.' + (typeof k.className === 'string' ? k.className.split(/\s+/).filter((c) => c && !/\d/.test(c) && !/active|current|selected|visible|animated|duplicate|next|prev|hover/i.test(c)).sort().join('.') : '');
      const groups = {};
      for (const kr of kids) (groups[sig(kr[0])] = groups[sig(kr[0])] || []).push(kr);
      const best = Object.values(groups).sort((a, b) => b.length - a.length)[0];
      if (!best || best.length < 3) continue;
      const ws = best.map(([, r]) => r.width);
      if (Math.max(...ws) / Math.min(...ws) > 1.3) continue;
      const rowTop = best[0][1].top;
      const perRow = best.filter(([, r]) => Math.abs(r.top - rowTop) < 10).length;
      if (perRow < 2 && vw > 700) continue;
      const [sample, sr] = best[0];
      if (!sample.querySelector('img, svg, picture, h1, h2, h3, h4, h5, h6, p')) continue;
      const surface = findSurface(sample, sr.width * sr.height);
      const scs = surface && getComputedStyle(surface);
      const img = sample.querySelector('img');
      const ir = img && img.getBoundingClientRect();
      const hd = sample.querySelector('h1, h2, h3, h4, h5, h6, .elementor-heading-title, [class*="title"]');
      const btn = [...sample.querySelectorAll('a, button')].find((b) => { const bx = docBox(b); return bx && buttonLike(b, getComputedStyle(b), bx); });
      out.push({
        parent: describe(p), region: region(p), count: best.length, perRow, w: r0(median(ws)), h: r0(median(best.map(([, r]) => r.height))),
        y: r0(sr.top + scrollY), sampleDx: tag(sample), surfaceDx: surface ? tag(surface) : null,
        style: scs ? { bg: withAlpha(normColor(scs.backgroundColor), +scs.opacity), bgImage: scs.backgroundImage !== 'none' ? cut(scs.backgroundImage, 200) : null, border: borderOf(scs), radius: scs.borderRadius, shadow: scs.boxShadow !== 'none' ? scs.boxShadow : null, padding: padOf(scs), overflow: scs.overflow, transition: scs.transitionDuration !== '0s' ? scs.transition : null } : null,
        textAlign: getComputedStyle(sample).textAlign,
        img: img && ir.width ? { w: r0(ir.width), h: r0(ir.height), ratio: r2(ir.width / ir.height), fit: getComputedStyle(img).objectFit, radius: getComputedStyle(img).borderRadius } : null,
        heading: hd ? { text: cut(hd.innerText, 60), ...styleOfText(hd) } : null,
        button: btn ? cut(btn.innerText, 30) : null,
        text: cut(sample.innerText, 160),
      });
      if (out.length >= 40) break;
    }
    return out.sort((a, b) => b.count - a.count).slice(0, 16);
  }

  // ------------------------------------------------------------------ misc detectors
  function detectTech() {
    const has = (s) => { try { return !!document.querySelector(s); } catch { return false; } };
    const res = performance.getEntriesByType('resource').map((r) => r.name);
    const anyRes = (re) => res.some((u) => re.test(u));
    const gen = document.querySelector('meta[name="generator"]')?.content || '';
    let utility = 0;
    for (const el of document.querySelectorAll('[class]')) {
      if (typeof el.className === 'string' && /(^|\s)(?:[a-z]+:)?(?:p[xytrbl]?|m[xytrbl]?|text|bg|flex|grid|gap|w|h|rounded|items|justify)-[\w./[\]-]+/.test(el.className)) utility++;
      if (utility > 60) break;
    }
    return {
      generator: gen || null,
      wordpress: /wordpress/i.test(gen) || anyRes(/\/wp-(content|includes)\//) || has('link[href*="/wp-content/"], script[src*="/wp-content/"]'),
      elementor: has('.elementor, [data-elementor-type]'), elementorPro: has('[data-elementor-type="header"], .elementor-location-header'),
      woocommerce: has('.woocommerce, .woocommerce-page, body.woocommerce'), divi: has('.et_pb_section, #et-main-area'), wpbakery: has('.vc_row, .wpb_row'), gutenberg: has('.wp-block-group, .wp-block-columns, .wp-block-cover'),
      wix: anyRes(/static\.wixstatic\.com|parastorage\.com/), shopify: !!window.Shopify || anyRes(/cdn\.shopify\.com/), webflow: has('html[data-wf-page], [data-wf-site]'),
      squarespace: anyRes(/squarespace/), framer: anyRes(/framerusercontent|framer\.com/) || has('[data-framer-name]'),
      nextjs: !!window.__NEXT_DATA__ || has('#__next') || anyRes(/\/_next\//), nuxt: !!window.__NUXT__, react: has('[data-reactroot], #root, #__next'),
      tailwindLike: utility > 60, bootstrap: has('.container .row [class*="col-"]') && (anyRes(/bootstrap/) || has('link[href*="bootstrap"]')),
      jquery: !!window.jQuery, gsap: !!(window.gsap || window.TweenMax), scrollTrigger: !!window.ScrollTrigger,
      aos: has('[data-aos]'), wow: has('.wow'), animateCss: has('.animate__animated, .animated'),
      swiper: has('.swiper, .swiper-container'), slick: has('.slick-slider'), owl: has('.owl-carousel'), splide: has('.splide'), flickity: has('.flickity-enabled'),
      lottie: has('lottie-player, dotlottie-player, .elementor-widget-lottie') || !!(window.lottie || window.bodymovin),
      wpRocket: has('script[data-rocket-status], script[type="rocketlazyloadscript"], script[data-rocket-src]'),
      smoothScroll: has('html.lenis, [data-scroll-container]') || !!window.lenis,
      fontAwesome: has('[class*="fa-"], .fa, .fas, .far, .fab'), googleFonts: anyRes(/fonts\.(googleapis|gstatic)\.com/) || has('link[href*="fonts.googleapis"]'), typekit: anyRes(/typekit\.net/),
      accessibilityWidget: has('#enable-toolbar, .enable-toolbar, #userwayAccessibilityIcon, .uwy, #nagishli, #acsb, [class*="accessibility"], [id*="accessibility"], [aria-label*="נגישות"]'),
      whatsapp: has('a[href*="wa.me"], a[href*="api.whatsapp"], a[href*="whatsapp"]'),
      cookieBanner: has('#cookie-notice, .cky-consent-container, #onetrust-banner-sdk, .cmplz-cookiebanner, [class*="cookie"]'),
    };
  }
  function entrance() {
    const out = { aos: {}, elementor: {}, wow: {}, animateCss: {} };
    document.querySelectorAll('[data-aos]').forEach((e) => inc(out.aos, e.getAttribute('data-aos')));
    document.querySelectorAll('[data-settings]').forEach((e) => {
      try {
        const s = JSON.parse(e.getAttribute('data-settings'));
        for (const k of ['_animation', 'animation']) if (s[k] && s[k] !== 'none') inc(out.elementor, s[k]);
        if (s.motion_fx_motion_fx_scrolling === 'yes' || s.background_motion_fx_motion_fx_scrolling === 'yes') inc(out.elementor, 'motion-fx: scrolling');
        if (s.motion_fx_motion_fx_mouse === 'yes') inc(out.elementor, 'motion-fx: mouse');
        if (s.sticky) inc(out.elementor, 'sticky: ' + s.sticky);
        if (s.background_background === 'slideshow') inc(out.elementor, 'background slideshow');
      } catch { /* not JSON */ }
    });
    document.querySelectorAll('.wow').forEach((e) => inc(out.wow, [...e.classList].find((c) => c !== 'wow' && /^[a-z]+[A-Z]/.test(c)) || 'wow'));
    document.querySelectorAll('[class*="animate__"]').forEach((e) => { for (const c of e.classList) if (c.startsWith('animate__') && c !== 'animate__animated') inc(out.animateCss, c.slice(9)); });
    return out;
  }
  function cssVars() {
    const out = {};
    for (const el of [document.documentElement, document.body]) {
      const cs = getComputedStyle(el);
      for (let i = 0; i < cs.length; i++) {
        const p = cs[i];
        if (p.startsWith('--') && !(p in out)) { const v = cs.getPropertyValue(p).trim(); if (v && v.length < 400) out[p] = v; }
      }
    }
    return out;
  }
  function metaInfo() {
    const q = (s, a = 'content') => document.querySelector(s)?.getAttribute(a) || null;
    const icon = document.querySelector('link[rel~="icon"]');
    return {
      url: location.href, title: document.title, lang: document.documentElement.lang || null,
      dir: document.documentElement.dir || getComputedStyle(document.body).direction,
      description: q('meta[name="description"]'), themeColor: q('meta[name="theme-color"]'), ogImage: q('meta[property="og:image"]'),
      siteName: q('meta[property="og:site_name"]'), generator: q('meta[name="generator"]'), viewportMeta: q('meta[name="viewport"]'),
      favicon: icon ? icon.href : null, canonical: q('link[rel="canonical"]', 'href'),
    };
  }
  function fontsInfo() {
    try {
      return [...document.fonts].map((f) => ({ family: f.family.replace(/^["']|["']$/g, ''), weight: f.weight, style: f.style, status: f.status, display: f.display, unicodeRange: f.unicodeRange && f.unicodeRange !== 'U+0-10FFFF' ? f.unicodeRange.slice(0, 80) : null }));
    } catch { return []; }
  }

  // ------------------------------------------------------------------ main collector
  DX.collect = function (opts = {}) {
    const t0 = performance.now();
    const budget = opts.budgetMs || 25000;
    const maxEls = opts.maxElements || 20000;
    const de = document.documentElement, body = document.body;
    if (!body) return { error: 'no <body>' };
    const docW = Math.max(de.scrollWidth, de.clientWidth);
    const docH = Math.max(de.scrollHeight, body.scrollHeight);
    const vw = de.clientWidth;

    const colors = {};
    const addColor = (hex, prop, el, extra) => {
      if (!hex) return;
      const c = colors[hex] || (colors[hex] = { hex, count: 0, area: 0, chars: 0, mainChars: 0, props: {}, samples: [] });
      c.count++;
      c.props[prop] = (c.props[prop] || 0) + 1;
      if (extra && extra.area) c.area += extra.area;
      if (extra && extra.chars) { c.chars += extra.chars; if (extra.main) c.mainChars += extra.chars; }
      if (curWidget) c.widget = (c.widget || 0) + 1;
      if (el && c.samples.length < 4) { const d = describe(el); if (!c.samples.includes(d)) c.samples.push(d); }
    };
    const note = (h, key, el, kind) => {
      if (!key) return;
      const e = h[key] || (h[key] = { count: 0, kinds: {}, samples: [] });
      e.count++;
      if (kind) e.kinds[kind] = (e.kinds[kind] || 0) + 1;
      if (el && e.samples.length < 3) { const d = describe(el); if (!e.samples.includes(d)) e.samples.push(d); }
    };

    const text = {};
    const hist = { padding: {}, margin: {}, gap: {}, radius: {}, shadow: {}, textShadow: {}, border: {}, transition: {}, animation: {}, gradient: {}, maxWidth: {}, centered: {}, display: {}, gridCols: {}, fontFamilies: {}, iconFonts: {}, lineHeightRatio: {}, aspect: {}, filters: {}, blend: {} };
    const headings = [], buttons = {}, links = {}, inputs = {}, images = [], bgImages = [], fixed = [], embeds = [], forms = [];
    const svgs = { count: 0, sizes: {} };
    const widgets = [];
    let curWidget = false;
    const canvasBg = normColor(getComputedStyle(body).backgroundColor) || normColor(getComputedStyle(de).backgroundColor) || '#ffffff';
    addColor(canvasBg, 'background', body, { area: docW * Math.min(docH, 20000) });
    const els = body.getElementsByTagName('*');
    let visited = 0, visible = 0, totalChars = 0, truncated = false, pseudoChecks = true;

    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (SKIP.has(el.tagName)) continue;
      if (++visited > maxEls || (visited % 250 === 0 && performance.now() - t0 > budget)) { truncated = true; break; }
      if (pseudoChecks && visited % 500 === 0 && performance.now() - t0 > budget * 0.5) pseudoChecks = false;
      const tagName = el.tagName.toLowerCase();

      if (el instanceof SVGElement && tagName !== 'svg') {
        if (!/^(path|circle|rect|polygon|ellipse|line|polyline|text|tspan|use)$/.test(tagName)) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        if (cs.fill && cs.fill !== 'none' && !cs.fill.startsWith('url')) addColor(normColor(cs.fill), 'svg', el);
        if (cs.stroke && cs.stroke !== 'none' && !cs.stroke.startsWith('url')) addColor(normColor(cs.stroke), 'svg', el);
        continue;
      }

      const cs = getComputedStyle(el);
      if (!shown(el, cs)) continue;
      const box = docBox(el);
      if (!box) continue;
      visible++;
      const area = Math.min(box.w, docW) * Math.min(box.h, 20000);
      if (cs.position === 'fixed' && box.w < vw * 0.9 && !el.closest(HEADER_SEL)) widgets.push(el);
      curWidget = widgets.length > 0 && widgets.some((w) => w === el || w.contains(el));
      const reg = curWidget ? 'widget' : region(el);
      const opacity = +cs.opacity;
      const isBtn = !curWidget && buttonLike(el, cs, box);
      const kind = curWidget ? 'widget' : kindOf(el, tagName, isBtn);
      const tiny = box.w < 12 || box.h < 12;

      // colors
      const bg = withAlpha(normColor(cs.backgroundColor), opacity);
      if (bg) addColor(bg, 'background', el, { area });
      if (cs.backgroundImage !== 'none') {
        if (cs.backgroundImage.includes('gradient')) {
          for (const c of colorsIn(cs.backgroundImage)) addColor(c, 'gradient', el, { area: area / 2 });
          note(hist.gradient, cut(cs.backgroundImage.replace(/url\([^)]*\),?\s*/g, ''), 300), el, kind);
        }
        const urls = [...cs.backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map((m) => m[1]);
        if (urls.length && bgImages.length < 250) {
          bgImages.push({ urls: urls.slice(0, 3).map((u) => u.slice(0, 400)), size: cs.backgroundSize, position: cs.backgroundPosition, repeat: cs.backgroundRepeat, attachment: cs.backgroundAttachment, box, region: reg, el: describe(el), dx: tag(el) });
        }
      }
      for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
        const b = borderOf(cs, side);
        if (b) { addColor(b.split(' ')[2], 'border', el); note(hist.border, b, el, kind); }
      }
      if (cs.outlineStyle !== 'none' && px(cs.outlineWidth) > 0) addColor(normColor(cs.outlineColor), 'outline', el);
      if (cs.boxShadow !== 'none' && !tiny) { note(hist.shadow, cs.boxShadow, el, kind); for (const c of colorsIn(cs.boxShadow)) addColor(c, 'shadow', el); }
      if (cs.filter !== 'none') note(hist.filters, cs.filter, el, kind);
      if (cs.backdropFilter && cs.backdropFilter !== 'none') note(hist.filters, 'backdrop: ' + cs.backdropFilter, el, kind);
      if (cs.mixBlendMode !== 'normal') note(hist.blend, cs.mixBlendMode, el, kind);

      // shape & space
      const rad = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius];
      if (!tiny && rad.some((v) => px(v) > 0)) {
        const vals = rad.map((v) => (v.includes('%') ? v.split(' ')[0] : r1(px(v)) + 'px'));
        const pill = !vals[0].includes('%') && px(vals[0]) >= Math.min(box.h, box.w) / 2 - 1;
        note(hist.radius, pill ? 'pill (≥ half height)' : vals.every((v) => v === vals[0]) ? vals[0] : vals.join(' '), el, kind);
      }
      for (const p of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) { const v = r0(px(cs[p])); if (v > 0) inc(hist.padding, v); }
      for (const p of ['marginTop', 'marginBottom']) { const v = r0(px(cs[p])); if (v > 0) inc(hist.margin, v); }
      if (/flex|grid/.test(cs.display)) {
        inc(hist.display, cs.display);
        const rg = px(cs.rowGap), cg = px(cs.columnGap);
        if (rg > 0) inc(hist.gap, r0(rg));
        if (cg > 0 && r0(cg) !== r0(rg)) inc(hist.gap, r0(cg));
        if (cs.display.includes('grid') && cs.gridTemplateColumns !== 'none') inc(hist.gridCols, cs.gridTemplateColumns.split(' ').length + ' cols');
      }
      if (cs.maxWidth !== 'none' && box.w >= 320) inc(hist.maxWidth, cs.maxWidth);
      if (box.w >= 480 && box.w <= vw - 24 && box.h >= 40 && Math.abs(box.x - (docW - (box.x + box.w))) <= 2) inc(hist.centered, r0(box.w));

      // motion
      if (cs.transitionDuration && cs.transitionDuration !== '0s') {
        const props = cs.transitionProperty.split(',').map((s) => s.trim());
        const durs = cs.transitionDuration.split(',').map((s) => s.trim());
        const eases = splitTop(cs.transitionTimingFunction);
        props.forEach((p, k) => { const d = durs[k % durs.length]; if (d !== '0s') note(hist.transition, `${p} ${d} ${eases[k % eases.length] || 'ease'}`, el, kind); });
      }
      if (cs.animationName && cs.animationName !== 'none') {
        for (const n of cs.animationName.split(',')) note(hist.animation, `${n.trim()} ${cs.animationDuration.split(',')[0]} ${splitTop(cs.animationTimingFunction)[0]}${cs.animationIterationCount === 'infinite' ? ' infinite' : ''}`, el, kind);
      }

      // pinned layers (sticky header, floating WhatsApp / accessibility buttons...)
      if ((cs.position === 'fixed' || cs.position === 'sticky') && fixed.length < 40) {
        const r = el.getBoundingClientRect();
        if (r.width >= 16 && r.height >= 16) {
          fixed.push({ dx: tag(el), el: describe(el), position: cs.position, rect: { x: r1(r.left), y: r1(r.top), w: r1(r.width), h: r1(r.height) }, z: cs.zIndex, bg, radius: cs.borderRadius, shadow: cs.boxShadow !== 'none' ? cs.boxShadow : null, text: cut(el.innerText, 80), region: reg, href: (el.closest('a') || el.querySelector('a'))?.href?.slice(0, 200) || null });
        }
      }

      // media
      if (tagName === 'img' && images.length < 400) {
        images.push({ src: (el.currentSrc || el.src || '').slice(0, 400), alt: cut(el.alt, 80), w: box.w, h: box.h, nw: el.naturalWidth, nh: el.naturalHeight, fit: cs.objectFit, radius: cs.borderRadius, region: reg, x: box.x, y: box.y, dx: tag(el), filter: cs.filter !== 'none' ? cs.filter : null });
        const ratio = box.w / box.h;
        inc(hist.aspect, ratio > 2.2 ? 'panorama (>2.2)' : ratio > 1.6 ? '16:9-ish' : ratio > 1.2 ? '4:3-ish' : ratio > 0.9 ? 'square-ish' : ratio > 0.6 ? 'portrait 3:4' : 'tall portrait');
      }
      if (tagName === 'svg') { svgs.count++; inc(svgs.sizes, `${r0(box.w)}x${r0(box.h)}`); }
      if (tagName === 'video' || tagName === 'iframe') embeds.push({ type: tagName, src: (el.currentSrc || el.src || '').slice(0, 300), host: hostOf(el.currentSrc || el.src), w: box.w, h: box.h, y: box.y, region: reg, autoplay: !!el.autoplay, loop: !!el.loop, muted: !!el.muted });
      if (tagName === 'form' && forms.length < 20) forms.push({ dx: tag(el), el: describe(el), fields: el.querySelectorAll('input:not([type=hidden]), textarea, select').length, box, region: reg });

      // text & typography
      let txt = ownText(el);
      if (!txt && tagName === 'input' && /^(submit|button|reset)$/i.test(el.type)) txt = clean(el.value);
      if (txt) {
        const chars = txt.length;
        totalChars += chars;
        const fam = firstFamily(cs.fontFamily);
        const size = r1(px(cs.fontSize));
        const lh = cs.lineHeight === 'normal' ? 'normal' : r1(px(cs.lineHeight));
        const ls = cs.letterSpacing === 'normal' ? 0 : r2(px(cs.letterSpacing));
        const role = textRole(el);
        const key = [fam, size, cs.fontWeight, lh, ls, cs.textTransform, cs.fontStyle].join('|');
        const t = text[key] || (text[key] = { family: fam, stack: cs.fontFamily, size, weight: +cs.fontWeight || cs.fontWeight, lineHeight: lh, letterSpacing: ls, transform: cs.textTransform, style: cs.fontStyle, count: 0, chars: 0, roles: {}, regions: {}, colors: {}, mainColors: {}, align: {}, samples: [], dx: null });
        t.count++; t.chars += chars;
        inc(t.roles, role, chars); inc(t.regions, reg, chars); inc(t.align, cs.textAlign);
        const tc = withAlpha(normColor(cs.color), opacity);
        if (tc) { inc(t.colors, tc, chars); if (reg === 'main') inc(t.mainColors, tc, chars); addColor(tc, 'text', el, { chars, main: reg === 'main' }); }
        const sample = cut(txt, 70);
        if (t.samples.length < 3 && chars >= 3 && !t.samples.includes(sample)) t.samples.push(sample);
        if (!t.dx) t.dx = tag(el);
        inc(hist.fontFamilies, fam, chars);
        if (lh !== 'normal' && size) inc(hist.lineHeightRatio, r2(lh / size), chars);
        if (cs.textShadow !== 'none') note(hist.textShadow, cs.textShadow, el, role);
      }
      if (/^h[1-6]$/.test(tagName) && headings.length < 200) {
        const ht = clean(el.innerText);
        if (ht) headings.push({ level: +tagName[1], text: cut(ht, 120), y: box.y, region: reg, dx: tag(el), ...styleOfText(el) });
      }

      // pseudo elements: icon fonts, decorative bars, overlays
      if (pseudoChecks) {
        for (const pseudo of ['::before', '::after']) {
          const ps = getComputedStyle(el, pseudo);
          const content = ps.content;
          if (!content || content === 'none' || content === 'normal') continue;
          const pbg = withAlpha(normColor(ps.backgroundColor), +ps.opacity);
          if (pbg) addColor(pbg, 'pseudo', el, { area: area * 0.1 });
          if (ps.backgroundImage.includes('gradient')) for (const c of colorsIn(ps.backgroundImage)) addColor(c, 'pseudo', el, { area: area * 0.1 });
          if (ICON_FONT_RE.test(ps.fontFamily) || /^["'][-]/.test(content)) { inc(hist.iconFonts, firstFamily(ps.fontFamily)); addColor(normColor(ps.color), 'icon', el); }
        }
      }

      // components
      if (isBtn) {
        const ts = styleOfText(el);
        const bgKey = bg || (cs.backgroundImage.includes('gradient') ? 'gradient' : 'transparent');
        const border = borderOf(cs) || 'none';
        const shape = px(cs.borderTopLeftRadius) >= box.h / 2 - 1 ? 'pill' : px(cs.borderTopLeftRadius) > 0 ? 'rounded' : 'square';
        const key = [bgKey, ts.color, border, shape === 'pill' ? 'pill' : cs.borderTopLeftRadius, r0(ts.size), ts.weight, r0(box.h / 4) * 4].join('|');
        const b = buttons[key] || (buttons[key] = {
          bg: bgKey, gradient: cs.backgroundImage.includes('gradient') ? cut(cs.backgroundImage, 300) : null, color: ts.color, border, radius: cs.borderTopLeftRadius, shape,
          fontFamily: ts.family, fontSize: ts.size, fontWeight: ts.weight, textTransform: ts.transform, letterSpacing: ts.letterSpacing,
          padding: padOf(cs), height: r0(box.h), widths: [], shadow: cs.boxShadow !== 'none' ? cs.boxShadow : null,
          transition: cs.transitionDuration !== '0s' ? cs.transition : null, icon: !!el.querySelector('svg, i, [class*="icon"]'),
          count: 0, regions: {}, labels: [], dx: tag(el),
        });
        b.count++; inc(b.regions, reg);
        if (b.widths.length < 20) b.widths.push(r0(box.w));
        const label = cut(el.innerText || el.value, 40);
        if (label && b.labels.length < 6 && !b.labels.includes(label)) b.labels.push(label);
      } else if (tagName === 'a' && !curWidget) {
        const lt = clean(el.innerText);
        if (lt) {
          const ts = styleOfText(el);
          const key = [reg, ts.color, ts.decoration, ts.weight, r0(ts.size)].join('|');
          const l = links[key] || (links[key] = { region: reg, color: ts.color, decoration: ts.decoration, weight: ts.weight, size: ts.size, family: ts.family, transform: ts.transform, count: 0, samples: [], dx: tag(el) });
          l.count++;
          if (l.samples.length < 4) l.samples.push(cut(lt, 30));
        }
      }
      if (/^(input|textarea|select)$/.test(tagName) && !/^(hidden|submit|button|reset|image|checkbox|radio|range|color|file)$/i.test(el.type || '')) {
        const ph = getComputedStyle(el, '::placeholder');
        const key = [tagName === 'textarea' ? 'textarea' : r0(box.h), bg, borderOf(cs) || 'none', borderOf(cs, 'Bottom') || 'none', cs.borderTopLeftRadius, r0(px(cs.fontSize))].join('|');
        const f = inputs[key] || (inputs[key] = { tag: tagName, type: el.type || tagName, height: r0(box.h), bg: bg || 'transparent', border: borderOf(cs) || 'none', borderBottom: borderOf(cs, 'Bottom') || 'none', radius: cs.borderTopLeftRadius, fontSize: r1(px(cs.fontSize)), fontWeight: cs.fontWeight, fontFamily: firstFamily(cs.fontFamily), color: normColor(cs.color), placeholderColor: normColor(ph.color), padding: padOf(cs), shadow: cs.boxShadow !== 'none' ? cs.boxShadow : null, count: 0, samples: [], dx: tag(el), region: reg });
        f.count++;
        const s = cut(el.placeholder || el.getAttribute('aria-label') || el.name || '', 40);
        if (s && f.samples.length < 5 && !f.samples.includes(s)) f.samples.push(s);
      }
    }

    const bodyCs = getComputedStyle(body);
    const inlineCss = [];
    let inlineLen = 0;
    for (const s of document.querySelectorAll('style')) {
      const t = s.textContent || '';
      if (t.trim().length > 20 && inlineLen + t.length < 4e6) { inlineCss.push(t); inlineLen += t.length; }
    }
    const stats = { elements: els.length, visited, visible, textChars: totalChars, truncated, pseudoChecks, ms: r0(performance.now() - t0) };
    return {
      meta: metaInfo(), stats, docW, docH, viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio },
      base: { bodyBg: normColor(bodyCs.backgroundColor) || normColor(getComputedStyle(de).backgroundColor) || null, color: normColor(bodyCs.color), font: bodyCs.fontFamily, fontSize: bodyCs.fontSize, lineHeight: bodyCs.lineHeight, direction: bodyCs.direction, textAlign: bodyCs.textAlign },
      colors, text, hist, headings, svgs,
      buttons: Object.values(buttons).sort((a, b) => b.count - a.count),
      links: Object.values(links).sort((a, b) => b.count - a.count).slice(0, 40),
      inputs: Object.values(inputs).sort((a, b) => b.count - a.count),
      images, bgImages, fixed, embeds, forms,
      cards: cardGroups(),
      sections: DX.sections(),
      header: DX.headerState(), nav: DX.navInfo(), footer: DX.footerInfo(),
      tech: detectTech(), entrance: entrance(), cssVars: cssVars(), fonts: fontsInfo(),
      inlineCss, stylesheets: [...document.styleSheets].map((s) => s.href).filter(Boolean),
    };
  };

  // ------------------------------------------------------------------ helpers used by extract.mjs
  DX.links = () => [...document.querySelectorAll('a[href]')]
    .map((a) => ({ href: a.href, text: cut(a.innerText || a.getAttribute('aria-label') || '', 60), region: region(a) }))
    .filter((l) => /^https?:/i.test(l.href)).slice(0, 2000);

  DX.box = (id) => { const el = byDx(id); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; };

  DX.center = (id) => {
    const el = byDx(id);
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, left: r.left, top: r.top, w: r.width, h: r.height, reachable: !!hit && (el === hit || el.contains(hit) || hit.contains(el)) };
  };

  const SNAP_PROPS = ['color', 'backgroundColor', 'backgroundImage', 'borderTopColor', 'borderBottomColor', 'borderTopWidth', 'boxShadow', 'transform', 'opacity', 'textDecorationLine', 'filter', 'outlineColor', 'outlineStyle', 'letterSpacing', 'scale', 'translate', 'paddingTop', 'paddingLeft', 'width', 'height'];
  DX.snap = (id) => {
    const el = byDx(id);
    if (!el) return null;
    const pick = (e) => { if (!e) return null; const cs = getComputedStyle(e); const o = {}; for (const p of SNAP_PROPS) o[p] = cs[p]; return o; };
    const th = textHolder(el);
    return { self: pick(el), text: th && th !== el ? pick(th) : null, img: pick(el.querySelector('img')), icon: pick(el.querySelector('svg, i')), transition: getComputedStyle(el).transition };
  };

  DX.findOverlays = () => {
    const vw = innerWidth, vh = innerHeight, out = [];
    for (const el of document.body.querySelectorAll('*')) {
      if (SKIP.has(el.tagName)) continue;
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && !(el.tagName === 'DIALOG' && el.open)) continue;
      if (!shown(el, cs)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 30) continue;
      const cover = Math.max(0, Math.min(r.right, vw) - Math.max(r.left, 0)) * Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / (vw * vh);
      const sig = `${el.id} ${typeof el.className === 'string' ? el.className : ''} ${el.getAttribute('role') || ''}`;
      const txt = cut(el.innerText, 300);
      const keyword = OVERLAY_RE.test(sig) || el.getAttribute('aria-modal') === 'true' || el.getAttribute('role') === 'dialog' || el.tagName === 'DIALOG';
      const cookie = COOKIE_TEXT_RE.test(txt) && txt.length < 900 && r.height < vh * 0.7;
      const headerLike = r.top <= 2 && r.height <= 220 && r.width >= vw * 0.9 && !!(el.matches(HEADER_SEL) || el.closest(HEADER_SEL) || el.querySelector('nav, a[href]'));
      if (headerLike && !cookie && !(keyword && cover >= 0.5)) continue;
      if ((keyword && cover >= 0.12) || cookie || (cover >= 0.6 && +cs.zIndex >= 100)) {
        out.push({ dx: tag(el), kind: cookie ? 'cookie' : 'modal', cover: r2(cover), z: cs.zIndex, rect: { x: r1(r.left), y: r1(r.top), w: r1(r.width), h: r1(r.height) }, text: txt, el: describe(el) });
      }
    }
    return out.filter((o) => !out.some((p) => p !== o && byDx(p.dx)?.contains(byDx(o.dx))));
  };
  DX.hideOverlays = (ids) => {
    for (const id of ids) { const el = byDx(id); if (el) el.style.setProperty('display', 'none', 'important'); }
    for (const e of [document.documentElement, document.body]) {
      const cs = getComputedStyle(e);
      if (cs.overflowY === 'hidden') e.style.setProperty('overflow-y', 'visible', 'important');
    }
    if (getComputedStyle(document.body).position === 'fixed') document.body.style.setProperty('position', 'static', 'important');
  };

  // Mobile-menu helpers: which toggle to press, and which layer appeared after pressing it.
  DX.findMenuToggle = () => {
    const root = findHeader() || document.body;
    let best = null, bestScore = 0;
    const cands = root.querySelectorAll('button, a, [role="button"], [aria-expanded], [aria-controls], [class*="toggle"], [class*="burger"], [class*="hamburger"]');
    for (const el of cands) {
      const cs = getComputedStyle(el);
      if (!shown(el, cs)) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 14 || r.height < 14 || r.width > 160 || r.height > 120 || r.top > 300) continue;
      const sig = `${el.id} ${typeof el.className === 'string' ? el.className : ''} ${el.getAttribute('aria-label') || ''} ${el.getAttribute('title') || ''}`;
      // Builders put the meaning on the wrapper (Elementor: div.mobile-menu > … > a.elementor-icon).
      let wrap = '';
      for (let a = el.parentElement, d = 0; a && a !== root && d < 3; a = a.parentElement, d++) wrap += ` ${a.id} ${typeof a.className === 'string' ? a.className : ''}`;
      let score = 0;
      if (MENU_RE.test(sig)) score += 4;
      else if (MENU_RE.test(wrap)) score += 3;
      if (/search|חיפוש/i.test(sig + wrap)) score -= 8;
      if (el.hasAttribute('aria-expanded')) score += 2;
      if (el.querySelector('svg, i') || el.querySelectorAll('span').length >= 3) score += 1;
      if (Math.abs(r.width - r.height) < 16 && r.width <= 70) score += 1;
      if (el.tagName === 'A' && el.getAttribute('href') && !/^#|javascript/.test(el.getAttribute('href'))) score -= 5;
      if (clean(el.innerText).length > 14) score -= 3;
      if (score > bestScore) { best = el; bestScore = score; }
    }
    return best && bestScore >= 3 ? { dx: tag(best), el: describe(best), score: bestScore } : null;
  };
  DX.visibleLayers = () => {
    const out = [];
    for (const el of document.body.querySelectorAll('nav, ul, div, aside, section')) {
      const r = el.getBoundingClientRect();
      if (r.width < 150 || r.height < 120 || r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth) continue;
      if (!shown(el)) continue;
      if (el.querySelectorAll('a').length < 3) continue;
      out.push(tag(el));
    }
    return out;
  };
  DX.describeLayer = (id) => {
    const el = byDx(id);
    if (!el) return null;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const link = [...el.querySelectorAll('a')].find((a) => shown(a) && clean(a.innerText));
    return { el: describe(el), position: cs.position, rect: { x: r1(r.left), y: r1(r.top), w: r1(r.width), h: r1(r.height) }, bg: effectiveBg(el).color, linkStyle: link ? styleOfText(link) : null, items: [...el.querySelectorAll('a')].filter((a) => shown(a)).slice(0, 20).map((a) => cut(a.innerText, 30)).filter(Boolean) };
  };

  // ------------------------------------------------------------------ CSS source analysis
  // Parses raw stylesheet text with the browser's own CSS parser (constructable sheets),
  // so vendor hacks, nesting and @layer are handled exactly like the real page.
  const COLOR_LIT_RE = /#[0-9a-f]{3,8}\b|(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb)\([^()]*\)|\b(?:white|black|red|green|blue|yellow|orange|purple|pink|gray|grey|silver|navy|teal|maroon|olive|lime|aqua|fuchsia|gold|beige|ivory|crimson|coral|salmon|tomato|khaki|indigo|violet|turquoise|tan|brown|cyan|magenta)\b/gi;
  const COLOR_PROP_RE = /^(color|background|background-color|background-image|border|border-(top|right|bottom|left)(-color)?|border-color|outline|outline-color|fill|stroke|box-shadow|text-shadow|text-decoration-color|caret-color|accent-color|column-rule-color)$/;
  DX.parseCss = function (sheets) {
    const out = { files: [], vars: [], media: {}, fontFaces: [], keyframes: [], colorLits: {}, colorVars: {}, hover: [], focus: [], rules: 0, importants: 0, errors: [] };
    const unq = (s) => String(s || '').trim().replace(/^["']|["']$/g, '');
    const walk = (rules, media, file) => {
      for (const r of rules) {
        if (r instanceof CSSStyleRule) {
          out.rules++;
          const st = r.style;
          for (let i = 0; i < st.length; i++) {
            const p = st[i];
            const v = st.getPropertyValue(p);
            if (st.getPropertyPriority(p)) out.importants++;
            if (p.startsWith('--')) {
              if (out.vars.length < 4000) out.vars.push({ name: p, value: v.trim().slice(0, 300), selector: r.selectorText.slice(0, 120), media, file });
              const c = /^\s*(#[0-9a-f]{3,8}|rgba?\([^()]*\)|hsla?\([^()]*\)|oklch\([^()]*\))\s*$/i.test(v) ? normColor(v.trim()) : null;
              if (c) out.colorVars[p] = c;
            } else if (COLOR_PROP_RE.test(p)) {
              for (const m of v.matchAll(COLOR_LIT_RE)) { const c = normColor(m[0]); if (c) out.colorLits[c] = (out.colorLits[c] || 0) + 1; }
            }
          }
          if (/:hover/.test(r.selectorText) && out.hover.length < 600) out.hover.push({ selector: r.selectorText.slice(0, 200), css: st.cssText.slice(0, 400), media, file });
          if (/:focus/.test(r.selectorText) && out.focus.length < 200) out.focus.push({ selector: r.selectorText.slice(0, 200), css: st.cssText.slice(0, 300), media, file });
          if (r.cssRules && r.cssRules.length) walk(r.cssRules, media, file);
        } else if (r instanceof CSSMediaRule) {
          const cond = r.conditionText || r.media.mediaText;
          out.media[cond] = (out.media[cond] || 0) + r.cssRules.length;
          walk(r.cssRules, cond, file);
        } else if (r instanceof CSSFontFaceRule) {
          const s = r.style;
          out.fontFaces.push({ family: unq(s.getPropertyValue('font-family')), weight: s.getPropertyValue('font-weight') || '400', style: s.getPropertyValue('font-style') || 'normal', display: s.getPropertyValue('font-display') || null, src: s.getPropertyValue('src').slice(0, 700), unicodeRange: s.getPropertyValue('unicode-range').slice(0, 120) || null, file });
        } else if (r instanceof CSSKeyframesRule) {
          out.keyframes.push({ name: r.name, file, frames: [...r.cssRules].map((k) => `${k.keyText} { ${k.style.cssText} }`).join(' ').slice(0, 700) });
        } else if (r.cssRules) {
          walk(r.cssRules, media, file);
        }
      }
    };
    for (const { name, text } of sheets) {
      const sheet = new CSSStyleSheet();
      try {
        sheet.replaceSync(String(text).replace(/@import[^;]+;/g, ''));
        const before = out.rules;
        walk(sheet.cssRules, '', name);
        out.files.push({ name, bytes: text.length, rules: out.rules - before });
      } catch (e) {
        out.errors.push(`${name}: ${e.message}`);
      }
    }
    return out;
  };
})();
