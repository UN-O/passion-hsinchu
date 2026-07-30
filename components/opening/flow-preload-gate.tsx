"use client"

import { useEffect, useState } from "react"
import { FadeTransitionOverlay } from "./fade-transition-overlay"
import { LoadingProgressBar } from "./loading-progress-bar"

const PRELOAD_TIMEOUT_MS = 4000

export function FlowPreloadGate({ images, children }: { images: string[]; children: React.ReactNode }) {
  const [loadedCount, setLoadedCount] = useState(0)
  const [ready, setReady] = useState(images.length === 0)

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

    const timeoutId = setTimeout(() => {
      if (!cancelled) setReady(true)
    }, PRELOAD_TIMEOUT_MS)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [images])

  useEffect(() => {
    if (images.length > 0 && loadedCount >= images.length) setReady(true)
  }, [images, loadedCount])

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
