// frontend/vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
  base: '/', // or '/subdir/' if deploying under a sub-path
  build: {
    outDir: 'dist'
  }
})
