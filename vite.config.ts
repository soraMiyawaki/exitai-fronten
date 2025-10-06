import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// もし前に alias を入れていたらそのままでOK

// vite.config.ts の defineConfig 内
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/exitai-fronten/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})











