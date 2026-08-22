import { NextResponse } from "next/server"

import { requireClaimedSession } from "@/lib/session"
import { DiscussionError, IMAGE_MAX_UPLOAD_BYTES } from "@/lib/discussion/constants"
import { sweepOrphanImages, uploadPendingImage } from "@/lib/discussion/images"

// 討論區附圖的上傳端點。
//
// 壓縮（縮到長邊 1600、轉 webp）是在瀏覽器做的，這裡收到的已經是成品——
// 但端點不能因此就相信送進來的東西：任何人都可以直接打這支 API，所以
// 大小、格式（magic bytes，不是宣告的 content-type）、身分都要自己驗
// （見 CLAUDE.md：API 本身沒擋就等於沒擋）。
//
// 一次一張。10 張圖就是 10 個請求，前端會併發送出並各自顯示進度／骨架，
// 不會因為其中一張慢就整批卡住。
export async function POST(request: Request) {
  // 沒有 session 時 requireClaimedSession() 會 redirect，在 route handler
  // 裡會變成一個 throw——包起來轉成 401，讓前端拿到的是可以顯示的錯誤。
  let session
  try {
    session = await requireClaimedSession()
  } catch {
    return NextResponse.json({ ok: false, error: "請先登入" }, { status: 401 })
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > IMAGE_MAX_UPLOAD_BYTES * 2 + 8192) {
    return NextResponse.json({ ok: false, error: "圖片太大了" }, { status: 413 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "上傳的資料格式不正確" }, { status: 400 })
  }

  const full = form.get("full")
  const thumb = form.get("thumb")
  const width = Number(form.get("width"))
  const height = Number(form.get("height"))

  if (!(full instanceof File) || !(thumb instanceof File)) {
    return NextResponse.json({ ok: false, error: "缺少圖片檔案" }, { status: 400 })
  }

  try {
    const image = await uploadPendingImage({
      uploaderId: session.user.id,
      full: new Uint8Array(await full.arrayBuffer()),
      thumb: new Uint8Array(await thumb.arrayBuffer()),
      declaredType: full.type,
      width,
      height,
    })

    // 順手回收沒送出的舊上傳。會產生孤兒的人就是會上傳的人，不需要另外
    // 排程；失敗也不影響這次上傳的結果。
    sweepOrphanImages().catch((error) => console.error("[discussion] 孤兒圖片回收失敗", error))

    return NextResponse.json({ ok: true, image })
  } catch (error) {
    if (error instanceof DiscussionError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }
    console.error("[discussion] 圖片上傳失敗", error)
    return NextResponse.json({ ok: false, error: "上傳失敗，請稍後再試" }, { status: 500 })
  }
}
