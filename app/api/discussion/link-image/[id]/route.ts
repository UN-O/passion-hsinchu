import { NextResponse } from "next/server"

import { getObject } from "@/lib/r2"
import { getLinkImageKey } from "@/lib/discussion/link-preview"
import { requireClaimedSession } from "@/lib/session"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 連結預覽卡片的縮圖。圖片本身是公開網頁的 og:image，不是使用者的照片，
// 所以不需要像 /api/discussion/images 那樣比對活動權限——但仍然要求登入，
// 這條路由不對外開放給沒登入的人當圖床。
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_PATTERN.test(id)) return new NextResponse(null, { status: 404 })

  try {
    await requireClaimedSession()
  } catch {
    return new NextResponse(null, { status: 401 })
  }

  const key = await getLinkImageKey(id)
  if (!key) return new NextResponse(null, { status: 404 })

  const object = await getObject(key)
  if (!object) return new NextResponse(null, { status: 404 })

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": object.contentType ?? "application/octet-stream",
      ...(object.contentLength ? { "Content-Length": String(object.contentLength) } : {}),
      "Cache-Control": "private, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  })
}
