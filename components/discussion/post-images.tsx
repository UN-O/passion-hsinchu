"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type { PostImageDTO } from "@/lib/discussion/dto"

// 貼文附圖的顯示。點開的全螢幕檢視跟首頁「宣傳圖文」
// （components/gallery-section.tsx）同一套：左右切換、Esc 關閉。
//
// 列表上的排法則是為了討論串調整過的：所有圖片排成**一列**、高度統一、
// 超過寬度就水平捲動，不換行也不做方格矩陣。理由是貼文是一則接一則往下
// 讀的，一則貼文貼了 10 張圖時如果攤成三欄的格子，會把後面的討論推到很
// 下面；一列縮圖佔的垂直空間是固定的，滑動成本由「想看圖的人」自己付。
//
// 每張縮圖保留自己的長寬比（高度統一、寬度自己算），所以不會被裁掉重點；
// 只有比例極端的圖（長截圖、全景）會被夾在下面的上下限之間。

// 縮圖列的高度。手機 160px、大螢幕 208px——一則貼文的圖不該比它的文字
// 還搶版面，想看細節是點開全螢幕檢視的事。
const ROW_HEIGHT = "h-40 sm:h-52"

// 縮圖的長寬比上下限。太窄的長截圖會變成一條細線、太寬的全景會一張圖就
// 吃掉整列，兩種都夾住（點開之後還是看得到完整比例）。
const MIN_RATIO = 0.6
const MAX_RATIO = 1.9

function clampRatio(width: number, height: number): number {
  if (!width || !height) return 1
  return Math.min(Math.max(width / height, MIN_RATIO), MAX_RATIO)
}

// 一張縮圖。載入前先用同尺寸的骨架佔位，圖片載完再淡進來——不然圖片
// 一張一張跳出來會把底下的內容一直往下推。
function Thumb({ image, onOpen }: { image: PostImageDTO; onOpen: () => void }) {
  const [loaded, setLoaded] = useState(false)

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="放大檢視圖片"
      className={cn("relative shrink-0 overflow-hidden rounded-2xl bg-muted", ROW_HEIGHT)}
      style={{ aspectRatio: clampRatio(image.width, image.height) }}
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

  return (
    <>
      {/* 一列、水平捲動。只有一張圖時同樣走這條路——高度一樣被 ROW_HEIGHT
          夾住，不會因為只有一張就撐滿整個版面。 */}
      <div className="flex gap-2 overflow-x-auto">
        {images.map((image, index) => (
          <Thumb key={image.id} image={image} onOpen={() => setOpenIndex(index)} />
        ))}
      </div>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="圖片放大檢視"
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 sm:p-8"
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

          {/* 放大檢視一律看到整張，不裁切：只給 max-width／max-height，讓
              瀏覽器自己按原比例縮到剛好——直式的圖以高度對齊、橫式的圖以
              寬度對齊。手機上貼齊視窗邊緣（max-h-dvh 用動態視窗高度，才不會
              被 Safari 的網址列吃掉一截）；大螢幕才收進最大寬高裡，不然一張
              大圖會鋪滿整個桌機螢幕。 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[openIndex].url}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-dvh w-auto max-w-full object-contain sm:max-h-[85vh] sm:max-w-3xl sm:rounded-2xl"
          />

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
