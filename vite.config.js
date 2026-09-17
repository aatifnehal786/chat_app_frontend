import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    transformer: 'postcss', // force postcss instead of lightningcss
  },
  build: {
    cssMinify: 'esbuild', // use esbuild, not lightningcss
  }
})