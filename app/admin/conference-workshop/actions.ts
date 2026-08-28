"use server"

import { revalidatePath } from "next/cache"

import {
  applyImportedRegistrations,
  getAllRegistrationsForDiff,
  setWorkshopCapacity,
} from "@/lib/conference-workshop"
import { diffWorkshopRegistrations, parseWorkshopCsv, toImportEntries } from "@/lib/conference-workshop-csv"
import { getAllForDiff } from "@/lib/enrollment"
import { requireStaff } from "@/lib/session"
import type { ConferenceWorkshopRound } from "@/lib/opening-conference-content"
import { emptyPreview, type CapacityState, type PreviewState } from "./state"

// 第一階段：只解析與比對，不寫入
export async function previewWorkshopCsv(_prevState: PreviewState, formData: FormData): Promise<PreviewState> {
  await requireStaff()

  const file = formData.get("file")
  let csv = String(formData.get("csv") ?? "")
  if (file instanceof File && file.size > 0) csv = await file.text()

  if (!csv.trim()) {
    return { ...emptyPreview, message: "請貼上 CSV 內容或選擇檔案" }
  }

  const { rows, errors } = parseWorkshopCsv(csv)
  if (rows.length === 0) {
    return { csv, diff: null, errors, applied: null, message: "沒有任何可匯入的資料" }
  }

  const [enrollments, existing] = await Promise.all([getAllForDiff(), getAllRegistrationsForDiff()])
  return { csv, diff: diffWorkshopRegistrations(rows, enrollments, existing), errors, applied: null, message: null }
}

// 第二階段：重新解析同一份內容後才寫入，跟 app/admin/enrollment 同一個兩段式做法。
export async function confirmWorkshopCsv(_prevState: PreviewState, formData: FormData): Promise<PreviewState> {
  await requireStaff()

  const csv = String(formData.get("csv") ?? "")
  const { rows, errors } = parseWorkshopCsv(csv)
  if (rows.length === 0) {
    return { csv, diff: null, errors, applied: null, message: "沒有任何可匯入的資料" }
  }

  const [enrollments, existing] = await Promise.all([getAllForDiff(), getAllRegistrationsForDiff()])
  const diff = diffWorkshopRegistrations(rows, enrollments, existing)
  const entries = toImportEntries(diff)
  await applyImportedRegistrations(entries)

  revalidatePath("/admin/conference-workshop")
  return {
    csv: "",
    diff: null,
    errors,
    applied: { created: diff.createCount, updated: diff.updateCount },
    message: `已匯入：新增 ${diff.createCount} 筆、更新 ${diff.updateCount} 筆、未變更 ${diff.unchangedCount} 筆${
      diff.unmatchedCount > 0 ? `、名冊比對不到 ${diff.unmatchedCount} 筆（未匯入）` : ""
    }`,
  }
}

// 後台設定單一工作坊＋場次的人數上限。capacity 是空字串代表清成不限。
export async function saveCapacity(_prevState: CapacityState, formData: FormData): Promise<CapacityState> {
  await requireStaff()

  const workshopId = String(formData.get("workshopId") ?? "")
  const round = String(formData.get("round") ?? "") as ConferenceWorkshopRound
  const raw = String(formData.get("capacity") ?? "").trim()

  if (!workshopId || (round !== "R1" && round !== "R2")) {
    return { error: "缺少工作坊或場次", message: null }
  }

  if (!raw) {
    await setWorkshopCapacity(workshopId, round, null)
    revalidatePath("/admin/conference-workshop")
    return { error: null, message: "已清成不限人數" }
  }

  const capacity = Number(raw)
  if (!Number.isInteger(capacity) || capacity < 0) {
    return { error: "人數上限要是 0 或正整數", message: null }
  }

  await setWorkshopCapacity(workshopId, round, capacity)
  revalidatePath("/admin/conference-workshop")
  return { error: null, message: "已更新" }
}
