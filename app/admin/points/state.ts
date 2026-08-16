// 型別與初始 state 刻意放在 actions.ts 外面。
//
// "use server" 檔案只能匯出 async function：其他 export 會被編譯成
// createServerReference(...)，client 端拿到的是一個函式而不是原本的值。
// useActionState 的初始 state 若變成函式，畫面第一次渲染就會炸。
// 詳細的踩坑記錄見 app/admin/enrollment/state.ts。

// 成功時記下這次加了多少分、加給哪幾區，用來畫完成回饋。
export type AwardedSummary = {
  // 每次成功都換一個值，client 端用它判斷「這是不是一筆新的結果」，
  // 才能在連續加分時重新顯示完成畫面。
  token: string
  regions: string[]
  amount: number
  reason: string | null
}

export type AwardState = {
  error: string | null
  awarded: AwardedSummary | null
}

export const emptyAward: AwardState = {
  error: null,
  awarded: null,
}

export type RecordState = {
  error: string | null
  message: string | null
}

export const emptyRecord: RecordState = {
  error: null,
  message: null,
}
