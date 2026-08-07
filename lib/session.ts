import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { flowProgress } from "@/db/schema/app"
import { account } from "@/db/schema/auth"
import { auth } from "./auth"
import { getEnrollmentById, type Enrollment } from "./enrollment"

export type Flow = "camp" | "conference"

export type AppSession = {
  user: {
    id: string
    name: string
    email: string
    role: "attendee" | "staff" | "admin"
    enrollmentId: string | null
  }
  enrollment: Enrollment | null
  // 兩個認證層級：
  //   identified — 姓名+教會比對到名冊，但沒有任何所有權證明（CAMP 那條路）
  //   verified   — 證明過 Google 帳號所有權
  // CONFERENCE 與後台必須要求 verified，否則走 CAMP 那條無驗證的路
  // 就能繞進去，Google 驗證形同虛設。
  isVerified: boolean
  completedFlows: Flow[]
}

export async function getAppSession(): Promise<AppSession | null> {
  const result = await auth.api.getSession({ headers: await headers() })
  if (!result) return null

  const user = result.user as AppSession["user"]

  const [enrollment, googleAccounts, progress] = await Promise.all([
    user.enrollmentId ? getEnrollmentById(user.enrollmentId) : Promise.resolve(null),
    db
      .select({ id: account.id })
      .from(account)
      .where(and(eq(account.userId, user.id), eq(account.providerId, "google")))
      .limit(1),
    db
      .select({ flow: flowProgress.flow, completedAt: flowProgress.completedAt })
      .from(flowProgress)
      .where(eq(flowProgress.userId, user.id)),
  ])

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role ?? "attendee",
      enrollmentId: user.enrollmentId ?? null,
    },
    enrollment,
    isVerified: googleAccounts.length > 0,
    completedFlows: progress.filter((p) => p.completedAt !== null).map((p) => p.flow),
  }
}

export async function markFlowComplete(userId: string, flow: Flow) {
  await db
    .insert(flowProgress)
    .values({ userId, flow, completedAt: new Date() })
    .onConflictDoUpdate({
      target: [flowProgress.userId, flowProgress.flow],
      set: { completedAt: new Date() },
    })
}

// 登入成功後該去哪裡。兩場都報名的人要自己選，其餘直接進對應流程。
export function postSignInPath(session: AppSession): string {
  if (session.user.role !== "attendee") return "/admin/enrollment"
  if (!session.enrollment) return "/claim"

  const { camp, conference } = session.enrollment
  // 只報 CONFERENCE 卻沒有 Google（不可能從正常路徑發生，但別讓他卡在迴圈）
  if (conference && !camp && !session.isVerified) return "/signin?need=google"
  if (camp && conference) return "/opening"
  if (conference) return "/opening/conference/welcome"
  return "/opening/camp/welcome"
}

// 有 session、而且已經認領到名冊。未認領的 Google 使用者會被送去 /claim。
export async function requireClaimedSession(): Promise<AppSession> {
  const session = await getAppSession()
  if (!session) redirect("/signin")
  if (!session.enrollment) {
    // 工作人員不需要名冊資料
    if (session.user.role !== "attendee") return session
    redirect("/claim")
  }
  return session
}

// opening flow 的閘門。放在 layout 裡而不是 proxy.ts：
// proxy 只做 cookie 存在性的樂觀導向，不是安全邊界。
export async function requireFlowAccess(flow: Flow): Promise<AppSession> {
  const session = await requireClaimedSession()

  const enrolled = flow === "camp" ? session.enrollment?.camp : session.enrollment?.conference
  if (!enrolled) redirect("/")

  // CONFERENCE 需要證明過 Google 帳號所有權；CAMP 不需要
  if (flow === "conference" && !session.isVerified) redirect("/signin?need=google")

  return session
}

export async function requireStaff(): Promise<AppSession> {
  const session = await getAppSession()
  if (!session) redirect("/signin")
  // 後台一律要求 verified，不接受 CAMP 那條無驗證的 session
  if (!session.isVerified) redirect("/signin?need=google")
  if (session.user.role !== "staff" && session.user.role !== "admin") redirect("/")
  return session
}
