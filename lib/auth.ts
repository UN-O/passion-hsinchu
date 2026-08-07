import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"

import { db } from "@/db"
import * as authSchema from "@/db/schema/auth"

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

  rateLimit: {
    enabled: true,
    // 必須用 database：Vercel 是多實例，預設的 in-memory 完全擋不住
    storage: "database",
  },

  // nextCookies() 一定要放在最後
  plugins: [nextCookies()],
})
