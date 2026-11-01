import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Em desenvolvimento, /api vai para o servidor (npm run server)
  server: { proxy: { '/api': 'http://127.0.0.1:8787' }, watch: { ignored: ['**/data/**', '**/server/**'] } },
})
