<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock } from 'lucide-vue-next'
import { login } from '../auth'
import vinyl from '../assets/vinyl.jpg'
import logo from '../assets/music.png'

const router = useRouter()
const name = ref('')
const password = ref('')
const error = ref('')

function submit() {
  error.value = ''
  if (login(name.value.trim(), password.value)) {
    router.replace({ name: 'home' })
  } else {
    error.value = '帳號或密碼錯誤'
  }
}
</script>

<template>
  <div class="login" :style="{ backgroundImage: `url(${vinyl})` }">
    <form class="panel" @submit.prevent="submit">
      <div class="brand">
        <img :src="logo" alt="" />
        <h1>My Music</h1>
      </div>
      <p class="tagline">Every Track Tells a Story. <br>Every Beat Holds a Memory.</p>

      <label class="input-icon">
        <User :size="18" />
        <input v-model="name" class="input" placeholder="User" autocomplete="username" required />
      </label>
      <label class="input-icon">
        <Lock :size="18" />
        <input
          v-model="password"
          class="input"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          required
        />
      </label>

      <p v-if="error" class="error-text">{{ error }}</p>
      <button class="btn btn-primary submit" type="submit">Log in</button>
    </form>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 16px;
  background-size: cover;
  background-position: center;
  position: relative;
}

.login::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(160deg, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0.8));
}

.panel {
  position: relative;
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 40px 32px 32px;
  border-radius: 16px;
  background: rgba(18, 18, 18, 0.72);
  backdrop-filter: blur(16px);
  box-shadow: rgba(0, 0, 0, 0.5) 0 8px 24px;
  color: #fff;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.brand img {
  width: 44px;
  height: 44px;
}

h1 {
  margin: 0;
  font-size: 44px;
  font-weight: 800;
  letter-spacing: -1.5px;
  background: linear-gradient(90deg, #ffffff, #1ed760);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.tagline {
  margin: 0 0 12px;
  text-align: center;
  font-size: 14px;
  color: #b3b3b3;
}

.input-icon {
  position: relative;
  display: block;
  color: #b3b3b3;
}

.input-icon svg {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.input-icon .input {
  padding: 12px 16px 12px 44px;
  background: #1f1f1f;
  color: #fff;
  box-shadow: inset 0 0 0 1px #7c7c7c;
}

.input-icon .input:focus {
  box-shadow: inset 0 0 0 2px #fff;
}

.error-text {
  color: #f3727f;
}

.submit {
  margin-top: 8px;
  padding: 14px;
}
</style>
