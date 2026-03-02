import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const target = env.VITE_API_BASE_URL || 'http://localhost:5000'
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true
        },
        '/login': {
          target,
          changeOrigin: true
        },
        '/logout': {
          target,
          changeOrigin: true
        },
        '/auth': {
          target,
          changeOrigin: true
        },
        '/chamados': {
          target,
          changeOrigin: true
        },
        '/chamado': {
          target,
          changeOrigin: true
        },
        '/dashboard': {
          target,
          changeOrigin: true
        },
        '/novo': {
          target,
          changeOrigin: true
        }
      }
    }
  }
})
