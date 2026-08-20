"use client"

import { Maximize2 } from "lucide-react"

type BottomComposerBarProps = {
  placeholder: string
  onOpen: () => void
}

// 固定在畫面最底部、寬度吃滿整個 viewport（fixed 定位天生會跳出父層
// max-w 容器的限制，不用另外處理）。整條 bar 都可以點，不是只有右邊
// 那個展開圖示——手機上大範圍的點擊區域比較不會按不到。
export function BottomComposerBar({ placeholder, onOpen }: BottomComposerBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="text-base text-muted-foreground">{placeholder}</span>
        <Maximize2 className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  )
}
