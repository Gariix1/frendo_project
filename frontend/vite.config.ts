import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const sharedDir = path.resolve(__dirname, '..', 'shared')
const projectRootDir = __dirname

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    // Allow access when served behind tunnels (e.g., ngrok) without host blocking.
    allowedHosts: true,
    fs: {
      allow: [projectRootDir, sharedDir],
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@shared': sharedDir,
    },
  }
})
