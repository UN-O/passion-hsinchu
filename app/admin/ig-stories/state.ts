// 型別與初始 state 刻意放在 actions.ts 外面，理由跟 app/admin/points/state.ts
// 完全一樣："use server" 檔案只能匯出 async function，其他 export 會被編譯成
// server reference，useActionState 的初始 state 若變成函式，畫面第一次渲染
// 就會炸。

export type DeleteState = {
  error: string | null
  message: string | null
}

export const emptyDelete: DeleteState = {
  error: null,
  message: null,
}
