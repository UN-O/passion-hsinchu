"use server"

import { redirect } from "next/navigation"

import { getAppSession, markFlowComplete, postSignInPath, type Flow } from "@/lib/session"

export async function completeOpening(formData: FormData) {
  const session = await getAppSession()
  if (!session) redirect("/signin")

  const flow = String(formData.get("flow") ?? "")
  if (flow !== "camp" && flow !== "conference") redirect("/")

  const rawPayload = formData.get("payload")
  let payload: unknown
  if (typeof rawPayload === "string" && rawPayload.length > 0) {
    try {
      payload = JSON.parse(rawPayload)
    } catch {
      payload = undefined
    }
  }

  await markFlowComplete(session.user.id, flow as Flow, payload)

  // 寫死導回 "/" 的話，兩場都報名、只完成一場的人會落到行銷首頁，要自己
  // 點「進入 XXX」再繞過 ProgramPortal 才會回到開場選單，比 postSignInPath
  // 設計的「直接回 /opening 選單」多兩步。這裡重新抓一次 session（不能沿用
  // 最上面那份，completedFlows 還沒反映剛剛這次 markFlowComplete）再交給
  // postSignInPath 算，跟 app/claim/actions.ts 認領完之後的做法一致。
  const updated = await getAppSession()
  redirect(updated ? postSignInPath(updated) : "/")
}
