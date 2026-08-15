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
  （工作人員名單放 `data/staff-emails.local.json`，已 gitignore；版控裡的
  `data/staff-emails.ts` 只留空範本）
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
