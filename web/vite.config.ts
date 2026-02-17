import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

function normalizeBasePath(rawPath: string | undefined): string {
  if (!rawPath || rawPath.trim() === '') return '/';

  const withLeadingSlash = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const rawBasePath = process.env.VITE_BASE_PATH ?? (repoName ? `/${repoName}/` : '/');
const basePath = normalizeBasePath(rawBasePath);

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon-16.png', 'icons/favicon-32.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'SmokeLess',
        short_name: 'SmokeLess',
        description: 'Cigarette counter & insights',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        scope: basePath,
        start_url: basePath,
        icons: [
          { src: `${basePath}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${basePath}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
          {
            src: `${basePath}icons/maskable-512.png`,
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
});
