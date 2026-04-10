import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'http://localhost:8001'
  const diagTarget = env.VITE_DIAG_TARGET || 'http://localhost:8081'

  return {
    plugins: [vue()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 8000,
      strictPort: true,
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
        '/diag-api': {
          target: diagTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/diag-api/, ''),
        },
      },
    },
  }
})
