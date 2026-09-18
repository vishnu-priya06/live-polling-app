import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'http://localhost:8081',
        changeOrigin: true,
      },
      '/ws': {
        target: process.env.VITE_DEV_WS_TARGET || 'ws://localhost:8081',
        changeOrigin: true,
        ws: true,
      },
    },
  },
})
