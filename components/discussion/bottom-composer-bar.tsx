"use client"

import { Maximize2 } from "lucide-react"

type BottomComposerBarProps = {
  placeholder: string
  onOpen: () => void
}

// 固定在畫面最底部、寬度吃滿整個 viewport（fixed 定位天生會跳出父層
// max-w 容器的限制，不用另外處理）。只有放大 icon 是按鈕、會開啟回覆框
// ——文字那塊只是佔位提示，不是觸控目標，按下去沒反應是預期的。
export function BottomComposerBar({ placeholder, onOpen }: BottomComposerBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="flex w-full items-center justify-between gap-3 px-4 py-5">
        <span className="text-base text-muted-foreground">{placeholder}</span>
        <button
          type="button"
          onClick={onOpen}
          aria-label="開始留言"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Maximize2 className="size-5" />
        </button>
      </div>
    </div>
  )
}
