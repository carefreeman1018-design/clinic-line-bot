# 津久診所 LINE Bot 測試版

這是一個可部署到 Zeabur 的 LINE 官方帳號客服機器人雛形。它會讀取 `data/` 裡的所有 `.md` 檔案作為知識庫，回答診所資訊、掛號流程、交通、看診時間與一般衛教；遇到個人病情、診斷、用藥或檢查報告問題時，會建議轉真人或預約門診。

## 你要先準備的資料

1. LINE Developers 的 `Channel secret`
2. LINE Developers 的 `Channel access token`
3. OpenAI API key，可先不填，但填了回答會更自然
4. 可管理 bot 開關的 LINE 使用者 ID，設定到 `LINE_ADMIN_USER_IDS`
5. 診所/官方帳號資訊，放到 `data/clinic-info.md`
6. 醫師門診、休診與臨時異動，放到 `data/doctor-schedule.md`

## 更新醫師門診與休診

若醫師請假、休診、代診或門診時間有臨時異動，請更新：

```text
data/doctor-schedule.md
```

建議格式：

```text
- 2026-06-10（三）下午：陳郁傑醫師休診。來源：LINE VOOM 休診公告。
```

這個檔案會比一般診所介紹更適合放最新異動。若部署在 Zeabur 且資料跟著 GitHub repo 部署，更新檔案後需要重新部署，bot 才會讀到最新內容。

## 同步 LINE VOOM 公告

診所若把休診、停診、公休或連假看診公告貼在 LINE VOOM，可以執行：

```bash
npm run sync:voom
```

這會讀取公開 LINE VOOM 頁面，篩選休診與門診異動相關貼文，產生：

```text
data/line-voom-announcements.md
```

預設來源是津久診所 LINE VOOM：

```text
https://linevoom.line.me/user/_dSPK5oF-CvsqFetilXhgKCCZmDAXN2oLLLhsP7U
```

如果之後要換來源，可設定環境變數：

```bash
LINE_VOOM_URL="https://linevoom.line.me/user/..." npm run sync:voom
```

建議正式部署後用 Zeabur Cron、GitHub Actions 或另一個排程服務每天同步一次。若 LINE VOOM 改版或暫時抓不到，bot 仍會保留 `data/doctor-schedule.md` 的人工公告。

目前 bot 啟動後也會自動排程每天同步一次 LINE VOOM，預設為台北時間 03:00。可用環境變數調整：

```text
LINE_VOOM_SYNC_ENABLED=true
LINE_VOOM_SYNC_TIME=03:00
```

若要暫停內建排程，設定：

```text
LINE_VOOM_SYNC_ENABLED=false
```

同步失敗時只會寫入 log，不會讓 webhook 服務停止；下一天會再自動嘗試。

## Supabase 對話記憶

若要讓 bot 記得同一位 LINE 使用者先前的對話，請在 Supabase SQL Editor 建立資料表：

```sql
-- 使用 repo 內的 supabase/conversation_messages.sql
```

接著在 Zeabur 或 `.env` 設定：

```text
SUPABASE_URL=你的_Supabase_Project_URL
SUPABASE_SERVICE_ROLE_KEY=你的_Supabase_Service_Role_Key
SUPABASE_CONVERSATION_TABLE=line_conversation_messages
MAX_CONVERSATION_MESSAGES_PER_USER=40
```

`SUPABASE_SERVICE_ROLE_KEY` 只能放在伺服器環境變數，不要放到前端或公開文件。設定完成後，bot 會依 LINE `userId` 讀取最近 N 則歷史對話，回覆後也會把本輪使用者訊息與 bot 回覆寫入 Supabase。預設 N 是 40，可用 `MAX_CONVERSATION_MESSAGES_PER_USER` 調整。

## 醫生開關 bot

若要讓醫生或櫃台能直接用 LINE 控制 bot 是否回覆，請先在環境變數設定管理員白名單：

```text
LINE_ADMIN_USER_IDS=Uxxxxxxxx,Uyyyyyyyy
```

多個 LINE userId 用逗號分隔。只有白名單內的帳號可以使用管理指令：

```text
bot 關閉
bot 開啟
bot 狀態
```

也可以使用：

```text
機器人關閉
機器人開啟
機器人狀態
```

當 bot 關閉時，一般病人傳訊息不會收到 bot 自動回覆，也不會觸發 OpenAI 或寫入新的 bot 回覆紀錄，方便真人接手。

正式部署建議使用 Supabase 保存開關狀態，避免服務重啟後回到預設開啟。請在 Supabase SQL Editor 建立設定表：

```sql
-- 使用 repo 內的 supabase/bot_settings.sql
```

若要自訂表名，可設定：

```text
SUPABASE_SETTINGS_TABLE=bot_settings
```

沒有設定 Supabase 時，bot 開關只會存在目前執行中的記憶體，服務重啟後會回到開啟。

## 向量知識庫檢索

資料量變大後，bot 支援用 OpenAI embeddings + Supabase `pgvector` 做向量檢索。規則直答仍會優先處理電話、地址、門診、LINE VOOM、醫師資料與醫療安全問題；只有一般知識庫問題才會進入向量/關鍵字混合檢索。若向量檢索未設定或失敗，會自動退回原本關鍵字檢索。

