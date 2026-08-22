import { NextResponse } from "next/server"

import { getObject } from "@/lib/r2"
import { getImageForRead } from "@/lib/discussion/images"
import { getPostContext } from "@/lib/discussion/queries"
import { flowForRootKey } from "@/lib/discussion/root-registry"
import { assertFlowAccess, requireClaimedSession } from "@/lib/session"

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// 討論區附圖的讀取端點。R2 bucket 是私有的，這裡是唯一能看到圖的入口。
//
// 權限跟 /discussion/[postId] 同一套（見那一頁的說明）：網址上只有一個
// image id，沒有任何活動資訊，所以要從圖片反查它所屬的貼文、由 root_key
// 對應回 flow，再套那個 flow 的閘門。只擋「有登入」是不夠的——只報名
// CONFERENCE 的人不該看得到 CAMP 討論區裡的照片，而這些照片裡有未成年人。
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!UUID_PATTERN.test(id)) return new NextResponse(null, { status: 404 })

  let session
  try {
    session = await requireClaimedSession()
  } catch {
    return new NextResponse(null, { status: 401 })
  }

  const image = await getImageForRead(id)
  if (!image) return new NextResponse(null, { status: 404 })

  if (image.postId === null) {
    // 還沒被附加到貼文的上傳（使用者正在編輯器裡預覽）——沒有貼文可以
    // 查權限，所以只有上傳者本人看得到。
    if (image.uploadedBy !== session.user.id) return new NextResponse(null, { status: 404 })
  } else {
    const context = await getPostContext(image.postId)
    const flow = context ? flowForRootKey(context.rootKey) : null
    // 查不到、或 root_key 沒註冊過，一律當成不存在，不可以 fallback 成放行。
    if (!flow) return new NextResponse(null, { status: 404 })
    try {
      assertFlowAccess(session, flow)
    } catch {
      return new NextResponse(null, { status: 403 })
    }
  }

  const wantsThumb = new URL(request.url).searchParams.get("v") === "thumb"
  const object = await getObject(wantsThumb ? image.thumbKey : image.storageKey)
  if (!object) return new NextResponse(null, { status: 404 })

  return new NextResponse(object.body, {
    headers: {
      "Content-Type": object.contentType ?? image.contentType,
      ...(object.contentLength ? { "Content-Length": String(object.contentLength) } : {}),
      // private：內容綁在「這個人有沒有權限」上，中間的共用快取（CDN、
      // 公司 proxy）不可以留一份給下一個人。瀏覽器自己的快取可以留久一點
      // ——同一個 id 的內容永遠不會變（改圖＝上傳新的一張）。
      "Cache-Control": "private, max-age=86400, immutable",
      // 圖片是使用者上傳的內容，一律當成附件語意處理，不讓瀏覽器把它
      // 當成同源的可執行文件（配合 nosniff）。
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  })
}
