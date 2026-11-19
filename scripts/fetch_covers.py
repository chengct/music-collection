"""
依 collection 的 release_id 從 Discogs 下載封面，縮成 150px 存到
public/covers/{release_id}.webp，並產生 public/covers/index.json 給前端使用。

需要 Discogs 個人 token（https://www.discogs.com/settings/developers）：
  PowerShell: $env:DISCOGS_TOKEN = "xxxx"
  bash:       export DISCOGS_TOKEN=xxxx

用法：
  python scripts/fetch_covers.py                  下載還沒有的封面
  python scripts/fetch_covers.py --limit 20       只處理 20 筆（測試用）
  python scripts/fetch_covers.py --retry-missing  重試之前在 Discogs 找不到封面的
  python scripts/fetch_covers.py --index-only     只重建 index.json

已下載的會跳過，可隨時中斷 (Ctrl+C) 後再執行。
需要 Pillow：pip install pillow
"""

import argparse
import io
import json
import os
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "public" / "music.db"
OUT_DIR = ROOT / "public" / "covers"
INDEX_PATH = OUT_DIR / "index.json"
MISSING_PATH = ROOT / "scripts" / "covers-missing.txt"

API_URL = "https://api.discogs.com/releases/{}"
USER_AGENT = "MyMusicCollectionCoverFetcher/1.0"
SIZE = 150
MIN_INTERVAL = 1.1  # Discogs 已驗證請求上限每分鐘 60 次


def release_ids():
    with sqlite3.connect(DB_PATH) as con:
        rows = con.execute(
            "SELECT DISTINCT release_id FROM collection "
            "WHERE release_id <> '' AND release_id NOT GLOB '*[^0-9]*'"
        ).fetchall()
    return sorted({r[0] for r in rows}, key=int)


def load_missing():
    if not MISSING_PATH.exists():
        return set()
    return {line.strip() for line in MISSING_PATH.read_text().splitlines() if line.strip()}


def save_missing(ids):
    MISSING_PATH.write_text("".join(f"{i}\n" for i in sorted(ids, key=int)))


def write_index():
    ids = sorted((p.stem for p in OUT_DIR.glob("*.webp")), key=int)
    INDEX_PATH.write_text(json.dumps(ids, separators=(",", ":")))
    return len(ids)


def http_get(url, headers):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, **headers})
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read(), res.headers


class Fetcher:
    def __init__(self, token):
        self.auth = {"Authorization": f"Discogs token={token}"}
        self.last = 0.0

    def release(self, rid):
        """回傳 release JSON；Discogs 沒有此 release 時回傳 None。"""
        for attempt in range(5):
            wait = self.last + MIN_INTERVAL - time.monotonic()
            if wait > 0:
                time.sleep(wait)
            self.last = time.monotonic()
            try:
                body, headers = http_get(API_URL.format(rid), self.auth)
            except urllib.error.HTTPError as e:
                if e.code == 404:
                    return None
                if e.code == 429:
                    print("  超過請求上限，等待 60 秒...")
                    time.sleep(60)
                    continue
                if e.code == 401:
                    sys.exit("DISCOGS_TOKEN 無效 (HTTP 401)")
                raise
            if int(headers.get("X-Discogs-Ratelimit-Remaining", "60")) <= 2:
                time.sleep(10)
            return json.loads(body)
        raise RuntimeError("重試次數過多")


def pick_image(release):
    images = release.get("images") or []
    primary = next((i for i in images if i.get("type") == "primary"), None)
    img = primary or (images[0] if images else None)
    return img and (img.get("uri") or img.get("uri150"))


def save_thumbnail(data, dest):
    with Image.open(io.BytesIO(data)) as im:
        im = im.convert("RGB")
        im.thumbnail((SIZE, SIZE), Image.LANCZOS)
        tmp = dest.with_suffix(".tmp")
        im.save(tmp, "WEBP", quality=80, method=6)
    os.replace(tmp, dest)


def main():
    ap = argparse.ArgumentParser(description="下載 Discogs 封面縮圖")
    ap.add_argument("--limit", type=int, help="最多處理幾筆")
    ap.add_argument("--retry-missing", action="store_true", help="重試之前找不到封面的 release")
    ap.add_argument("--index-only", action="store_true", help="只重建 index.json")
    args = ap.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    if args.index_only:
        print(f"index.json：{write_index()} 張")
        return

    token = os.environ.get("DISCOGS_TOKEN")
    if not token:
        sys.exit("請先設定環境變數 DISCOGS_TOKEN")

    missing = set() if args.retry_missing else load_missing()
    todo = [r for r in release_ids() if r not in missing and not (OUT_DIR / f"{r}.webp").exists()]
    if args.limit:
        todo = todo[: args.limit]
    print(f"待處理 {len(todo)} 筆，預計約 {len(todo) * MIN_INTERVAL / 60:.0f} 分鐘")

    fetcher = Fetcher(token)
    ok = failed = 0
    try:
        for n, rid in enumerate(todo, 1):
            prefix = f"[{n}/{len(todo)}] {rid}"
            try:
                release = fetcher.release(rid)
                url = release and pick_image(release)
                if not url:
                    missing.add(rid)
                    print(f"{prefix} 沒有封面")
                    continue
                data, _ = http_get(url, {})
                save_thumbnail(data, OUT_DIR / f"{rid}.webp")
                missing.discard(rid)
                ok += 1
                print(f"{prefix} OK")
            except Exception as e:  # 單筆失敗不中斷，下次執行會再試
                failed += 1
                print(f"{prefix} 失敗：{e}")
    except KeyboardInterrupt:
        print("\n已中斷")
    finally:
        save_missing(missing)
        total = write_index()
        print(f"完成：新增 {ok}，失敗 {failed}，無封面 {len(missing)}，目前共 {total} 張")


if __name__ == "__main__":
    main()
