import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // react-snap uses Chromium 77, which doesn't support optional chaining.
    // Targeting chrome76 forces esbuild to transpile ?. and ?? to compatible syntax.
    target: 'chrome76',
  },
})
