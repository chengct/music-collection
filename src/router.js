import { createRouter, createWebHashHistory } from 'vue-router'
import { auth } from './auth'
import LoginView from './views/LoginView.vue'
import MainLayout from './views/MainLayout.vue'
import HomeView from './views/HomeView.vue'
import CollectionView from './views/CollectionView.vue'
import FoldersView from './views/FoldersView.vue'
import UsersView from './views/UsersView.vue'

// GitHub Pages 不支援 SPA fallback，使用 hash 模式
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/',
      component: MainLayout,
      children: [
        { path: '', name: 'home', component: HomeView },
        { path: 'collection', name: 'collection', component: CollectionView },
        { path: 'folders', name: 'folders', component: FoldersView, meta: { admin: true } },
        { path: 'users', name: 'users', component: UsersView, meta: { admin: true } },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach((to) => {
  if (to.name === 'login') return auth.user ? { name: 'home' } : true
  if (!auth.user) return { name: 'login' }
  if (to.meta.admin && !auth.user.admin) return { name: 'home' }
  return true
})

export default router
