import { randomUUID } from "node:crypto"
import { and, eq, inArray, sql } from "drizzle-orm"

import { db } from "@/db"
import { user } from "@/db/schema/auth"
import { campTeamMember, flowProgress, userProfile } from "@/db/schema/app"
import { deleteObjects, putObject } from "@/lib/r2"
import type { ExpRegion } from "@/lib/exp-regions"
import { HERO_NAME_MAX_LENGTH } from "@/lib/profile-constants"

// 「一個人在畫面上長什麼樣子」的單一來源：顯示名稱、頭像、分區徽章。
// 討論區、個人資料頁都走這裡，不各自拼一套。

export type PublicProfile = {
  userId: string
  // 顯示名稱：有勇者名就用勇者名（討論區不該出現報名時的本名），
  // 沒有才退回帳號名稱。
  displayName: string
  // 頭像網址。優先序：自己上傳的 > Google 帳號的 > null（畫面上退回姓名
  // 第一個字，見 components/discussion/post-row.tsx 的 Avatar）。
  avatarUrl: string | null
  // 這張頭像是哪來的。個人資料頁靠它決定要不要顯示「移除」——只有自己
  // 上傳的那張能移除，Google 的頭像要改是去 Google 改。
  avatarSource: "upload" | "google" | null
  // CAMP 分隊名單上的分區，用來在名字後面掛一個區域 icon。沒分隊（工作人員、
  // CONFERENCE 的人）就是 null。
  zone: ExpRegion | null
}

export const AVATAR_MAX_BYTES = 512 * 1024

function avatarUrlFor(userId: string, avatarKey: string | null, updatedAt: Date | null, googleImage: string | null) {
  if (avatarKey) {
    // 帶上更新時間當版本號：頭像換掉之後網址跟著變，才不會被瀏覽器
    // （或中間任何一層）用舊的快取繼續顯示上一張。
    return `/api/profile/avatar/${userId}?v=${updatedAt ? updatedAt.getTime() : 0}`
  }
  return googleImage
}

function heroNameFrom(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null
  const heroName = (payload as Record<string, unknown>).heroName
  return typeof heroName === "string" && heroName.trim() ? heroName.trim() : null
}

// 批次版本：討論串一頁有幾十則貼文，不可以一則查一次。
export async function fetchPublicProfiles(userIds: string[]): Promise<Map<string, PublicProfile>> {
  const ids = [...new Set(userIds)]
  if (ids.length === 0) return new Map()

  const rows = await db
    .select({
      userId: user.id,
      name: user.name,
      googleImage: user.image,
      enrollmentId: user.enrollmentId,
      avatarKey: userProfile.avatarKey,
      avatarUpdatedAt: userProfile.avatarUpdatedAt,
      heroPayload: flowProgress.payload,
      zone: campTeamMember.zone,
    })
    .from(user)
    .leftJoin(userProfile, eq(userProfile.userId, user.id))
    // 勇者名存在 CAMP 那一列的 payload 裡（見 lib/session.ts）
    .leftJoin(flowProgress, and(eq(flowProgress.userId, user.id), eq(flowProgress.flow, "camp")))
    // user.enrollment_id 是 text、camp_team_member.enrollment_id 是 uuid，
    // 直接比對 Postgres 會拒絕（operator does not exist: text = uuid），
    // 所以明確轉型——lib/discussion/queries.ts 的小隊查詢也是同樣寫法。
    .leftJoin(campTeamMember, sql`${campTeamMember.enrollmentId}::text = ${user.enrollmentId}`)
    .where(inArray(user.id, ids))

  const result = new Map<string, PublicProfile>()
  for (const row of rows) {
    result.set(row.userId, {
      userId: row.userId,
      displayName: heroNameFrom(row.heroPayload) ?? row.name,
      avatarUrl: avatarUrlFor(row.userId, row.avatarKey, row.avatarUpdatedAt, row.googleImage),
      avatarSource: row.avatarKey ? "upload" : row.googleImage ? "google" : null,
      zone: row.zone ?? null,
    })
  }
  return result
}

export async function fetchPublicProfile(userId: string): Promise<PublicProfile | null> {
  return (await fetchPublicProfiles([userId])).get(userId) ?? null
}

// 讀取端點要用的：拿 userId 換頭像在 R2 的 key。
export async function getAvatarKey(userId: string): Promise<string | null> {
  const [row] = await db
    .select({ avatarKey: userProfile.avatarKey })
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .limit(1)
  return row?.avatarKey ?? null
}

// 上傳／替換自己的頭像。舊的那張直接從 R2 刪掉——一個人只會有一張現行
// 頭像，留著舊檔只是佔空間而且沒有任何地方會再指到它。
export async function saveAvatar(userId: string, bytes: Uint8Array, contentType: string): Promise<string> {
  const key = `avatar/${userId}/${randomUUID()}.webp`
  await putObject(key, bytes, contentType)

  const previousKey = await getAvatarKey(userId)
  const now = new Date()
  await db
    .insert(userProfile)
    .values({ userId, avatarKey: key, avatarUpdatedAt: now, updatedAt: now })
    .onConflictDoUpdate({
      target: userProfile.userId,
      set: { avatarKey: key, avatarUpdatedAt: now, updatedAt: now },
    })

  if (previousKey && previousKey !== key) await deleteObjects([previousKey]).catch(() => {})
  return `/api/profile/avatar/${userId}?v=${now.getTime()}`
}

// 移除自己上傳的頭像＝退回 Google 頭像／姓名第一個字。R2 上的檔案一起刪。
export async function removeAvatar(userId: string): Promise<void> {
  const previousKey = await getAvatarKey(userId)
  const now = new Date()
  await db
    .update(userProfile)
    .set({ avatarKey: null, avatarUpdatedAt: null, updatedAt: now })
    .where(eq(userProfile.userId, userId))
  if (previousKey) await deleteObjects([previousKey]).catch(() => {})
}

// 改勇者名＝改 flow_progress（camp）payload 裡的 heroName，不新增第二份
// 資料。payload 裡的其他欄位（aCount＝測驗結果）要原封不動保留。
export async function updateHeroName(userId: string, rawName: string): Promise<string> {
  const heroName = rawName.trim()
  if (!heroName) throw new Error("勇者名不能是空的")
  if (heroName.length > HERO_NAME_MAX_LENGTH) throw new Error(`勇者名不能超過 ${HERO_NAME_MAX_LENGTH} 個字`)

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ payload: flowProgress.payload })
      .from(flowProgress)
      .where(and(eq(flowProgress.userId, userId), eq(flowProgress.flow, "camp")))
      .limit(1)

    const payload = { ...(typeof row?.payload === "object" && row?.payload ? row.payload : {}), heroName }

    if (row) {
      await tx
        .update(flowProgress)
        .set({ payload })
        .where(and(eq(flowProgress.userId, userId), eq(flowProgress.flow, "camp")))
    } else {
      // 還沒有 camp 進度的人（工作人員預覽帳號）也能設定名字，但不要因此
      // 把 completedAt 填起來——那代表「開場已完成」，不是這裡該做的事。
      await tx.insert(flowProgress).values({ userId, flow: "camp", payload })
    }

    return heroName
  })
}
