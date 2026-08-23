# 2026 Passion Camp

Next.js + Tailwind v4 + shadcn/ui。

## UI 開發規則

**在寫任何 UI／頁面／元件之前，先讀 [style.md](style.md)。** 裡面定義了色彩用法（brand-yellow 只做強調）、mobile-first 寫法、留白、互動狀態表達方式，以及禁止事項（emoji、裝飾性 icon、漸層、陰影、裝飾性動畫）。

UI 元件用 `pnpm dlx shadcn@latest add <component>` 安裝，加入後依 style.md 調整樣式。

## Playground 預覽頁（只能存在於開發環境）

`app/playground/*`（`camp-mission-home`、`camp-profile`、`camp-meeting`、
`conference-mission-home`…）是**不用登入就能看到正式元件長什麼樣**的預覽頁，
純粹方便本機開發時看畫面／截圖，不是另一套系統，跟正式路由（`/camp`、
`/conference`）render 的是**同一個元件**，差別只在 playground 版不經過
`requireFlowAccess`／session。

**這個 repo 是 public 的，網址本身可以直接被外部人士猜到或用搜尋引擎找到，
而這些頁面有幾個會直接查資料庫**（`camp-mission-home`、
`conference-mission-home`）。所以規則是：

- **正式環境（`NODE_ENV=production`）下，任何人在任何情況都不可以打到
  `/playground/*`。** 這件事由 [proxy.ts](proxy.ts) 擋（Next 16 把 middleware.ts
  改名成 proxy.ts，一個專案只認一支，不要另外建 middleware.ts），擋在路由
  最前面，根本不會進到頁面程式碼。
- 放行需要**兩個條件同時成立**：`NODE_ENV !== "production"` **且**
  `.env` 裡的 `ENABLE_PLAYGROUND=true`。兩個都要，不是任何一個就夠——就算
  以後有人不小心在正式環境的環境變數設定裡也設了 `ENABLE_PLAYGROUND=true`，
  `NODE_ENV` 那道還是會擋下來。不要把這個改成只看其中一個條件。
- **有實際查資料庫的 playground 頁面**（目前是 `camp-mission-home`，會查
  分區／小隊積分、IG 限動）**要額外呼叫 `assertPlaygroundEnabled()`**
  （見 [lib/playground-guard.ts](lib/playground-guard.ts)）在頁面自己這層再擋一次，
  不能只靠 proxy.ts——跟 `requireStaff()` 一樣的道理，外層的路由關卡以後
  可能因為 Next.js 版本更新而失效，真的查得到資料庫的地方不能只有一層。
  純靜態內容、不查資料庫的 playground 頁不需要加這個。
- 新增 playground 頁面時，是否要動資料庫決定要不要加 `assertPlaygroundEnabled()`；
  路由層的擋一律交給 proxy.ts 的 matcher 管，不要自己在頁面外再加其他判斷。
- playground 頁面看到的資料常常是預設值／假資料（例如勇氣值卡片會顯示
  「尚未分隊」），不代表正式流程跑起來也會這樣。

## 測試：不要測兩次

**要驗證登入後的畫面跟資料，走真正的 `/camp`、`/conference` 路由，不要先在
playground 測一次、之後又要在真的登入流程裡再測一次**——這是重複勞動，
而且 playground 看到的假資料不代表真正登入後長那樣，等於白測。

- **學員端功能**：直接用測試帳號登入 `/claim` 走完整流程，不用先在
  playground 看過一輪。正式流程用「教會 + 姓名」對 `enrollment` 表
  （`lib/enrollment.ts` 的 `findEnrollment`）比對登入，不是帳號密碼。
  資料庫裡留了一筆測試用的假資料：
  - 教會：新竹浸信會
  - 姓名：測試學員
- **後台／staff 功能**（`requireStaff()` 擋住的端點、`/admin/*`）：這類角色是
  用 Google 登入的 email 對 `staff_allowlist` 表比對出來的（見「工作人員
  名單」），沒有一組通用測試帳密可以直接冒充。**遇到需要驗證後台功能時，
  請使用者自己在本機登入 `localhost` 讓你接手測**，不要試圖用 playground
  的假資料繞過，也不要自己編造 staff session。

## 分支

**一律在 `2026` 分支上開發。** 不要另開 `claude/*` 分支。

## 開發流程

- **開始做新功能前先 `git fetch origin` 並同步 `origin/2026`**,避免在過期的
  base 上開發、之後衝突一大片。
- **push 之前先測過:** `pnpm lint`、`pnpm typecheck`,UI 變更要實際跑
  `pnpm dev` 點過一次金流路徑(golden path）。全部過了才 push。
- **push 之後產生一份給 codebase 管理者看的摘要**,內容用繁體中文、條列式,
  讓 contributor 可以直接複製貼到 LINE 群組:改了什麼、為什麼改、有沒有需要
  管理者額外處理的事(例如要手動跑 migration、要在 Neon 加白名單等)。

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
