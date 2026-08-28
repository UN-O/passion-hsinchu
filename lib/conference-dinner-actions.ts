"use server"

import { unstable_rethrow } from "next/navigation"

import { requireFlowAccess } from "@/lib/session"
import { saveMyDinnerSelection, type DinnerRegistrationState, type SaveDinnerInput } from "./conference-dinner"

// 跟 lib/conference-workshop-actions.ts 同一個做法：每一支都自己驗 session，
// enrollmentId 一律取自 session，不從參數讀——不然任何人都能改別人的回覆。
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function saveDinnerSelection(input: SaveDinnerInput): Promise<ActionResult<DinnerRegistrationState>> {
  try {
    const session = await requireFlowAccess("conference")
    // requireFlowAccess("conference") 對一般報名者來說，通過就代表
    // session.enrollment.conference 是 true、一定有 enrollmentId；但工作人員
    // 不需要報名也能通過這關（見 assertFlowAccess），如果剛好自己也走過一次
    // CONFERENCE 開場，enrollmentId 會是 null——這裡不能再假設非 null，
    // 要先擋掉，不然會拿 null 硬塞進 enrollment_id 這個 primary key 欄位，
    // 直接讓原始 SQL 錯誤訊息外洩到畫面上。
    const enrollmentId = session.user.enrollmentId
    if (!enrollmentId) return { ok: false, error: "這個帳號沒有報名資料，無法回覆晚餐" }
    const data = await saveMyDinnerSelection(enrollmentId, session.user.id, input)
    return { ok: true, data }
  } catch (error) {
    unstable_rethrow(error)
    return { ok: false, error: error instanceof Error ? error.message : "儲存失敗，請稍後再試" }
  }
}
