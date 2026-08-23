import { NextResponse } from "next/server"

import { getObject } from "@/lib/r2"
import { getIgStoryForRead } from "@/lib/instagram-stories"
import { assertFlowAccess, requireClaimedSession } from "@/lib/session"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 官方 IG 限動的讀取端點。R2 bucket 是私有的，這裡是唯一能看到圖的入口。
// 限動只出現在 CAMP 首頁，所以權限固定套 camp flow 的閘門（沒有分不同
// 圖片各自的權限，跟討論區附圖那種要反查貼文所屬 flow 的情況不一樣）。
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_PATTERN.test(id)) return new NextResponse(null, { status: 404 })

  try {
    const session = await requireClaimedSession()
    assertFlowAccess(session, "camp")
  } catch {
    return new NextResponse(null, { status: 401 })
  }

  const story = await getIgStoryForRead(id)
  if (!story) return new NextResponse(null, { status: 404 })

  const object = await getObject(story.storageKey)
  if (!object) return new NextResponse(null, { status: 404 })

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": object.contentType ?? story.contentType,
      ...(object.contentLength ? { "Content-Length": String(object.contentLength) } : {}),
      // private：內容綁在「這個人有沒有權限」上，中間的共用快取不可以留一份。
      "Cache-Control": "private, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  })
}
