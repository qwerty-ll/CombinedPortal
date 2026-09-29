import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import serviceWorker from './pwa/vite-plugin-sw.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serviceWorker()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
