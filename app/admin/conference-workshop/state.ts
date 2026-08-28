import type { WorkshopDiff } from "@/lib/conference-workshop-csv"

// 跟 app/admin/enrollment/state.ts 同樣的理由：型別與初始值放在 actions.ts
// 外面，"use server" 檔案裡非函式的 export 會被編譯成 server reference。

export type PreviewState = {
  csv: string
  diff: WorkshopDiff | null
  errors: { lineNumber: number; message: string; raw: string }[]
  applied: { created: number; updated: number } | null
  message: string | null
}

export const emptyPreview: PreviewState = {
  csv: "",
  diff: null,
  errors: [],
  applied: null,
  message: null,
}

export type CapacityState = { error: string | null; message: string | null }
