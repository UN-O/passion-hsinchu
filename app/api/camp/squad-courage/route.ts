import { NextResponse } from "next/server"

import { getCampTeamInfo } from "@/lib/camp-team"
import { getTeamTotals } from "@/lib/exp"
import { assertFlowAccess, requireClaimedSession } from "@/lib/session"

// 首頁「勇氣值」卡片的手動重新查詢按鈕用。getTeamTotals 本身有快取，
// 但加分時後台已經用 updateTag 讓快取失效（見 app/admin/points/actions.ts），
// 所以這裡打到的一定是加分當下就生效的最新值，不用另外處理過期邏輯。
export async function GET() {
  let session
  try {
    session = await requireClaimedSession()
    assertFlowAccess(session, "camp")
  } catch {
    return NextResponse.json({ ok: false, error: "請先登入" }, { status: 401 })
  }

  const { teamName } = await getCampTeamInfo(session.user.enrollmentId)
  const teamTotals = await getTeamTotals()
  const total = teamName ? (teamTotals[teamName] ?? 0) : 0

  return NextResponse.json({ ok: true, total })
}
