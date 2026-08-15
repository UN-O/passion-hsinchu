import type { Diff, RowError } from "@/lib/enrollment-csv"

// 這些型別與初始值刻意放在 actions.ts 外面。
//
// "use server" 檔案只能匯出 async function：其他 export 會被編譯成
// createServerReference(...)，也就是一個函式，而不是原本的值。之前
// emptyPreview 放在 actions.ts 裡，client 端拿到的初始 state 是個函式，
// 於是 state.errors 是 undefined，畫面一渲染就是
// "Cannot read properties of undefined (reading 'length')"。

export type PreviewState = {
  csv: string
  diff: Diff | null
  errors: RowError[]
  applied: { created: number; updated: number; unchanged: number } | null
  message: string | null
}

export const emptyPreview: PreviewState = {
  csv: "",
  diff: null,
  errors: [],
  applied: null,
  message: null,
}

export type RowState = { error: string | null; message: string | null }
