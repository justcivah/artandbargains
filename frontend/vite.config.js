import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/sitemap.xml': 'https://backend-a2jy.onrender.com',
      '/robots.txt': 'https://backend-a2jy.onrender.com'
    }
  }
})