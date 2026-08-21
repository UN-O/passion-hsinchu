import { toBlob } from "html-to-image"

export async function downloadNodeAsImage(node: HTMLElement | null, filename: string) {
  if (!node) return

  // 手機瀏覽器（尤其真機 iOS Safari，桌機的手機模擬模式測不出來）在節點長期
  // opacity-0 藏在背景時，可能悄悄把 canvas 的內容位圖釋放掉——2D context
  // 物件本身還在，但 toDataURL() 讀出來是空的。html-to-image 擷取 canvas
  // 時就是呼叫 toDataURL()，讀到空白就等於整個背景消失。CanvasBackground
  // 監聽 window 的 resize 事件會同步清空＋立刻補畫一次，這裡在擷取前主動
  // 廣播一次 resize，強迫畫面上每個 canvas（包含這個藏起來的匯出卡）在
  // toBlob() 讀取前重新畫一次，不管瀏覽器背地裡對它做了什麼。
  window.dispatchEvent(new Event("resize"))

  const blob = await toBlob(node, { pixelRatio: 2 })
  if (!blob) return

  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
