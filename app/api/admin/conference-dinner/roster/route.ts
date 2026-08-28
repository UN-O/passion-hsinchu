import { NextResponse } from "next/server"

import { getDinnerRoster, type DinnerMealType } from "@/lib/conference-dinner"
import { dinnerDateLabel, dinnerLocationLabel, dinnerTimeLabel } from "@/lib/opening-conference-content"
import { requireStaff } from "@/lib/session"

const MEAL_TYPE_LABELS: Record<DinnerMealType, string> = { meat: "葷食", veggie: "素食" }

// 後台下載晚餐訂便當名單，只有工作人員能用。葷素分開下載，直接觸發瀏覽器
// 下載（<a href> 就能用，不用前端 JS），跟工作坊名單下載同一個做法。
export async function GET(request: Request) {
  try {
    await requireStaff()
  } catch {
    return NextResponse.json({ ok: false, error: "請先登入" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const mealType = searchParams.get("mealType")
  if (mealType !== "meat" && mealType !== "veggie") {
    return NextResponse.json({ ok: false, error: "葷素參數錯誤" }, { status: 400 })
  }

  const roster = await getDinnerRoster(mealType)
  const label = MEAL_TYPE_LABELS[mealType]
  const lines = [
    `晚餐訂便當名單・${label}`,
    `${dinnerDateLabel} ${dinnerTimeLabel}｜${dinnerLocationLabel}`,
    `共 ${roster.length} 人`,
    "",
    ...roster.map((r) => `${r.name}\t${r.church}`),
  ]

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="dinner-${mealType}-roster.txt"`,
    },
  })
}
