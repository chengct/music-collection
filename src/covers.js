import { reactive } from 'vue'

// public/covers/index.json 列出已下載封面的 release_id（由 scripts/fetch_covers.py 產生）
// 先查清單再組網址，沒有封面的就不發出請求
export const coverIds = reactive(new Set())

let loading = null

export function loadCovers() {
  loading ??= fetch(`${import.meta.env.BASE_URL}covers/index.json`, { cache: 'no-cache' })
    .then((res) => (res.ok ? res.json() : []))
    .then((ids) => ids.forEach((id) => coverIds.add(String(id))))
    .catch(() => {
      loading = null
    })
  return loading
}

export function coverUrl(releaseId) {
  return `${import.meta.env.BASE_URL}covers/${releaseId}.webp`
}
