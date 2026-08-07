import type { BetterAuthPlugin } from "better-auth"
import { APIError, createAuthEndpoint } from "better-auth/api"
import { setSessionCookie } from "better-auth/cookies"
import { z } from "zod"

import { findEnrollment } from "@/lib/enrollment"

// CAMP 是「識別」不是「認證」。
//
// 輸入姓名 + 教會，比對到報名名冊就直接建立 session，沒有密碼、沒有問答，
// 也不防冒名。理由是走完 CAMP 流程拿到的是一張人格測驗結果卡，冒用別人的
// 名字得到的是別人的測驗結果，損失趨近於零；要求國小生記住一個秘密只會製造
// 大量現場求助。
//
// 這個決定的前提是 CAMP 流程裡沒有私密內容。之後若要放小組分配、住宿、
// 家長聯絡方式，就必須重新檢討，因為名冊本身是未成年人個資。
//
// 由此建立的 session 只有 identified 層級。CONFERENCE 需要 verified
// （證明過 Google 帳號所有權），閘門在 app/opening/conference/layout.tsx。

// 合成一個不可路由的 email。.invalid 是 RFC 2606 保留的 TLD，
// 保證不會對應到真實信箱。
function syntheticEmail(enrollmentId: string): string {
  return `camp-${enrollmentId}@camp.invalid`
}

export const campIdentify = () =>
  ({
    id: "camp-identify",

    endpoints: {
      campSignIn: createAuthEndpoint(
        "/camp/sign-in",
        {
          method: "POST",
          body: z.object({
            name: z.string().min(1).max(100),
            church: z.string().min(1).max(200),
          }),
        },
        async (ctx) => {
          const { name, church } = ctx.body

          const enrollment = await findEnrollment(name, church)

          // 沒有秘密要保護，所以錯誤訊息可以明確；防止有人批次掃出整份名冊
          // 靠的是底下的 rateLimit，不是模糊化訊息。
          if (!enrollment || !enrollment.camp) {
            throw new APIError("UNAUTHORIZED", {
              code: "ENROLLMENT_NOT_FOUND",
              message: "查無報名資料，請確認姓名與報名表上填寫的完整姓名一致，或洽現場工作人員",
            })
          }

          const internal = ctx.context.internalAdapter
          const email = syntheticEmail(enrollment.id)

          let user = (await internal.findUserByEmail(email))?.user ?? null

          if (!user) {
            user = await internal.createUser({
              email,
              name: enrollment.name, // 一律用名冊上的本名，不用使用者輸入的寫法
              emailVerified: false,
              role: "attendee",
              enrollmentId: enrollment.id,
            })
          } else if (user.name !== enrollment.name) {
            // 工作人員在後台改過名冊上的名字，讓帳號跟上
            user = await internal.updateUser(user.id, { name: enrollment.name })
          }

          const session = await internal.createSession(user.id)
          await setSessionCookie(ctx, { session, user })

          return ctx.json({
            user,
            // 兩場都報名的人仍然要用 Google 才能進 CONFERENCE，
            // 讓前端知道要不要提示。
            conference: enrollment.conference,
          })
        }
      ),
    },

    // 這裡擋的是「批次掃名冊」，不是猜密碼（沒有密碼可猜）。
    // 存在 database，因為 Vercel 是多實例。
    rateLimit: [
      {
        pathMatcher: (path: string): boolean => path === "/camp/sign-in",
        max: 20,
        window: 300,
      },
    ],
  }) satisfies BetterAuthPlugin
