# 津久診所 LINE Bot 測試版

這是一個可部署到 Zeabur 的 LINE 官方帳號客服機器人雛形。它會讀取 `data/` 裡的所有 `.md` 檔案作為知識庫，回答診所資訊、掛號流程、交通、看診時間與一般衛教；遇到個人病情、診斷、用藥或檢查報告問題時，會建議轉真人或預約門診。

## 你要先準備的資料

1. LINE Developers 的 `Channel secret`
2. LINE Developers 的 `Channel access token`
3. OpenAI API key，可先不填，但填了回答會更自然
4. 診所/官方帳號資訊，放到 `data/clinic-info.md`
5. 醫師門診、休診與臨時異動，放到 `data/doctor-schedule.md`

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

## Supabase 對話記憶

若要讓 bot 記得同一位 LINE 使用者先前的對話，請在 Supabase SQL Editor 建立資料表：

```sql
create table if not exists line_conversation_messages (
  id bigserial primary key,
  line_user_id text not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists line_conversation_messages_user_time_idx
on line_conversation_messages (line_user_id, created_at, id);
```

接著在 Zeabur 或 `.env` 設定：

```text
SUPABASE_URL=你的_Supabase_Project_URL
SUPABASE_SERVICE_ROLE_KEY=你的_Supabase_Service_Role_Key
SUPABASE_CONVERSATION_TABLE=line_conversation_messages
```

`SUPABASE_SERVICE_ROLE_KEY` 只能放在伺服器環境變數，不要放到前端或公開文件。設定完成後，bot 會依 LINE `userId` 讀取該使用者全部歷史對話，回覆後也會把本輪使用者訊息與 bot 回覆寫入 Supabase。

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

## Zeabur 部署

1. 把這個資料夾推到 GitHub。
2. 在 Zeabur 新增 Project，選擇從 GitHub 匯入這個 repo。
3. 設定環境變數：
   - `LINE_CHANNEL_SECRET`
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_CONVERSATION_TABLE`
   - `LINE_VOOM_URL`
   - `LINE_VOOM_OUTPUT`
   - `LINE_VOOM_KEYWORDS`
4. 部署成功後，取得 Zeabur 的公開網址。
5. 到 LINE Developers > Messaging API > Webhook URL，填入：

```text
https://你的-zeabur網域/webhook
```

6. 啟用 `Use webhook`，並關閉或調整 LINE 官方帳號原本的自動回覆，避免兩邊同時回覆。

Zeabur 目前支援 Node.js app 部署，也可使用 Dockerfile 部署；本專案兩者都可用。

## 安全邊界

這個 bot 不應做診斷、不應開藥、不應解讀個人檢查報告。醫療相關個資請不要放入知識庫，也不要把病人姓名、電話、病歷、檢查結果拿來當語氣範例。
