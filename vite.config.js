import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 相對路徑，讓 GitHub Pages 子路徑 (/music-collection/) 也能正常載入
export default defineConfig({
  base: './',
  plugins: [vue()],
})
