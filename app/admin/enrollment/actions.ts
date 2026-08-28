"use server"

import { revalidatePath, updateTag } from "next/cache"

import { diffEnrollments, parseEnrollmentCsv } from "@/lib/enrollment-csv"
import {
  CHURCH_LIST_TAG,
  applyDiff,
  createEnrollment,
  deleteEnrollment,
  getAllForDiff,
  updateEnrollment,
} from "@/lib/enrollment"
import { requireStaff } from "@/lib/session"
// 只能匯入，不要從這裡再匯出：這個檔案是 "use server"，非函式的 export
// 會被編譯成 server reference（見 state.ts 的說明）。
import { emptyPreview, type PreviewState, type RowState } from "./state"

// 第一階段：只解析與比對，不寫入任何東西
export async function previewCsv(
  _prevState: PreviewState,
  formData: FormData
): Promise<PreviewState> {
  await requireStaff()

  const file = formData.get("file")
  let csv = String(formData.get("csv") ?? "")
  if (file instanceof File && file.size > 0) csv = await file.text()

  if (!csv.trim()) {
    return { ...emptyPreview, message: "請貼上 CSV 內容或選擇檔案" }
  }

  const { rows, errors } = parseEnrollmentCsv(csv)
  if (rows.length === 0) {
    return { csv, diff: null, errors, applied: null, message: "沒有任何可匯入的資料" }
  }

  const existing = await getAllForDiff()
  return { csv, diff: diffEnrollments(rows, existing), errors, applied: null, message: null }
}

// 第二階段：重新解析同一份內容後才寫入。
// 只做新增與更新，不刪除任何既有列 —— 已註冊的人被誤刪會直接失去帳號。
export async function confirmCsv(
  _prevState: PreviewState,
  formData: FormData
): Promise<PreviewState> {
  await requireStaff()

  const csv = String(formData.get("csv") ?? "")
  const { rows, errors } = parseEnrollmentCsv(csv)
  if (rows.length === 0) {
    return { csv, diff: null, errors, applied: null, message: "沒有任何可匯入的資料" }
  }

  const existing = await getAllForDiff()
  const diff = diffEnrollments(rows, existing)
  const applied = await applyDiff(diff)

  revalidatePath("/admin/enrollment")
  // updateTag 而不是 revalidateTag：這是 server action，匯入後要立刻讀到新資料
  updateTag(CHURCH_LIST_TAG)
  return {
    csv: "",
    diff: null,
    errors,
    applied,
    message: `已匯入：新增 ${applied.created} 筆、更新 ${applied.updated} 筆、未變更 ${applied.unchanged} 筆`,
  }
}

// 現場救援：新增一筆（現場報名）或改掉打錯的名字。
// 這是「比對不到就擋下來」政策底下唯一的救援路徑。
export async function saveEnrollment(
  _prevState: RowState,
  formData: FormData
): Promise<RowState> {
  await requireStaff()

  const id = String(formData.get("id") ?? "").trim()
  const name = String(formData.get("name") ?? "").trim()
  const church = String(formData.get("church") ?? "").trim()
  const camp = formData.get("camp") === "on"
  const conference = formData.get("conference") === "on"
  const note = String(formData.get("note") ?? "").trim() || null

  if (!name || !church) return { error: "姓名與教會都要填", message: null }
  if (!camp && !conference) return { error: "至少要勾選一個場次", message: null }

  try {
    if (id) {
      await updateEnrollment(id, { name, church, camp, conference, note })
    } else {
      await createEnrollment({ name, church, camp, conference, note })
    }
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error)
    if (text.includes("enrollment_name_church_norm_idx")) {
      return { error: "名冊上已經有同名同教會的人了", message: null }
    }
    return { error: `儲存失敗：${text}`, message: null }
  }

  revalidatePath("/admin/enrollment")
  // updateTag 而不是 revalidateTag：這是 server action，匯入後要立刻讀到新資料
  updateTag(CHURCH_LIST_TAG)
  return { error: null, message: id ? "已更新" : "已新增" }
}

// 有人說不能來了，整筆刪掉——相關資料（分隊、工作坊選擇）跟著一起清掉，
// 見 lib/enrollment.ts 的 deleteEnrollment 說明。畫面上是 AlertDialog 二次
// 確認後才呼叫，不是這裡再擋一次「真的要刪嗎」，那是前端該做的事；這裡
// 只管權限跟真正執行刪除。
export async function deleteEnrollmentAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireStaff()

  if (!id) return { ok: false, error: "缺少要刪除的 id" }

  try {
    await deleteEnrollment(id)
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "刪除失敗" }
  }

  revalidatePath("/admin/enrollment")
  updateTag(CHURCH_LIST_TAG)
  return { ok: true }
}
