"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShareIcon } from "@/components/share-icon"
import { SendIcon } from "@/components/send-icon"

// 心得筆記跟分享目前都還沒有後端可以存，先做成畫面上可以打字、
// 「分享」呼叫瀏覽器原生分享（沒有就退回複製到剪貼簿），
// 「傳送給官方 IG」還沒有真正的目的地，先停用。
// camp、conference 的聚會內容頁共用這個元件。
export function MeetingNotes() {
  const [note, setNote] = useState("")
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ text: note || "我的聚會心得" }).catch(() => {})
      return
    }
    await navigator.clipboard.writeText(note)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-4">
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="寫下這次聚會的心得筆記..."
        rows={6}
        className="w-full resize-none rounded-2xl border border-border bg-transparent p-4 text-base outline-none placeholder:text-muted-foreground"
      />
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1 gap-2" onClick={handleShare}>
          <ShareIcon className="size-4" />
          {copied ? "已複製" : "分享"}
        </Button>
        <Button variant="outline" className="flex-1 gap-2" disabled>
          <SendIcon className="size-4" />
          傳送給官方 IG
        </Button>
      </div>
    </div>
  )
}
