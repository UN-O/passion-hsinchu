"use client"

import { useEffect, useState } from "react"

import { cn } from "@/lib/utils"
import type { LinkPreviewDTO } from "@/lib/discussion/dto"
import { loadLinkPreview } from "@/lib/discussion/actions"
import { splitContentByUrls } from "@/lib/discussion/links"

// 內文渲染：一般文字照舊，網址變成真的可以點的 <a>（能另開分頁、能複製
// 網址）。呼叫端把內文放在「點一下進討論串頁」的區塊裡，所以這裡要擋掉
// 冒泡，不然點外部連結會同時觸發導頁。
export function ContentWithLinks({ content }: { content: string }) {
  return (
    <p className="whitespace-pre-wrap text-sm">
      {splitContentByUrls(content).map((segment, index) =>
        segment.kind === "text" ? (
          <span key={index}>{segment.value}</span>
        ) : (
          <a
            key={index}
            href={segment.value}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={(e) => e.stopPropagation()}
            className="break-all text-primary underline underline-offset-2"
          >
            {segment.value}
          </a>
        )
      )}
    </p>
  )
}

// 連結預覽卡片。伺服器端只從快取撈（列表要立刻回得出來），所以沒抓過的
// 連結第一次看到時 initial 會是 null——這時候自己打一次 server action，
// 期間顯示骨架，抓完之後那個網址就進快取，之後所有人都直接拿到。
export function LinkCard({ url, initial }: { url: string; initial: LinkPreviewDTO | null }) {
  // 包一層物件而不是直接存 DTO：這樣才分得出「還沒抓完」跟「抓完了，但這個
  // 連結做不出卡片」——兩者都是 null，但前者要顯示骨架、後者要整塊不顯示。
  const [fetched, setFetched] = useState<{ value: LinkPreviewDTO | null } | null>(null)

  useEffect(() => {
    // 伺服器端已經給了快取的結果就不用再問一次。
    if (initial) return

    let active = true
    loadLinkPreview(url).then((result) => {
      if (active) setFetched({ value: result.ok ? result.data : null })
    })
    return () => {
      active = false
    }
  }, [url, initial])

  const preview = initial ?? fetched?.value ?? null
  const loading = !initial && fetched === null

  // 抓完發現做不出卡片（連不上、沒有 og 標籤）就整塊不顯示——內文裡的
  // 連結本來就還是可以點。
  if (!preview) {
    if (!loading) return null
    // 還在抓：先放一塊跟卡片差不多高的骨架，卡片出現時版面不會跳一大塊。
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
        <div className="size-16 shrink-0 animate-pulse rounded-xl bg-muted" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="h-3 w-1/3 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
        </div>
      </div>
    )
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex overflow-hidden rounded-2xl border border-border transition-colors hover:border-foreground/40",
        // 有圖：圖在左邊、文字在右邊（一列的高度固定，不會因為某則貼文的
        // 卡片特別高而讓討論串長短不一）。
        preview.imageUrl ? "items-stretch" : "flex-col"
      )}
    >
      {preview.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- 來自站上的讀取端點，不是本地靜態資源
        <img
          src={preview.imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-24 shrink-0 bg-muted object-cover"
        />
      )}

      <div className="flex min-w-0 flex-col justify-center gap-1 px-3 py-2.5">
        <span className="truncate text-xs text-muted-foreground">{preview.siteName ?? preview.host}</span>
        {preview.title && <span className="line-clamp-2 text-sm font-medium">{preview.title}</span>}
        {preview.description && (
          <span className="line-clamp-2 text-xs text-muted-foreground">{preview.description}</span>
        )}
      </div>
    </a>
  )
}
