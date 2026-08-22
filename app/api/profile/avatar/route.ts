import { NextResponse } from "next/server"

import { requireClaimedSession } from "@/lib/session"
import { AVATAR_MAX_BYTES, saveAvatar } from "@/lib/profile"

// 上傳自己的大頭貼。壓縮（正方形裁切、轉 webp）在瀏覽器端做，這裡照樣要
// 自己驗身分、大小與檔頭——端點可以被直接呼叫（見 CLAUDE.md）。
//
// 只能改自己的：userId 一律取自 session，不從請求裡讀。
export async function POST(request: Request) {
  let session
  try {
    session = await requireClaimedSession()
  } catch {
    return NextResponse.json({ ok: false, error: "請先登入" }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ ok: false, error: "上傳的資料格式不正確" }, { status: 400 })
  }

  const file = form.get("avatar")
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: "缺少圖片檔案" }, { status: 400 })
  if (file.size > AVATAR_MAX_BYTES) return NextResponse.json({ ok: false, error: "圖片太大了" }, { status: 413 })

  const bytes = new Uint8Array(await file.arrayBuffer())
  // RIFF....WEBP。宣稱的 content-type 是前端寫的，不能拿來當真。
  const isWebp =
    bytes.length > 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  if (!isWebp) return NextResponse.json({ ok: false, error: "圖片格式不正確" }, { status: 400 })

  try {
    const url = await saveAvatar(session.user.id, bytes, "image/webp")
    return NextResponse.json({ ok: true, url })
  } catch (error) {
    console.error("[profile] 頭像上傳失敗", error)
    return NextResponse.json({ ok: false, error: "上傳失敗，請稍後再試" }, { status: 500 })
  }
}
