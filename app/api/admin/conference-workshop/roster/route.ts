import { NextResponse } from "next/server"

import { getWorkshopRoster } from "@/lib/conference-workshop"
import { conferenceWorkshops, workshopRoundLabels, type ConferenceWorkshopRound } from "@/lib/opening-conference-content"
import { requireStaff } from "@/lib/session"

// 後台下載工作坊名單，只有工作人員能用。format=txt 直接觸發瀏覽器下載
// （<a href> 就能用，不用前端 JS）；format=json（預設）給前端拿去畫圖片版
// 名單（見 lib/export-workshop-roster.ts），canvas 只能在瀏覽器畫，這裡
// 只負責把資料撈出來。
export async function GET(request: Request) {
  try {
    await requireStaff()
  } catch {
    return NextResponse.json({ ok: false, error: "請先登入" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const workshopId = searchParams.get("workshopId") ?? ""
  const round = searchParams.get("round") ?? ""
  const format = searchParams.get("format") ?? "json"

  const workshop = conferenceWorkshops.find((w) => w.id === workshopId)
  const validRound = round === "R1" || round === "R2" ? (round as ConferenceWorkshopRound) : null
  if (!workshop || !validRound || !workshop.rounds.includes(validRound)) {
    return NextResponse.json({ ok: false, error: "工作坊或場次不存在" }, { status: 400 })
  }

  const roster = await getWorkshopRoster(workshopId, validRound)
  const title = workshop.topic || workshop.speaker

  if (format === "txt") {
    const lines = [
      title,
      `${workshop.speaker}｜${workshop.location}`,
      `${workshopRoundLabels[validRound]}｜共 ${roster.length} 人`,
      "",
      ...roster.map((r) => `${r.name}\t${r.church}`),
    ]
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${workshopId}-${validRound}-roster.txt"`,
      },
    })
  }

  return NextResponse.json({
    ok: true,
    workshop: { title, speaker: workshop.speaker, location: workshop.location },
    round: validRound,
    roundLabel: workshopRoundLabels[validRound],
    roster,
  })
}
