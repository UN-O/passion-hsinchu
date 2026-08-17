import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"

import { db } from "@/db"
import * as authSchema from "@/db/schema/auth"
import { campIdentify } from "./auth-plugins/camp-identify"
import { syncStaffRole } from "./staff"

// 刻意「不」啟用 emailAndPassword：那會連帶開出 /sign-up/email、/forget-password
// 等公開端點，而這個站沒有任何密碼登入。
// CONFERENCE 與工作人員走 Google；CAMP 走自訂 plugin 的識別端點（無憑證）。
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  user: {
    additionalFields: {
      // input: false —— 這兩個欄位只能由伺服器端寫入，不接受 API 帶入
      role: {
        type: ["attendee", "staff", "admin"],
        required: false,
        defaultValue: "attendee",
        input: false,
      },
      // 綁定到 enrollment.id。Google 使用者一開始是 null，走完 /claim 才有值。
      enrollmentId: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },

  session: {
    // 90 天：涵蓋整個營會，讓小朋友只需要在報到時做一次
    expiresIn: 60 * 60 * 24 * 90,
  },

  databaseHooks: {
    session: {
      create: {
        // 每次登入都把 role 對齊 staff_allowlist。掛在 session 而不是 user 建立，
        // 這樣之後才被加進名單的人不用重新註冊，下次登入就生效。
        before: async (session) => {
          await syncStaffRole(session.userId)
          return { data: session }
        },
      },
    },
  },

  rateLimit: {
    enabled: true,
    // 必須用 database：Vercel 是多實例，預設的 in-memory 完全擋不住
    storage: "database",
    customRules: {
      // better-auth 內建對所有 /sign-in* 路徑套用 3 次 / 10 秒（per IP）的
      // 特殊規則，比 /camp/sign-in 自訂的還嚴一個數量級。營會現場一堆人
      // 擠同一個 WiFi、同一個對外 IP，只要 10 秒內有 3 個人（不一定是同一人）
      // 按到「用 Google 登入」，其他人就會被擋下來，看到的是「無法連線到
      // Google」——其實是這裡的限流，不是 Google 真的連不上。放寬到跟
      // /camp/sign-in 一致的量級。
      "/sign-in/social": { window: 300, max: 20 },
    },
  },

  // nextCookies() 一定要放在最後
  plugins: [campIdentify(), nextCookies()],
})
