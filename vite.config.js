import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all local IPs
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5001',
        changeOrigin: true,
        secure: false,
      }
    },
    hmr: {
      overlay: false, // Optional: disable server error overlay if it's annoying
    }
  },
  build: {
    sourcemap: false, // Prevent viewing source code in browser
  }
})
