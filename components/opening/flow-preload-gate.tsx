"use client"

import { useEffect, useState } from "react"
import { FadeTransitionOverlay } from "./fade-transition-overlay"
import { LoadingProgressBar } from "./loading-progress-bar"

const PRELOAD_TIMEOUT_MS = 4000

export function FlowPreloadGate({ images, children }: { images: string[]; children: React.ReactNode }) {
  const [loadedCount, setLoadedCount] = useState(0)
  const ready = images.length === 0 || loadedCount >= images.length

  useEffect(() => {
    if (images.length === 0) return

    let cancelled = false
    const settle = () => {
      if (!cancelled) setLoadedCount((count) => count + 1)
    }

    images.forEach((src) => {
      const img = new window.Image()
      img.onload = settle
      img.onerror = settle
      img.src = src
    })

    // 逾時就視為「已載入」放行，避免圖片卡住整個 preload 卡關
    const timeoutId = setTimeout(() => {
      if (!cancelled) setLoadedCount(images.length)
    }, PRELOAD_TIMEOUT_MS)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [images])

  if (!ready) {
    return (
      <>
        <FadeTransitionOverlay active />
        <LoadingProgressBar active={images.length > 0} />
      </>
    )
  }

  return <>{children}</>
}
