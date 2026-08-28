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
    // requireFlowAccess("conference") 通過代表 session.enrollment.conference
    // 是 true，一定有 enrollmentId，這裡的 ! 不是猜測。
    const enrollmentId = session.user.enrollmentId!
    const data = await saveMyDinnerSelection(enrollmentId, session.user.id, input)
    return { ok: true, data }
  } catch (error) {
    unstable_rethrow(error)
    return { ok: false, error: error instanceof Error ? error.message : "儲存失敗，請稍後再試" }
  }
}
