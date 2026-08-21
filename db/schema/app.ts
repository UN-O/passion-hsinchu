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
export const expRecord = pgTable(
  "exp_record",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    region: text("region", { enum: ["bee", "clownfish", "groundhog"] }).notNull(),
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
