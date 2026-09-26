import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, isSsrBuild }) => {
    const env = loadEnv(mode, '.', '');
    // Canonical site address for SEO tags (data/site.ts). On Vercel this is the
    // project's production domain; elsewhere it falls back to the main domain.
    const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;
    const siteUrl = productionHost ? `https://${productionHost}` : 'https://alma-ads.co.il';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      // The SSR bundle (entry-server.tsx) is only used by prerender.mjs at build time;
      // it doesn't need its own copy of public/.
      build: isSsrBuild ? { copyPublicDir: false } : undefined,
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        __SITE_URL__: JSON.stringify(siteUrl)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
