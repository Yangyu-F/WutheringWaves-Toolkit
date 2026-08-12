import { fileURLToPath, URL } from 'node:url'
import { copyFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'github-pages-spa-fallback',
      apply: 'build',
      closeBundle() {
        copyFileSync('dist/index.html', 'dist/404.html')
      },
    },
  ],
  base: process.env.GITHUB_ACTIONS ? '/WutheringWaves-Toolkit/' : '/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
})
