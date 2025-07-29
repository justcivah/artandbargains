import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const API_URL = env.VITE_API_URL;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/sitemap.xml': API_URL,
        '/robots.txt': API_URL
      }
    }
  }
});
