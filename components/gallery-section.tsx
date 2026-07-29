"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { galleryImages, socialLinks } from "@/lib/site-config"

export function GallerySection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const showPrev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + galleryImages.length) % galleryImages.length)),
    []
  )
  const showNext = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % galleryImages.length)),
    []
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

  return (
    <section id="gallery" className="border-t border-border px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-sm font-semibold tracking-[0.2em] text-primary">宣傳圖文</h2>

        <div className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
          {galleryImages.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label="放大檢視圖片"
              className="relative aspect-[4/5] overflow-hidden rounded-lg bg-card"
            >
              <Image
                src={src}
                alt="PASSION 26 宣傳圖文"
                fill
                sizes="(min-width: 768px) 25vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover"
              />
            </button>
          ))}

          <Link
            href={socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="relative flex aspect-[4/5] flex-col items-center justify-center gap-1 rounded-lg border border-border bg-card p-4 text-center transition-colors hover:border-primary"
          >
            <span className="text-base font-semibold">追蹤 IG</span>
            <span className="text-sm text-muted-foreground">追蹤 IG 來查看更多相關內容</span>
          </Link>
        </div>
      </div>

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

          <div
            className="relative h-full max-h-[80vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={galleryImages[openIndex]}
              alt="PASSION 26 宣傳圖文"
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>

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
        </div>
      )}
    </section>
  )
}
