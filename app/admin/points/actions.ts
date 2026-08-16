"use server"

import { randomUUID } from "node:crypto"
import { revalidatePath, updateTag } from "next/cache"

import {
  EXP_TOTALS_TAG,
  createExpRecords,
  deleteExpRecord,
  updateExpRecord,
} from "@/lib/exp"
import {
  EXP_AMOUNT_MAX,
  EXP_AMOUNT_MIN,
  EXP_REASON_MAX_LENGTH,
  expRegionLabel,
  isExpRegion,
  type ExpRegion,
} from "@/lib/exp-regions"
import { requireStaff } from "@/lib/session"
// 只能匯入，不要從這裡再匯出：這個檔案是 "use server"，非函式的 export
// 會被編譯成 server reference（見 state.ts 的說明）。
import { emptyAward, type AwardState, type RecordState } from "./state"

// 加分後要讓學生端的分數立刻換成新的數字。
// updateTag 而不是 revalidateTag：Next 16 的 revalidateTag 在 server action
// 裡不會即時生效，同一個 request 之後讀到的還是舊值。
function invalidateExp() {
  revalidatePath("/admin/points")
  updateTag(EXP_TOTALS_TAG)
}

// 分數一律從 formData 重新驗一次。前端的 preset 按鈕與數字鍵盤只是 UI，
// 任何人都可以直接 POST 一個負數或 1e9 過來。
function parseAmount(raw: FormDataEntryValue | null): number | string {
  const text = String(raw ?? "").trim()
  if (!text) return "請選擇或輸入分數"
  if (!/^\d+$/.test(text)) return "分數只能是正整數"

  const amount = Number.parseInt(text, 10)
  if (!Number.isSafeInteger(amount) || amount < EXP_AMOUNT_MIN) {
    return `分數至少要 ${EXP_AMOUNT_MIN} 分（不會有扣分）`
  }
  if (amount > EXP_AMOUNT_MAX) {
    return `一次最多加 ${EXP_AMOUNT_MAX.toLocaleString("en-US")} 分，請確認沒有多按到 0`
  }
  return amount
}

function parseReason(raw: FormDataEntryValue | null): string | null {
  const text = String(raw ?? "").trim()
  if (!text) return null
  return text.slice(0, EXP_REASON_MAX_LENGTH)
}

export async function awardPoints(
  _prevState: AwardState,
  formData: FormData
): Promise<AwardState> {
  // layout 也擋了一層，但權限檢查要放在真的會寫資料的地方
  const session = await requireStaff()

  const regions = formData.getAll("regions").filter(isExpRegion) as ExpRegion[]
  // 同一區被送兩次就會寫兩列、加兩次分
  const unique = [...new Set(regions)]
  if (unique.length === 0) return { ...emptyAward, error: "至少要選一個分區" }

  const amount = parseAmount(formData.get("amount"))
  if (typeof amount === "string") return { ...emptyAward, error: amount }

  const reason = parseReason(formData.get("reason"))

  try {
    await createExpRecords({
      regions: unique,
      amount,
      reason,
      createdBy: session.user.id,
      createdByName: session.user.name,
    })
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error)
    return { ...emptyAward, error: `加分失敗：${text}` }
  }

  invalidateExp()

  return {
    error: null,
    awarded: {
      token: randomUUID(),
      regions: unique.map(expRegionLabel),
      amount,
      reason,
    },
  }
}

export async function editExpRecord(
  _prevState: RecordState,
  formData: FormData
): Promise<RecordState> {
  await requireStaff()

  const id = String(formData.get("id") ?? "").trim()
  if (!id) return { error: "找不到這筆記錄", message: null }

  const region = formData.get("region")
  if (!isExpRegion(region)) return { error: "分區不正確", message: null }

  const amount = parseAmount(formData.get("amount"))
  if (typeof amount === "string") return { error: amount, message: null }

  const reason = parseReason(formData.get("reason"))

  try {
    const updated = await updateExpRecord(id, { region, amount, reason })
    if (!updated) return { error: "這筆記錄已經不在了，請重新整理", message: null }
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error)
    return { error: `修正失敗：${text}`, message: null }
  }

  invalidateExp()
  return { error: null, message: "已修正" }
}

export async function removeExpRecord(
  _prevState: RecordState,
  formData: FormData
): Promise<RecordState> {
  await requireStaff()

  const id = String(formData.get("id") ?? "").trim()
  if (!id) return { error: "找不到這筆記錄", message: null }

  try {
    const deleted = await deleteExpRecord(id)
    if (!deleted) return { error: "這筆記錄已經不在了，請重新整理", message: null }
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error)
    return { error: `刪除失敗：${text}`, message: null }
  }

  invalidateExp()
  return { error: null, message: "已刪除" }
}
