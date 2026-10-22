import { reactive } from 'vue'
import { queryOne } from './db'

const KEY = 'my-music.user'

function load() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY))
  } catch {
    return null
  }
}

export const auth = reactive({ user: load() })

export function login(name, password) {
  const row = queryOne(
    'SELECT id, login_name, admin FROM user_info WHERE login_name = $name AND password = $password',
    { $name: name, $password: password },
  )
  if (!row) return false
  auth.user = { id: row.id, name: row.login_name, admin: !!row.admin }
  try {
    sessionStorage.setItem(KEY, JSON.stringify(auth.user))
  } catch {}
  return true
}

export function logout() {
  auth.user = null
  try {
    sessionStorage.removeItem(KEY)
  } catch {}
}
