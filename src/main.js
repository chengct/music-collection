import { createApp } from 'vue'
import '@fontsource-variable/outfit'
import './style.css'
import './theme'
import { openDb } from './db'
import App from './App.vue'
import router from './router'

openDb()
  .then(() => createApp(App).use(router).mount('#app'))
  .catch((err) => {
    document.getElementById('app').innerHTML =
      `<p class="fatal">資料庫載入失敗：${err.message}</p>`
  })
