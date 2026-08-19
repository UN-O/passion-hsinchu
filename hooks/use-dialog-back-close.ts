"use client"

import { useEffect, useRef } from "react"

// 讓系統／瀏覽器的返回鍵或返回手勢可以關掉彈出視窗，而不是直接離開頁面
// （在 App 化的 WebView 裡，返回鍵預設行為通常是「離開頁面」，不會自動知道
// 要先關彈窗）。開啟時 push 一筆歷史紀錄；使用者按返回會觸發 popstate，
// 執行 onClose。如果彈窗是被畫面上的按鈕（X／點背景）關掉，順手把剛剛 push
// 的那筆歷史紀錄消耗掉，避免使用者接下來按一次返回鍵卻沒有反應。
export function useDialogBackClose(open: boolean, onClose: () => void) {
  const pushedRef = useRef(false)

  useEffect(() => {
    if (!open) return

    window.history.pushState({ dialog: true }, "")
    pushedRef.current = true

    const handlePopState = () => {
      pushedRef.current = false
      onClose()
    }

    window.addEventListener("popstate", handlePopState)
    return () => {
      window.removeEventListener("popstate", handlePopState)
      if (pushedRef.current) {
        pushedRef.current = false
        window.history.back()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onClose 故意不放進依賴，避免每次重新渲染都重新 push
  }, [open])
}
