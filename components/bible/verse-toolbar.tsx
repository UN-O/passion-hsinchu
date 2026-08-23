"use client"

import { Copy, Highlighter, GitCompare, X } from "lucide-react"

import { cn } from "@/lib/utils"

// 選到經文之後跳出來的動作列。手機收在畫面最底下（fixed），電腦是貼齊
// 卡片右下角的浮動列（absolute，卡片本身要是 relative）——不做真的跟著滑鼠
// 位置跑的 tooltip 定位，那套邏輯很容易在捲動/縮放時錯位，貼齊卡片角落
// 簡單很多，也還是「浮動」的視覺效果。
export function VerseToolbar({
  count,
  onHighlight,
  onCopy,
  onCompare,
  onClear,
}: {
  count: number
  onHighlight: () => void
  onCopy: () => void
  onCompare: () => void
  onClear: () => void
}) {
  if (count === 0) return null

  return (
    <>
      {/* 手機：畫面最底下的 fixed 功能表。z-50 要蓋過 bottom-composer-bar.tsx
          那顆同樣 fixed 在最底下的留言列（z-40）——兩個一起出現時，選經文
          的動作列要贏，不然點下去的其實是被蓋住的留言列，看起來就像完全
          點不動。 */}
      <div className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-between gap-2 border-t border-border bg-background p-3 sm:hidden">
        <ToolbarButtons onHighlight={onHighlight} onCopy={onCopy} onCompare={onCompare} count={count} />
        <button
          type="button"
          onClick={onClear}
          aria-label="取消選取"
          className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      {/* 電腦：貼齊卡片右下角的浮動列。同樣拉高 z-index——卡片如果剛好貼近
          畫面底部，也會被 bottom-composer-bar.tsx 蓋住。 */}
      <div className="absolute bottom-3 right-3 z-50 hidden items-center gap-1 rounded-full border border-border bg-card p-1 sm:flex">
        <ToolbarButtons onHighlight={onHighlight} onCopy={onCopy} onCompare={onCompare} count={count} compact />
        <button
          type="button"
          onClick={onClear}
          aria-label="取消選取"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </div>
    </>
  )
}

function ToolbarButtons({
  onHighlight,
  onCopy,
  onCompare,
  count,
  compact,
}: {
  onHighlight: () => void
  onCopy: () => void
  onCompare: () => void
  count: number
  compact?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-1", !compact && "flex-1 justify-around")}>
      <ToolbarButton icon={Highlighter} label="標記" onClick={onHighlight} compact={compact} />
      <ToolbarButton icon={Copy} label="複製" onClick={onCopy} compact={compact} />
      <ToolbarButton icon={GitCompare} label="比較版本" onClick={onCompare} compact={compact} />
      {!compact && <span className="text-xs text-muted-foreground">已選 {count} 節</span>}
    </div>
  )
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  compact,
}: {
  icon: typeof Copy
  label: string
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-full text-muted-foreground hover:text-foreground",
        compact ? "size-8" : "flex-col px-3 py-1 text-xs"
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
      {!compact && label}
    </button>
  )
}
