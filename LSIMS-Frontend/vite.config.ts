import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        // docker-compose sets VITE_PROXY_API=http://backend:8000; local dev uses localhost
        target: process.env.VITE_PROXY_API ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/cms-api': {
        target: process.env.VITE_CMS_PROXY ?? 'http://127.0.0.1:1337',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cms-api/, '/api'),
      },
    },
  },
})
