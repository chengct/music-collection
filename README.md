# My Music

管理 CD 收藏的 Web 應用程式。純前端架構：Vue 3 + Vite + sql.js (SQLite WASM)，部署於 GitHub Pages。

## 開發

```bash
npm install
npm run dev
```

## 建置

```bash
npm run build
```

push 到 `main` 後，GitHub Actions 會自動建置並部署到 GitHub Pages。
第一次使用需在 repo 的 Settings > Pages 將 Source 設為 GitHub Actions。

## 資料

- 資料庫：`public/music.db`
- 設定檔：`src/config.js`（Discogs 網址、每頁筆數）

GitHub Pages 為靜態主機，網頁上的新增、編輯、刪除只會存在瀏覽器（IndexedDB）。
要讓修改生效給所有人，請由管理者在側邊欄「匯出資料庫」，以下載的 `music.db` 覆蓋 `public/music.db` 後提交。

## 注意

`music.db` 會公開於網站上，`user_info` 的帳號密碼任何人皆可下載取得，僅適合不需保密的使用情境。
