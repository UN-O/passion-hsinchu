"use client"

import { useState } from "react"

import { BibleQuotePicker } from "@/components/bible/bible-quote-picker"

// Quote 模式的預覽——composer 裡實際的樣子（見
// components/discussion/composer-overlay.tsx），這裡只是拉出來單獨看，
// 底下這個 textarea 模擬「內文」，插入之後看得到文字真的被塞進去。
export function QuoteDemo() {
  const [content, setContent] = useState("")

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="這裡模擬回覆的內文，按下面「加經文」插入試試"
        className="h-32 w-full resize-none rounded-2xl border border-border bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground"
      />
      <div className="flex flex-wrap gap-2">
        <BibleQuotePicker onInsert={(text) => setContent((prev) => (prev ? `${prev}\n\n${text}` : text))} />
      </div>
    </div>
  )
}
