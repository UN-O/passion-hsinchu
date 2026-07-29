"use client"

import { useEffect, useRef, useState } from "react"
import { useImmersiveNav } from "./immersive-nav-context"

type ImmersiveProgressProps = {
  segments: number
  mode: "auto" | "manual"
  durationMs?: number
  value?: number
  onSegmentComplete?: () => void
}

export function ImmersiveProgress({
  segments,
  mode,
  durationMs = 5000,
  value = 1,
  onSegmentComplete,
}: ImmersiveProgressProps) {
  const { index, paused, next } = useImmersiveNav()
  const [autoFill, setAutoFill] = useState(0)
  const frameRef = useRef(0)
  const startRef = useRef<number | null>(null)
  const elapsedBeforePauseRef = useRef(0)

  useEffect(() => {
    if (mode !== "auto") return
    setAutoFill(0)
    startRef.current = null
    elapsedBeforePauseRef.current = 0
  }, [mode, index, durationMs])

  useEffect(() => {
    if (mode !== "auto") return

    if (paused) {
      if (startRef.current !== null) {
        elapsedBeforePauseRef.current += performance.now() - startRef.current
        startRef.current = null
      }
      return
    }

    const tick = (time: number) => {
      if (startRef.current === null) startRef.current = time
      const elapsed = elapsedBeforePauseRef.current + (time - startRef.current)
      const fraction = Math.min(elapsed / durationMs, 1)
      setAutoFill(fraction)

      if (fraction >= 1) {
        onSegmentComplete?.()
        next()
        return
      }
      frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [mode, paused, durationMs, index, onSegmentComplete, next])

  const activeFill = mode === "auto" ? autoFill : Math.min(Math.max(value, 0), 1)

  return (
    <div className="flex flex-1 gap-1">
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
          <div
            className="h-full bg-primary"
            style={{ width: `${i < index ? 100 : i === index ? activeFill * 100 : 0}%` }}
          />
        </div>
      ))}
    </div>
  )
}
