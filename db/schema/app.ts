import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core"

import { user } from "./auth"

// 報名名冊。來源是 Google Form 匯出的 CSV，由 /admin/enrollment 上傳維護。
// name / church 保留使用者填寫的原始值（顯示用），*_norm 是 lib/normalize.ts
// 產生的比對用值。
export const enrollment = pgTable(
  "enrollment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    nameNorm: text("name_norm").notNull(),
    church: text("church").notNull(),
    churchNorm: text("church_norm").notNull(),
    camp: boolean("camp").notNull().default(false),
    conference: boolean("conference").notNull().default(false),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // 同名同教會不處理，這組就是一個人的唯一鍵；CSV 也靠它做 upsert
    uniqueIndex("enrollment_name_church_norm_idx").on(table.nameNorm, table.churchNorm),
    // 登入時是先有姓名才有教會，單獨對 name_norm 建索引
    index("enrollment_name_norm_idx").on(table.nameNorm),
  ]
)

// 工作人員白名單。每次登入都會比對這張表同步 user.role，
// 所以之後才被加進來的人不用重新註冊，下次登入就生效。
export const staffAllowlist = pgTable("staff_allowlist", {
  email: text("email").primaryKey(), // 一律小寫存
  role: text("role", { enum: ["staff", "admin"] })
    .notNull()
    .default("staff"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// 取代原本存在 cookie 裡的 hasCompletedOpening。
// payload 這次不寫入，先留著給之後持久化 camp 測驗答案 / conference 選擇用。
export const flowProgress = pgTable(
  "flow_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    flow: text("flow", { enum: ["camp", "conference"] }).notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    payload: jsonb("payload"),
  },
  (table) => [primaryKey({ columns: [table.userId, table.flow] })]
)

// 認領轉移紀錄：CAMP 免驗證合成帳號（camp-*@camp.invalid）的報名認領被
// 轉移到後來用 Google 驗證登入的帳號時（見 lib/claim-merge.ts），留一筆
// 稽核紀錄，工作人員之後可以在 Neon SQL editor 查「這筆報名什麼時候、
// 從哪個帳號轉去哪個帳號」——轉移本身不需要人工審核就會發生，這張表
// 是唯一的事後追蹤方式。帳號被刪掉時記錄要留著，所以是 set null 不是
// cascade；email 是轉移當下的快照，不是即時關聯查詢。
export const claimMerges = pgTable("claim_merges", {
  id: uuid("id").defaultRandom().primaryKey(),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollment.id, { onDelete: "cascade" }),
  oldUserId: text("old_user_id").references(() => user.id, { onDelete: "set null" }),
  oldUserEmail: text("old_user_email").notNull(),
  newUserId: text("new_user_id").references(() => user.id, { onDelete: "set null" }),
  newUserEmail: text("new_user_email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// CAMP 加分記錄。分數是「區」的總分，不追到個人。
//
// 各區總分一律用 sum(amount) 現算，不另外存一份冗餘的總分欄位——兩份數字
// 遲早會對不起來，而且加分／修正／刪除三條路都要記得同步。
// 多選分區時一區寫一列，這樣修正與刪除的單位跟畫面上看到的一列一致。
//
// 不會有扣分，所以修正與刪除都直接改這張表，不需要沖銷列。
//
// team_name（隊名，見 lib/camp-teams.ts 的固定 9 隊清單）是後來加的：
// 後台加分改成選「隊」不是選「區」，region 一樣照填（從隊名反推），
// 舊邏輯（各區總分）完全不用動，team_name 純粹讓 lib/exp.ts 多算一份
// 「各隊總分」給首頁「勇氣值」卡片用。nullable 是因為舊資料、或之後如果
// 又出現不屬於特定隊的整區加分，team_name 允許留空，那筆只算進區的總分、
// 不會被算進任何一隊。
export const expRecord = pgTable(
  "exp_record",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    region: text("region", { enum: ["bee", "clownfish", "groundhog"] }).notNull(),
    teamName: text("team_name"),
    amount: integer("amount").notNull(),
    reason: text("reason"),
    // 帳號被刪掉時記錄要留著（總分不能因此少一塊），所以是 set null 而不是 cascade。
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    // 加分當下的姓名快照。工作人員之後被移出名單、改名或刪帳號，
    // 這筆記錄仍然看得出是誰加的。
    createdByName: text("created_by_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // 總分是 group by region 的聚合
    index("exp_record_region_idx").on(table.region),
    // 各隊總分是 group by team_name 的聚合，跟上面 region 那個索引分開，
    // 兩種聚合方式都常態在查（首頁勇氣值卡片每次都要算）。
    index("exp_record_team_name_idx").on(table.teamName),
    // 記錄列表一律照時間新到舊排
    index("exp_record_created_at_idx").on(table.createdAt),
  ]
)

// 分隊名單（隊員／隊輔的分區、隊名、房號等）。跟 enrollment 分開一張表，
// 是因為資料來源與更新頻率不同：enrollment 是報名時 Google Form 匯出的
// 名冊，分隊結果是活動前另外整理、定案後才匯入，而且分隊調整（換隊、換房）
// 之後可能還會再更新，不想把這種變動混進報名資料本身。
export const campTeamMember = pgTable(
  "camp_team_member",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollment.id, { onDelete: "cascade" }),
    // 沿用跟 exp_record.region 一樣的三區 enum（CAMP 加分系統用的分區，
    // 見 lib/exp-regions.ts 的 EXP_REGIONS）；不另外做分區表——理由跟
    // EXP_REGIONS 刻意不進資料庫一樣，三區是固定的，不會執行期才決定。
    zone: text("zone", { enum: ["bee", "clownfish", "groundhog"] }).notNull(),
    // 10 個固定隊名（例如土撥天際、鼠命必達）。跟 EXP_REGIONS 一樣是固定
    // 小清單，不特別拆一張 team 表。
    teamName: text("team_name").notNull(),
    role: text("role", { enum: ["member", "co_leader", "leader"] }).notNull(), // 隊員／副隊輔／主隊輔
    room: text("room"), // 房號，例如 "501"
    shirtSize: text("shirt_size"),
    memberNumber: integer("member_number"), // 隊員編號；工作人員／隊輔通常沒有編號，所以 nullable
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // 一個人只會在一隊，enrollment 對這張表是 1:1
    uniqueIndex("camp_team_member_enrollment_id_idx").on(table.enrollmentId),
    // 依隊伍列名單／篩選是主要讀取模式，比照 exp_record_region_idx
    index("camp_team_member_zone_team_name_idx").on(table.zone, table.teamName),
  ]
)

// 官方 IG 限時動態的手動上傳紀錄。原本是直接把截圖丟進 public/images/、
// 在 lib/instagram-stories.ts 寫死一個陣列（見那個檔案舊版的說明），
// 每次換圖都要改程式碼、跑一次部署——現在改成後台 /admin/ig-stories 直接
// 上傳，圖存 R2（跟大頭貼、討論區附圖同一個 bucket，storage_key 前綴
// "ig-story/" 區分），這張表只記後台管理跟前台顯示要用的中繼資料。
//
// 跟真正的 IG 限動一樣是 24 小時後自動下架（見 getActiveIgStories 的
// STORY_TTL_MS），不用手動刪除，但後台仍然可以提早刪掉貼錯的圖。
export const igStory = pgTable(
  "ig_story",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    storageKey: text("storage_key").notNull(),
    contentType: text("content_type").notNull(),
    byteSize: integer("byte_size").notNull(),
    // 帳號被刪掉時記錄要留著，所以是 set null 而不是 cascade。
    uploadedBy: text("uploaded_by").references(() => user.id, { onDelete: "set null" }),
    uploadedByName: text("uploaded_by_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // 列表一律照上傳時間新到舊排，過期判斷也是拿這欄跟 24 小時比較。
    index("ig_story_created_at_idx").on(table.createdAt),
  ]
)

// 使用者自己設定的個人化資料。刻意不加在 auth.ts 的 user 表上：那張表是
// `@better-auth/cli generate` 產生的，重新產生時手動加的欄位會被蓋掉
// （檔頭那段警告就是這麼來的）。
//
// 勇者名沒有放在這裡——它是開場測驗的產物，已經存在 flow_progress.payload
// 的 heroName（見 lib/session.ts），改名就是改那一筆，不另外開一個會跟它
// 對不起來的第二份。
export const userProfile = pgTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  // 自己上傳的大頭貼在 R2 的 key（跟討論區附圖同一個 bucket、不同前綴）。
  // NULL＝沒上傳過，這時候退回 Google 帳號的頭像，再退回姓名第一個字。
  avatarKey: text("avatar_key"),
  avatarUpdatedAt: timestamp("avatar_updated_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

// CONFERENCE 工作坊報名。工作坊本身（主題、講員、開放場次）是固定內容，
// 寫在 lib/opening-conference-content.ts 的 conferenceWorkshops，這裡只存
// 「誰在哪一場選了哪個工作坊」。一人兩場（R1／R2）各選一個，所以是
// enrollmentId + round 的唯一鍵，不是 enrollmentId 單一鍵。
//
// 用 enrollmentId（不是 userId）當外鍵，跟 camp_team_member 同一個理由：
// 資料來源常常早於帳號存在——這張表要先用既有 Google 表單回覆（CSV 匯入）
// 回填，那些人很多還沒登入建帳號。source 記來源是匯入還是使用者自己在
// 系統上選／改的，方便後台分辨；使用者永遠可以在系統上重新選擇覆蓋掉
// 匯入的舊值（包含匯入來的），所以不需要另外做「鎖定」欄位。
export const conferenceWorkshopRegistration = pgTable(
  "conference_workshop_registration",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollment.id, { onDelete: "cascade" }),
    round: text("round", { enum: ["R1", "R2"] }).notNull(),
    workshopId: text("workshop_id").notNull(),
    source: text("source", { enum: ["import", "self"] }).notNull(),
    // 使用者自己在系統上選的才有值；CSV 匯入的這裡是 null。
    // 帳號被刪掉時記錄要留著，所以是 set null 而不是 cascade。
    updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("conf_workshop_reg_enrollment_round_idx").on(table.enrollmentId, table.round),
  ]
)

// 工作坊／場次人數上限。預設不設上限（這張表沒有該工作坊＋場次的列＝不限），
// 只有真的額滿要擋新選的才會有一列，目前是工作坊 A 場次一（現場 Google
// 表單已經在擋了）。上限是後台手動輸入的固定數字，不是自動抓 Google
// 表單，改動很少見，直接讓工作人員在後台輸入當下人數即可。
export const conferenceWorkshopCapacity = pgTable(
  "conference_workshop_capacity",
  {
    workshopId: text("workshop_id").notNull(),
    round: text("round", { enum: ["R1", "R2"] }).notNull(),
    capacity: integer("capacity").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.workshopId, table.round] })]
)

// 週六晚餐（8/29 17:35 信徒大樓餐廳）報名，一人一列——跟工作坊不同，
// 這裡沒有場次的概念，enrollmentId 本身就是唯一鍵。mealType 只有
// attending 為 true 時才有值（不參加就不需要選葷素），所以是 nullable，
// 不是額外開一個「未選擇」的 enum 選項。
export const conferenceDinnerRegistration = pgTable("conference_dinner_registration", {
  enrollmentId: uuid("enrollment_id")
    .primaryKey()
    .references(() => enrollment.id, { onDelete: "cascade" }),
  attending: boolean("attending").notNull(),
  mealType: text("meal_type", { enum: ["meat", "veggie"] }),
  // 帳號被刪掉時記錄要留著，所以是 set null 而不是 cascade。
  updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
