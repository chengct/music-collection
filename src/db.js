import { reactive } from 'vue'
import initSqlJs from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import { get, set, del } from 'idb-keyval'

// GitHub Pages 是靜態主機，無法寫回伺服器上的 music.db。
// 所有修改會存到瀏覽器的 IndexedDB，可再匯出成檔案提交回 repo。
const STORE_KEY = 'my-music.db'

let db = null
let opening = null

export const dbState = reactive({
  modified: false, // 是否使用本機修改過的版本
  version: 0, // 每次寫入後遞增，讓畫面重新查詢
})

// SQLite 內建 lower() 只處理 ASCII，改用 JS 做不分大小寫比對
function registerFunctions() {
  db.create_function('ulower', (s) => (s == null ? null : String(s).toLowerCase()))
}

// db.export() 會關閉並重開連線，自訂函式會消失，要重新註冊
function exportBytes() {
  const bytes = db.export()
  registerFunctions()
  return bytes
}

export function openDb() {
  opening ??= (async () => {
    const SQL = await initSqlJs({ locateFile: () => wasmUrl })
    const saved = await get(STORE_KEY)
    if (saved) {
      db = new SQL.Database(saved)
      dbState.modified = true
    } else {
      const res = await fetch(`${import.meta.env.BASE_URL}music.db`, { cache: 'no-cache' })
      if (!res.ok) throw new Error(`無法載入資料庫 (HTTP ${res.status})`)
      db = new SQL.Database(new Uint8Array(await res.arrayBuffer()))
    }
    registerFunctions()
  })()
  return opening
}

export function query(sql, params = {}) {
  const stmt = db.prepare(sql)
  try {
    stmt.bind(params)
    const rows = []
    while (stmt.step()) rows.push(stmt.getAsObject())
    return rows
  } finally {
    stmt.free()
  }
}

export function queryOne(sql, params = {}) {
  return query(sql, params)[0] ?? null
}

async function persist() {
  await set(STORE_KEY, exportBytes())
  dbState.modified = true
  dbState.version++
}

// 執行寫入並存到 IndexedDB
export async function run(sql, params = {}) {
  db.run(sql, params)
  await persist()
}

// 在同一個交易裡執行多筆寫入，全部成功才存檔
export async function runAll(statements) {
  db.run('BEGIN')
  try {
    for (const [sql, params] of statements) db.run(sql, params)
    db.run('COMMIT')
  } catch (e) {
    db.run('ROLLBACK')
    throw e
  }
  await persist()
}

export function exportDb() {
  const blob = new Blob([exportBytes()], { type: 'application/vnd.sqlite3' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'music.db'
  a.click()
  URL.revokeObjectURL(a.href)
}

// 捨棄本機修改，回到伺服器上的 music.db
export async function resetDb() {
  await del(STORE_KEY)
  location.reload()
}
