import { NextResponse } from "next/server"

import { getObject } from "@/lib/r2"
import { getAvatarKey } from "@/lib/profile"
import { requireClaimedSession } from "@/lib/session"

// 別人的大頭貼。討論串上每一則貼文都會用到，所以只擋「有登入」這一層：
// 頭像本來就是要給同場活動的人看的，再往下綁活動權限會讓同一張圖在
// 不同頁面時而看得到時而看不到。
export async function GET(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params

  try {
    await requireClaimedSession()
  } catch {
    return new NextResponse(null, { status: 401 })
  }

  const key = await getAvatarKey(userId)
  if (!key) return new NextResponse(null, { status: 404 })

  const object = await getObject(key)
  if (!object) return new NextResponse(null, { status: 404 })

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": object.contentType ?? "image/webp",
      ...(object.contentLength ? { "Content-Length": String(object.contentLength) } : {}),
      // 網址帶了 ?v=<更新時間>，換頭像就是換網址，所以可以放心長期快取。
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  })
}
