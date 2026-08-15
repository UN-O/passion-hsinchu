# 2026 Passion Camp

Next.js + Tailwind v4 + shadcn/ui。

## UI 開發規則

**在寫任何 UI／頁面／元件之前，先讀 [style.md](style.md)。** 裡面定義了色彩用法（brand-yellow 只做強調）、mobile-first 寫法、留白、互動狀態表達方式，以及禁止事項（emoji、裝飾性 icon、漸層、陰影、裝飾性動畫）。

UI 元件用 `pnpm dlx shadcn@latest add <component>` 安裝，加入後依 style.md 調整樣式。

## 分支

**一律在 `2026` 分支上開發。** 不要另開 `claude/*` 分支。

## 資安規則（這個 repo 是 public，且處理未成年人個資）

這個專案的名冊來自 Google 表單，包含未成年人的姓名、教會、生日、電話、緊急聯絡人。
**任何 commit 之前都必須自己檢查一遍有沒有資安疑慮**，不要等別人抓。

絕對不可以進版控：

- 真實姓名、email、電話、生日、緊急聯絡人等個資
- **任何「知道連結就能存取」的網址**——Google 試算表／表單回覆的匯出連結、
  Drive 分享連結、預簽章 URL。這種網址本身就是一把不用密碼的鑰匙，
  即使程式只解析其中兩個欄位，拿到網址的人能下載的是**整份原始資料**。
  這類網址放 `.env`（見 `.env.example`），絕不寫死在原始碼。
- 金鑰、token、連線字串、`.pem`、`.env`

寫 API／server action 時：

- **驗證一定要在伺服器端做。** 前端的 `AuthGuard`、隱藏按鈕、localStorage
  裡的角色只是 UI，不是安全邊界——API 本身沒擋就等於沒擋。
- 後台端點用 `requireStaff()`；會回傳個人資料的端點要確認呼叫者是本人或
  staff，不能只靠網址參數（避免用連續 id 掃出所有人的資料）。

外洩發生時，改 code 只能止血，**不等於撤銷**：外流的分享連結要去 Google
改分享設定才會失效，外流的金鑰要重新產生。改 git 歷史也不會讓已經被
clone 或已被 GitHub 快取的內容消失。

## 工作人員名單

名單只存在資料庫的 `staff_allowlist` 表，**不要**在 repo 裡放任何形式的名單檔
（曾經有過 `data/staff-emails.ts`，那正是個資外洩的來源，已經移除）。

`lib/staff.ts` 只用單一 email 去查角色，沒有任何端點會吐出整份名單。每次登入
時 `auth.ts` 的 session hook 會比對這張表同步 `user.role`，所以加人之後對方
**不需要重新註冊**，下次登入就生效；從表裡移除的人也會自動降回 `attendee`。

增刪工作人員直接在 Neon 的 SQL editor 操作：

```sql
-- 加入／更新（email 一律小寫）
insert into staff_allowlist (email, role, note)
values ('someone@gmail.com', 'staff', '姓名備註')
on conflict (email) do update
  set role = excluded.role, note = excluded.note;

-- 查看目前名單
select email, role, note from staff_allowlist order by created_at;

-- 移除
delete from staff_allowlist where email = 'someone@gmail.com';
```

`role` 只能是 `staff` 或 `admin`（目前兩者權限相同，分開是為了之後要細分時
不用改 schema）。
