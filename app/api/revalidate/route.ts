import { updateTag } from "next/cache"
import { NextResponse } from "next/server"

import { CHURCH_LIST_TAG } from "@/lib/enrollment"
import { EXP_TOTALS_TAG } from "@/lib/exp"
import { CAMP_TEAM_TAG } from "@/lib/discussion/queries"

// 給「直接寫資料庫、跳過所有 server action」的維護腳本用（scripts/sync-roster.ts、
// scripts/rename-churches.ts，以後也包含手動改 camp_team_member 之後想立刻讓
// CAMP_TEAM_TAG 生效的情境）。這些腳本是獨立的 node process，不連著任何一個
// Next.js server instance，在腳本裡呼叫 revalidateTag/updateTag 完全沒有效果
// ——只有在真正的 Next.js request（例如這個 route handler）裡呼叫才會動到
// 對的那份快取。
//
// 只認得下面這幾個內部 tag，不接受呼叫端傳任意字串：即使有 REVALIDATE_SECRET
// 才能打到這裡，多一層白名單還是比讓任何字串都能當 tag 打進 revalidateTag 好。
const KNOWN_TAGS: Record<string, string> = {
  [CHURCH_LIST_TAG]: CHURCH_LIST_TAG,
  [EXP_TOTALS_TAG]: EXP_TOTALS_TAG,
  [CAMP_TEAM_TAG]: CAMP_TEAM_TAG,
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET
  if (!secret) {
    return NextResponse.json({ error: "REVALIDATE_SECRET 未設定" }, { status: 500 })
  }

  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const tag = typeof body?.tag === "string" ? KNOWN_TAGS[body.tag] : undefined
  if (!tag) {
    return NextResponse.json({ error: "未知的 tag" }, { status: 400 })
  }

  updateTag(tag)
  return NextResponse.json({ ok: true, tag })
}