## 同步官網公開資料

官網服務頁、固定頁面、衛教天地、媒體報導、案例心得、臉書專欄與影音採訪報導可透過公開 WordPress API 同步成機器人知識庫索引：

```bash
npm run sync:official
```

這會重建：

```text
data/official-service-pages.md
data/official-health-education-index.md
data/official-media-cases-index.md
```

索引會保留官網標題、分類、日期、摘要、段落標題、關鍵字與連結，讓 bot 能用關鍵字或向量檢索找到對應官網內容。它不會整篇複製官網文章；回答個人症狀、診斷、用藥、費用、手術適應症或副作用時，仍需引導官方 LINE、電話或門診確認。

若已啟用 Supabase 向量知識庫，每次同步官網資料後再執行：

```bash
npm run sync:embeddings
```

也可以用整合指令同步公開資料：

```bash
npm run sync:knowledge
```

這會依序同步 LINE VOOM 與官網公開資料；若已設定 `OPENAI_API_KEY`、`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`，也會同步 embeddings。若只想更新 Markdown 公開資料、不更新向量庫，可設定：

```bash
SYNC_EMBEDDINGS=false npm run sync:knowledge
```

先到 Supabase SQL Editor 執行：

```sql
-- 內容請使用 repo 內的 supabase/knowledge_chunks.sql
```

目前 `supabase/knowledge_chunks.sql` 使用 `vector(1536)`，對應預設的 `text-embedding-3-small`。若要改用不同維度的 embedding model，需要同步調整 SQL 裡的 vector 維度。

接著設定環境變數：

```text
OPENAI_API_KEY=你的_OpenAI_API_Key
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
SUPABASE_URL=你的_Supabase_Project_URL
SUPABASE_SERVICE_ROLE_KEY=你的_Supabase_Service_Role_Key
SUPABASE_KNOWLEDGE_TABLE=knowledge_chunks
SUPABASE_KNOWLEDGE_MATCH_RPC=match_knowledge_chunks
VECTOR_KNOWLEDGE_ENABLED=true
VECTOR_KNOWLEDGE_MATCH_COUNT=6
VECTOR_KNOWLEDGE_MIN_SIMILARITY=0.25
```

每次新增或修改 `data/*.md` 後，重新同步 embeddings：

```bash
npm run sync:embeddings
```

同步會先建立所有新的 embeddings，接著 upsert 到 `knowledge_chunks`，最後才刪除已不存在的 stale chunks。這避免同步中途失敗時把既有向量庫清空。`SUPABASE_SERVICE_ROLE_KEY` 只能放在伺服器環境變數，不要放到前端或公開文件。

若要一次建立所有 Supabase 後端表，可在 SQL Editor 執行：

```sql
-- 使用 repo 內的 supabase/schema.sql
```

固定門診表由資料檔驅動：

```text
data/fixed-schedule.json
```

若官網門診圖片更新，請同步更新 `data/fixed-schedule.json` 與 `data/website-clinic-hours.md`。

更新後可檢查固定門診資料格式：

```bash
npm run validate:schedule
```

## 本機測試

```bash
npm install
cp .env.example .env
npm run dev
```

健康檢查：

```text
GET http://localhost:3000/health
```

部署前檢查：

```bash
npm run preflight
```

這會確認必要資料檔存在、LINE 環境變數已設定，並用幾個常見問題測試知識庫檢索。

正式啟用向量 RAG 後，建議再跑：

```bash
npm run smoke:vector
```

這會確認 Supabase 向量表、RPC 與混合檢索是否能命中預期資料來源。

## Zeabur 部署

1. 把這個資料夾推到 GitHub。
2. 在 Zeabur 新增 Project，選擇從 GitHub 匯入這個 repo。
3. 設定環境變數：
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_ADMIN_USER_IDS`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `OPENAI_EMBEDDING_MODEL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_CONVERSATION_TABLE`
   - `SUPABASE_SETTINGS_TABLE`
   - `SUPABASE_KNOWLEDGE_TABLE`
   - `SUPABASE_KNOWLEDGE_MATCH_RPC`
   - `VECTOR_KNOWLEDGE_ENABLED`
   - `VECTOR_KNOWLEDGE_MATCH_COUNT`
   - `VECTOR_KNOWLEDGE_MIN_SIMILARITY`
   - `LINE_VOOM_URL`
   - `LINE_VOOM_OUTPUT`
   - `LINE_VOOM_KEYWORDS`
   - `LINE_VOOM_SYNC_ENABLED`
   - `LINE_VOOM_SYNC_TIME`
4. 部署成功後，取得 Zeabur 的公開網址。
5. 到 LINE Developers > Messaging API > Webhook URL，填入：

```text
https://你的-zeabur網域/webhook
```

6. 啟用 `Use webhook`，並關閉或調整 LINE 官方帳號原本的自動回覆，避免兩邊同時回覆。

Zeabur 目前支援 Node.js app 部署，也可使用 Dockerfile 部署；本專案兩者都可用。

## 安全邊界

這個 bot 不應做診斷、不應開藥、不應解讀個人檢查報告。醫療相關個資請不要放入知識庫，也不要把病人姓名、電話、病歷、檢查結果拿來當語氣範例。
