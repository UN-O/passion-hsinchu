"use server"

import { redirect } from "next/navigation"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { user } from "@/db/schema/auth"
import { findEnrollment } from "@/lib/enrollment"
import { mergeCampIdentity } from "@/lib/claim-merge"
import { getAppSession, postSignInPath } from "@/lib/session"

export type ClaimState = { error: string | null }

export async function claimIdentity(
  _prevState: ClaimState,
  formData: FormData
): Promise<ClaimState> {
  const session = await getAppSession()
  if (!session) redirect("/signin")
  if (session.enrollment) redirect(postSignInPath(session))

  const name = String(formData.get("name") ?? "").trim()
  const church = String(formData.get("church") ?? "").trim()

  if (!name || !church) return { error: "請填寫教會與姓名" }

  const enrollment = await findEnrollment(name, church)
  if (!enrollment) {
    return {
      error: "查無報名資料，請確認姓名與報名表上填寫的完整姓名一致，或洽現場工作人員",
    }
  }

  // user.enrollment_id 上有 unique index，這裡先查是為了回傳友善訊息；
  // 真正保證「一筆報名只能被一個帳號認領」的是資料庫的約束。
  const [taken] = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.enrollmentId, enrollment.id))
    .limit(1)

  if (taken && taken.id !== session.user.id) {
    // 舊的認領者是 CAMP 免驗證登入的合成帳號（camp-*@camp.invalid，見
    // lib/auth-plugins/camp-identify.ts）：代表同一個人之前用姓名＋教會
    // 報到過，現在換用 Google 驗證登入（例如要進 CONFERENCE），不是真的
    // 被別人搶先認領，直接把報名轉移過來，不要卡在「已被認領」。
    if (taken.email.endsWith("@camp.invalid")) {
      try {
        await mergeCampIdentity(
          taken.id,
          taken.email,
          session.user.id,
          session.user.email,
          enrollment.id,
          enrollment.name
        )
      } catch {
        return { error: "這筆報名資料已被其他帳號認領，請洽現場工作人員" }
      }
      const updated = await getAppSession()
      redirect(updated ? postSignInPath(updated) : "/")
    }

    // 對方是別的已驗證帳號：真的被別人認領了，或者自己剛剛用錯了 Google 帳號登入
    return {
      error: "這筆報名資料已經用其他 Google 帳號認領了，如果這是你本人，可能是登入時選錯了 Google 帳號，請確認後再試一次",
    }
  }

  try {
    await db
      .update(user)
      // 姓名一律改成名冊上的本名，不用 Google 帳號的顯示名稱
      .set({ enrollmentId: enrollment.id, name: enrollment.name })
      .where(eq(user.id, session.user.id))
  } catch {
    // 兩個人同時認領同一筆時，unique index 會讓其中一個失敗
    return { error: "這筆報名資料已被其他帳號認領，請洽現場工作人員" }
  }

  const updated = await getAppSession()
  redirect(updated ? postSignInPath(updated) : "/")
}
