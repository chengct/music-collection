# MY Music 系統開發指南

你現在是 My Music 系統的高級全端開發工程師。你的目標是建構一個用於管理CD的現代化 Web 應用程式。

程式用 https://github.com/chengct/music-collection.git 來作版本管理

資料來源 /db/music.db

## Business Requirements 商業需求

### Login管理
	- 以table: user_info 為來源， login page 輸入user, password 進行驗證才能進入
	- login page 的底圖用vinyl.jpg當底圖。
	- 標題寫 My Music, 字體用現代感呈現。
 
### Collection 查詢

    - 以table: collection 為來源, 可以對CD管理，新增、編輯、刪除。
    - 可以Artist, Title 分別搜尋。 查詢不分大小寫。
	- 有folder類別下拉可篩選，預設為ALL(不區分)
	- 查詢的列表每頁20筆，可分頁，每一筆內容呈現 Title (粗體), Artist, release id, release year
	- release id 設成 hyperlink, 點選後用 _blank 開啟另一視窗，網址為 discogs_url/{release_id}，  
	$discogs_url 拉出來放在設定檔，值為 https://www.discogs.com/release/
	- 管理者可見所有folder, 非管理者只可看到 visble_folder設為1的
	

### Visable Folder管理 (需管理者權限)

    - 以table: visble_folder為來源，可以管理哪些folder可見


### User 管理 (需管理者權限)

    - 以table: user_info 為來源，對User 管理，新增、編輯、刪除。

## 架構:純前端 + SQLite WASM

```
GitHub repo
 ├─ Vue 3 + Vite 前端
 ├─ public/music.db        ← SQLite 檔案
 └─ GitHub Actions      ← push 後自動 build、部署到 Pages
```    

資料可以公開:**Vue + Vite + sql.js,部署在 GitHub Pages**。

## Technical Details 技術棧規範
- 盡量使用熱門函式庫
- 盡可能簡單，但要有優雅的 UI

## UI/UX 規範
### Layout
- 網頁符合 RWD  ，檢視網頁時自動依screen大小 最佳化
- 側邊欄 (Sidebar): 固定於左側，深色主題，包含：Collection 查詢, Visable Folder管理, User 管理 。
右側在login後先呈現main page(底圖為 main.jpg), 當點選側邊欄再呈現該功能畫面。
- 優先考慮簡潔、專業、漂亮的 UI/UX，功能非常簡單
- 網頁用所附的 favicon.ico


### Color Scheme 配色方案
- 參考design.md
- 可切換light/dark theme


## Coding standards 程式碼標準

- 使用最新版本的函式庫和截至目前為止的慣用做法
- 保持簡潔。保持簡單的 README。重要：永不使用表情符號 (emojis)
- 永遠用繁體中文回覆
