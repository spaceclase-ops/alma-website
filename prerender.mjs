// Turns the single-page app into one static HTML file per URL, so search engines and
// AI crawlers (which often don't run JavaScript) receive the full content.
// Runs after `vite build` (client, dist/) and `vite build --ssr` (dist-ssr/); see package.json.
//
// For every route from data/seo.ts it writes dist/<route>.html with:
//   - the page's <title>, description, canonical, share tags and JSON-LD in <head>
//   - the rendered React markup inside #root (the browser then hydrates it)
// plus dist/404.html, dist/sitemap.xml and dist/robots.txt.
// Any failure stops the build, so a broken page never gets deployed.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');

const { render, getPageMeta, getPrerenderRoutes, renderHeadTags, NOT_FOUND_PATH, SITE_URL, legacyInsightSlugs } =
  await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);

// The old article URLs are redirected by the host (vercel.json / netlify.toml); make sure
// those lists still match data/insightsData.ts.
const vercelConfig = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
const netlifyConfig = await fs.readFile(path.join(root, 'netlify.toml'), 'utf8');
for (const [legacy, slug] of Object.entries(legacyInsightSlugs)) {
  const from = `/insights/${legacy}`;
  const to = `/insights/${slug}`;
  const rule = (vercelConfig.redirects || []).find((r) => r.source === from);
  if (!rule || rule.destination !== to) throw new Error(`vercel.json must redirect ${from} to ${to}`);
  if (!netlifyConfig.includes(`from = "${from}"\n  to = "${to}"`)) throw new Error(`netlify.toml must redirect ${from} to ${to}`);
}

const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
const HEAD_BLOCK = /<!-- seo:start[\s\S]*?<!-- seo:end -->/;
const APP_PLACEHOLDER = '<!--app-html-->';
if (!HEAD_BLOCK.test(template) || !template.includes(APP_PLACEHOLDER)) {
  throw new Error('index.html is missing the <!-- seo:start --> ... <!-- seo:end --> block or <!--app-html-->');
}

const outputFile = (route) =>
  route === '/' ? path.join(distDir, 'index.html') : path.join(distDir, `${route.slice(1)}.html`);

async function buildPage(route, file) {
  const meta = getPageMeta(route);
  const appHtml = await render(route);
  const html = template
    .replace(HEAD_BLOCK, () => renderHeadTags(meta))
    .replace(APP_PLACEHOLDER, () => appHtml);

  const h1Count = (appHtml.match(/<h1[\s>]/g) || []).length;
  if (!appHtml.trim() || h1Count === 0) throw new Error(`${route}: rendered page has no content/<h1>`);
  if (html.includes(APP_PLACEHOLDER)) throw new Error(`${route}: app placeholder left in output`);
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    JSON.parse(json); // throws on invalid structured data
  }

  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, html);
  return { route, file: path.relative(distDir, file), title: meta.title, h1Count, kb: Math.round(html.length / 1024) };
}

const routes = getPrerenderRoutes();
const results = [];
for (const route of routes) {
  const meta = getPageMeta(route);
  if (meta.noindex) throw new Error(`${route}: listed for prerendering but resolves to the 404 page`);
  results.push(await buildPage(route, outputFile(route)));
}
results.push(await buildPage(NOT_FOUND_PATH, path.join(distDir, '404.html')));

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...routes.map((route) => `  <url><loc>${SITE_URL}${route}</loc></url>`),
  '</urlset>',
  '',
].join('\n');
await fs.writeFile(path.join(distDir, 'sitemap.xml'), sitemap);
await fs.writeFile(path.join(distDir, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);

await fs.rm(ssrDir, { recursive: true, force: true });

console.table(results);
console.log(`Prerendered ${results.length} pages for ${SITE_URL} (+ sitemap.xml with ${routes.length} URLs, robots.txt)`);
