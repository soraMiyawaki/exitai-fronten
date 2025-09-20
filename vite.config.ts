import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// もし前に alias を入れていたらそのままでOK
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // resolve: { alias: { '@lib': path.resolve(__dirname, './src/lib') } }
})
