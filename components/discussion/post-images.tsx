"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { PostImageDTO } from "@/lib/discussion/dto"

// 貼文附圖的顯示。排版跟首頁「宣傳圖文」（components/gallery-section.tsx）
// 同一套：方格縮圖 + 點開全螢幕檢視，左右切換、Esc 關閉。
//
// 兩個差別是為了討論串的情境：
//   1. 只有一張圖時不切方格，用圖片本身的比例（貼一張截圖時被裁成正方形
//      通常就看不到重點了）。
//   2. 縮圖跟原圖是兩個不同的檔案（見 lib/discussion/images.ts）——列表載
//      480px 的縮圖，放大檢視才載 1600px 的原圖。

// 載入前先用同尺寸的骨架佔位，圖片載完再換掉——不然圖片一張一張跳出來
// 會把底下的內容一直往下推。
function Thumb({
  image,
  className,
  ratio,
  onOpen,
}: {
  image: PostImageDTO
  className?: string
  ratio?: string
  onOpen: () => void
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="放大檢視圖片"
      className={cn("relative overflow-hidden rounded-2xl bg-muted", className)}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      {!loaded && <span className="absolute inset-0 animate-pulse bg-muted" aria-hidden />}
      {/* 圖片來自站上的讀取端點（會驗權限），不是本地靜態資源，next/image
          在這裡沒有優化空間（專案本來就設定 images.unoptimized）。 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.thumbUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={cn("size-full object-cover transition-opacity", loaded ? "opacity-100" : "opacity-0")}
      />
    </button>
  )
}

export function PostImages({ images }: { images: PostImageDTO[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const showPrev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)),
    [images.length]
  )
  const showNext = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % images.length)),
    [images.length]
  )

  useEffect(() => {
    if (openIndex === null) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close()
      if (e.key === "ArrowLeft") showPrev()
      if (e.key === "ArrowRight") showNext()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [openIndex, close, showPrev, showNext])

  if (images.length === 0) return null

  const single = images.length === 1 ? images[0] : null

  return (
    <>
      {single ? (
        <Thumb
          image={single}
          onOpen={() => setOpenIndex(0)}
          className="w-full"
          // 極端長寬比的圖（長截圖、全景）夾在 3:4 到 16:9 之間，不讓一張圖
          // 佔掉整個畫面；點開之後看得到完整比例。
          ratio={`${single.width} / ${Math.min(Math.max(single.height, single.width * 0.5625), single.width * 1.34)}`}
        />
      ) : (
        <div className={cn("grid gap-2", images.length === 2 ? "grid-cols-2" : "grid-cols-3")}>
          {images.map((image, index) => (
            <Thumb key={image.id} image={image} onOpen={() => setOpenIndex(index)} className="aspect-square" />
          ))}
        </div>
      )}

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="圖片放大檢視"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 px-4 py-8"
          onClick={close}
        >
          <button
            type="button"
            aria-label="關閉"
            onClick={close}
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-foreground/40"
          >
            <X className="size-5" />
          </button>

          {images.length > 1 && (
            <button
              type="button"
              aria-label="上一張"
              onClick={(e) => {
                e.stopPropagation()
                showPrev()
              }}
              className="absolute left-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-foreground/40 sm:left-4"
            >
              <ChevronLeft className="size-5" />
            </button>
          )}

          <div className="flex max-h-[80vh] w-full max-w-3xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[openIndex].url}
              alt=""
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain"
            />
          </div>

          {images.length > 1 && (
            <button
              type="button"
              aria-label="下一張"
              onClick={(e) => {
                e.stopPropagation()
                showNext()
              }}
              className="absolute right-2 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-foreground/40 sm:right-4"
            >
              <ChevronRight className="size-5" />
            </button>
          )}

          {images.length > 1 && (
            <span className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground">
              {openIndex + 1} / {images.length}
            </span>
          )}
        </div>
      )}
    </>
  )
}
