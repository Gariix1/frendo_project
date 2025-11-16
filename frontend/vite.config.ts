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
    fs: {
      allow: [projectRootDir, sharedDir],
    },
  },
  resolve: {
    alias: {
      '@shared': sharedDir,
    },
  }
})
