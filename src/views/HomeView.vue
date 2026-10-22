<script setup>
import { computed } from 'vue'
import { auth } from '../auth'
import { dbState, queryOne } from '../db'
import main from '../assets/main.jpg'

const total = computed(() => {
  dbState.version
  const where = auth.user?.admin
    ? ''
    : 'WHERE folder IN (SELECT folder FROM visble_folder WHERE visble = 1)'
  return queryOne(`SELECT COUNT(*) AS n FROM collection ${where}`).n
})
</script>

<template>
  <section class="home" :style="{ backgroundImage: `url(${main})` }">
    <div class="hero">
      <p class="eyebrow">Welcome back, {{ auth.user?.name }}</p>
      <h1>My Music</h1>
      <p class="stat"><strong>{{ total.toLocaleString() }}</strong> CDs in your collection</p>
      <RouterLink :to="{ name: 'collection' }" class="btn btn-primary">Browse collection</RouterLink>
    </div>
  </section>
</template>

<style scoped>
.home {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: flex-end;
  padding: 48px;
  background-size: cover;
  background-position: center;
  color: #fff;
}

.home::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.05) 30%, rgba(0, 0, 0, 0.85));
}

.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.eyebrow {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #1ed760;
}

h1 {
  margin: 0;
  font-size: clamp(48px, 9vw, 96px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -3px;
}

.stat {
  margin: 0 0 8px;
  color: #cbcbcb;
}

.stat strong {
  color: #fff;
}

.btn {
  text-decoration: none;
}

@media (max-width: 896px) {
  .home {
    min-height: calc(100vh - 56px);
    padding: 24px 16px;
  }
}
</style>
