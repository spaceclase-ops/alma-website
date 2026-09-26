import React from 'react';
import { prerenderToNodeStream } from 'react-dom/static';
import { StaticRouter } from 'react-router-dom';
import App from './App';

// Build-time entry used by prerender.mjs: renders one URL of the app to HTML.
// The tree must match index.tsx (StrictMode > Router > App) so hydration lines up.
export async function render(url: string): Promise<string> {
  const { prelude } = await prerenderToNodeStream(
    <React.StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </React.StrictMode>
  );
  const chunks: Buffer[] = [];
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

export { getPageMeta, getPrerenderRoutes, renderHeadTags, NOT_FOUND_PATH } from './data/seo';
export { SITE_URL } from './data/site';
export { legacyInsightSlugs } from './data/insightsData';
