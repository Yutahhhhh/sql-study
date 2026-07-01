import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    react(),
    // sql.js の sql-wasm.wasm は public/ に直接配置しているため、
    // dev/build どちらでも import.meta.env.BASE_URL 起点でそのまま配信される。
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        id: '.',
        name: 'SQL Learning Platform',
        short_name: 'SQL Learn',
        description: 'ブラウザ上で本物のPostgreSQL/MySQLを動かして学ぶSQL学習プラットフォーム',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
        lang: 'ja',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // pglite(WASM+data, 約13MB)とsql.js(WASM, 約1.3MB)はアプリシェルの
        // 初回インストール時にはプリキャッシュせず、実際にそのエンジンを
        // 使った時点でランタイムキャッシュに保存する(CacheFirst)。
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        globIgnores: ['**/*.wasm', '**/*.data'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.wasm') || url.pathname.endsWith('.data'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'sql-engine-wasm',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
  build: {
    target: 'esnext',
  },
})
