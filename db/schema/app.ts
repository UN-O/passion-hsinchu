import {
  boolean,
  index,
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
