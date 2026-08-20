import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { and, eq } from "drizzle-orm"

import { db } from "@/db"
import { flowProgress } from "@/db/schema/app"
import { account } from "@/db/schema/auth"
import { auth } from "./auth"
import { getEnrollmentById, type Enrollment } from "./enrollment"

export type Flow = "camp" | "conference"

// 開場勇者測驗的結果，寫在 flow_progress.payload（flow = "camp"）。
export type CampQuizResult = {
  aCount: number
  heroName: string
}

function parseCampQuizResult(payload: unknown): CampQuizResult | null {
  if (!payload || typeof payload !== "object") return null
  const aCount = (payload as Record<string, unknown>).aCount
  const heroName = (payload as Record<string, unknown>).heroName
  if (typeof aCount !== "number" || aCount < 0 || aCount > 4) return null
  return { aCount, heroName: typeof heroName === "string" ? heroName : "" }
}

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
  campQuizResult: CampQuizResult | null
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
      .select({ flow: flowProgress.flow, completedAt: flowProgress.completedAt, payload: flowProgress.payload })
      .from(flowProgress)
      .where(eq(flowProgress.userId, user.id)),
  ])

  const campRow = progress.find((p) => p.flow === "camp")

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
    campQuizResult: campRow ? parseCampQuizResult(campRow.payload) : null,
  }
}

export async function markFlowComplete(userId: string, flow: Flow, payload?: unknown) {
  const completedAt = new Date()
  await db
    .insert(flowProgress)
    .values({ userId, flow, completedAt, payload: payload ?? null })
    .onConflictDoUpdate({
      target: [flowProgress.userId, flowProgress.flow],
      set: payload !== undefined ? { completedAt, payload } : { completedAt },
    })
}

// 登入成功後該去哪裡。
//
// opening 是一次性的開場，做完就不該再被丟回去（之前每次登入都會重跑）。
// 已完成的人改送到他平常要用的地方：兩場都報名的人回首頁（首頁有兩個入口），
// 只報一場的人直接進該場次的頁面。想重看開場仍然可以從那裡點進去。
export function postSignInPath(session: AppSession): string {
  if (session.user.role !== "attendee") return "/admin/enrollment"
  if (!session.enrollment) return "/claim"

  const { camp, conference } = session.enrollment
  // 只報 CONFERENCE 卻沒有 Google（不可能從正常路徑發生，但別讓他卡在迴圈）
  if (conference && !camp && !session.isVerified) return "/signin?need=google"

  const done = session.completedFlows

  if (camp && conference) {
    // 兩場都走完才回首頁；只完成一場的人還要回選單去做另一場
    return done.includes("camp") && done.includes("conference") ? "/" : "/opening"
  }

  if (conference) return done.includes("conference") ? "/conference" : "/opening/conference/welcome"
  return done.includes("camp") ? "/camp" : "/opening/camp/welcome"
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

// 「這個已經認領過的 session 能不能看這個 flow」的唯一判斷邏輯。
// 抽出來是因為有些頁面（例如 /discussion/[postId]）要先讀資料庫才知道該用
// 哪個 flow 擋，這時已經拿過 session 了，不該為了套規則再抓一次 session。
// 規則本身只有這一份，兩個入口不會走偏。
export function assertFlowAccess(session: AppSession, flow: Flow): void {
  // 工作人員兩邊都能看（首頁的「查看 CAMP／Conference 頁面」），不需要自己報名。
  // 一樣要求 verified，否則 CAMP 那條無驗證的路就能繞進來。
  if (session.user.role !== "attendee") {
    if (!session.isVerified) redirect("/signin?need=google")
    return
  }

  const enrolled = flow === "camp" ? session.enrollment?.camp : session.enrollment?.conference
  if (!enrolled) redirect("/")

  // CONFERENCE 需要證明過 Google 帳號所有權；CAMP 不需要
  if (flow === "conference" && !session.isVerified) redirect("/signin?need=google")
}

// opening flow 的閘門。放在 layout 裡而不是 proxy.ts：
// proxy 只做 cookie 存在性的樂觀導向，不是安全邊界。
export async function requireFlowAccess(flow: Flow): Promise<AppSession> {
  const session = await requireClaimedSession()
  assertFlowAccess(session, flow)
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
