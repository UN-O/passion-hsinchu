"use server"

import { unstable_rethrow } from "next/navigation"

import { requireFlowAccess } from "@/lib/session"
import { saveMyWorkshopSelection, type SaveSelectionInput, type WorkshopRegistrationState } from "./conference-workshop"

// 跟 lib/profile-actions.ts 同一個做法：每一支都自己驗 session，enrollmentId
// 一律取自 session，不從參數讀——不然任何人都能改別人的工作坊選擇。
type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function saveWorkshopSelection(
  selections: SaveSelectionInput
): Promise<ActionResult<WorkshopRegistrationState>> {
  try {
    const session = await requireFlowAccess("conference")
    // requireFlowAccess("conference") 對一般報名者來說，通過就代表
    // session.enrollment.conference 是 true、一定有 enrollmentId；但工作人員
    // 不需要報名也能通過這關（見 assertFlowAccess），如果剛好自己也走過一次
    // CONFERENCE 開場，enrollmentId 會是 null——這裡不能再假設非 null，
    // 要先擋掉，不然會拿 null 硬塞進 enrollment_id 欄位，直接讓原始 SQL
    // 錯誤訊息外洩到畫面上。
    const enrollmentId = session.user.enrollmentId
    if (!enrollmentId) return { ok: false, error: "這個帳號沒有報名資料，無法選工作坊" }
    const data = await saveMyWorkshopSelection(enrollmentId, session.user.id, selections)
    return { ok: true, data }
  } catch (error) {
    unstable_rethrow(error)
    return { ok: false, error: error instanceof Error ? error.message : "儲存失敗，請稍後再試" }
  }
}
