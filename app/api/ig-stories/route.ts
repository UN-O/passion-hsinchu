import { NextResponse } from "next/server"

import { requireStaff } from "@/lib/session"
import {
  IG_STORY_MAX_UPLOAD_BYTES,
  IgStoryError,
  sweepExpiredIgStories,
  uploadIgStory,
} from "@/lib/instagram-stories"

// 官方 IG 限動的上傳端點，只有工作人員能用（見 app/admin/ig-stories/page.tsx）。
//
// 壓縮（縮到長邊 1600、轉 webp）在瀏覽器端做，這裡收到的已經是成品——但
// 端點不能因此就相信送進來的東西：大小、格式（magic bytes，不是宣告的
// content-type）、身分都要自己驗（見 CLAUDE.md：API 本身沒擋就等於沒擋）。
export async function POST(request: Request) {
  let session
  try {
    session = await requireStaff()
  } catch {
    return NextResponse.json({ ok: false, error: "請先登入" }, { status: 401 })
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0)
  if (contentLength > IG_STORY_MAX_UPLOAD_BYTES + 8192) {
    return NextResponse.json({ ok: false, error: "圖片太大了" }, { status: 413 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "上傳的資料格式不正確" }, { status: 400 })
  }

  const file = form.get("image")
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "缺少圖片檔案" }, { status: 400 })

  try {
    const story = await uploadIgStory({
      uploaderId: session.user.id,
      uploaderName: session.user.name,
      bytes: new Uint8Array(await file.arrayBuffer()),
    })

    // 順手清掉早就過期很久的舊資料，不需要另外排程。
    sweepExpiredIgStories().catch((error) => console.error("[ig-story] 過期清除失敗", error))

    return NextResponse.json({ ok: true, story })
  } catch (error) {
    if (error instanceof IgStoryError) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }
    console.error("[ig-story] 上傳失敗", error)
    return NextResponse.json({ ok: false, error: "上傳失敗，請稍後再試" }, { status: 500 })
  }
}
