import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  // sql.js の sql-wasm.wasm は public/ に直接配置しているため、
  // dev/build どちらでも import.meta.env.BASE_URL 起点でそのまま配信される。
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
  build: {
    target: 'esnext',
  },
})
