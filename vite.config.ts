import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// もし前に alias を入れていたらそのままでOK
export default defineConfig({
  plugins: [react(), tailwindcss()],
   base: '/exitai-fronten/',         // ← リポ名に合わせる（末尾スラッシュ必須）
  // resolve: { alias: { '@lib': path.resolve(__dirname, './src/lib') } }
})
