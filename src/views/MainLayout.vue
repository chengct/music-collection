<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  Disc3, FolderCog, Users, LogOut, Sun, Moon, Menu, Download, RotateCcw,
} from 'lucide-vue-next'
import { auth, logout } from '../auth'
import { theme, toggleTheme } from '../theme'
import { dbState, exportDb, resetDb } from '../db'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import logo from '../assets/music.png'

const route = useRoute()
const router = useRouter()
const open = ref(false)
const confirmReset = ref(false)

const nav = [
  { to: { name: 'collection' }, label: 'Collection 查詢', icon: Disc3 },
  { to: { name: 'folders' }, label: 'Visable Folder 管理', icon: FolderCog, admin: true },
  { to: { name: 'users' }, label: 'User 管理', icon: Users, admin: true },
]

watch(() => route.fullPath, () => (open.value = false))

function signOut() {
  logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <div class="layout">
    <header class="topbar">
      <button class="icon-btn" aria-label="選單" @click="open = true"><Menu :size="22" /></button>
      <RouterLink :to="{ name: 'home' }" class="brand"><img :src="logo" alt="" />My Music</RouterLink>
    </header>

    <div v-if="open" class="scrim" @click="open = false" />

    <aside class="sidebar" :class="{ open }">
      <RouterLink :to="{ name: 'home' }" class="brand"><img :src="logo" alt="" />My Music</RouterLink>

      <nav>
        <template v-for="item in nav" :key="item.label">
          <RouterLink v-if="!item.admin || auth.user?.admin" :to="item.to" class="nav-link">
            <component :is="item.icon" :size="20" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </template>
      </nav>

      <div class="side-bottom">
        <div v-if="auth.user?.admin" class="db-tools">
          <p v-if="dbState.modified" class="db-note">資料已在本機修改，請匯出 music.db 並提交至 repo。</p>
          <button class="side-action" @click="exportDb"><Download :size="18" />匯出資料庫</button>
          <button v-if="dbState.modified" class="side-action" @click="confirmReset = true">
            <RotateCcw :size="18" />還原伺服器版本
          </button>
        </div>
        <button class="side-action" @click="toggleTheme">
          <component :is="theme === 'dark' ? Sun : Moon" :size="18" />
          {{ theme === 'dark' ? 'Light theme' : 'Dark theme' }}
        </button>
        <div class="user">
          <div class="avatar">{{ auth.user?.name?.[0]?.toUpperCase() }}</div>
          <div class="who">
            <strong>{{ auth.user?.name }}</strong>
            <span>{{ auth.user?.admin ? '管理者' : '使用者' }}</span>
          </div>
          <button class="icon-btn" aria-label="登出" title="登出" @click="signOut"><LogOut :size="18" /></button>
        </div>
      </div>
    </aside>

    <main class="content">
      <RouterView />
    </main>

    <ConfirmDialog
      v-if="confirmReset"
      title="還原伺服器版本"
      message="將捨棄所有尚未匯出的本機修改，並重新載入伺服器上的 music.db。確定要繼續嗎？"
      confirm-text="還原"
      @close="confirmReset = false"
      @confirm="resetDb"
    />
  </div>
</template>

<style scoped>
.layout {
  --side-w: 260px;
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 50;
  width: var(--side-w);
  display: flex;
  flex-direction: column;
  padding: 24px 12px 16px;
  background: var(--side-bg);
  color: var(--side-text);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.8px;
  color: #fff;
  text-decoration: none;
}

.brand img {
  width: 32px;
  height: 32px;
}

nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 32px;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 400;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.nav-link:hover {
  color: var(--side-active);
  background: var(--side-hover);
}

.nav-link.router-link-active {
  color: var(--side-active);
  font-weight: 700;
  background: var(--side-hover);
}

.nav-link.router-link-active svg {
  color: #1ed760;
}

.side-bottom {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.db-tools {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-bottom: 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid #282828;
}

.db-note {
  margin: 0 12px 6px;
  font-size: 12px;
  line-height: 1.5;
  color: #ffa42b;
}

.side-action {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: none;
  color: var(--side-text);
  font-size: 13px;
  cursor: pointer;
  text-align: left;
}

.side-action:hover {
  color: #fff;
  background: var(--side-hover);
}

.user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  padding: 10px 4px 0 12px;
  border-top: 1px solid #282828;
}

.avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #1ed760;
  color: #000;
  font-weight: 700;
}

.who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  font-size: 12px;
}

.who strong {
  color: #fff;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user .icon-btn {
  color: var(--side-text);
}

.user .icon-btn:hover {
  background: var(--side-hover);
  color: #fff;
}

.content {
  margin-left: var(--side-w);
  min-height: 100vh;
}

.topbar,
.scrim {
  display: none;
}

@media (max-width: 896px) {
  .topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 8px;
    height: 56px;
    padding: 0 8px;
    background: var(--side-bg);
  }

  .topbar .icon-btn {
    color: #fff;
  }

  .topbar .icon-btn:hover {
    background: var(--side-hover);
  }

  .topbar .brand {
    padding: 0;
    font-size: 20px;
  }

  .topbar .brand img {
    width: 26px;
    height: 26px;
  }

  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    box-shadow: rgba(0, 0, 0, 0.5) 0 8px 24px;
  }

  .sidebar.open {
    transform: none;
  }

  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 45;
    background: rgba(0, 0, 0, 0.55);
  }

  .content {
    margin-left: 0;
    min-height: calc(100vh - 56px);
  }
}
</style>
