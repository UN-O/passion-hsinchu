"use client"

import { useRef } from "react"
import { useImmersiveNav } from "./immersive-nav-context"

const SWIPE_THRESHOLD_PX = 50
const HOLD_TO_PAUSE_MS = 200

type TapZonesProps = {
  enableTap?: boolean
  enableSwipe?: boolean
}

export function TapZones({ enableTap = true, enableSwipe = true }: TapZonesProps) {
  const { next, prev, pause, resume } = useImmersiveNav()
  const startXRef = useRef<number | null>(null)
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const heldRef = useRef(false)

  const clearHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }

  const handlePointerDown = (event: React.PointerEvent) => {
    startXRef.current = event.clientX
    heldRef.current = false
    holdTimerRef.current = setTimeout(() => {
      heldRef.current = true
      pause()
    }, HOLD_TO_PAUSE_MS)
  }

  const handlePointerUp = (event: React.PointerEvent, zone: "prev" | "next") => {
    const wasHolding = heldRef.current
    clearHold()
    resume()

    if (enableSwipe && startXRef.current !== null) {
      const deltaX = event.clientX - startXRef.current
      startXRef.current = null
      if (Math.abs(deltaX) > SWIPE_THRESHOLD_PX) {
        if (deltaX < 0) next()
        else prev()
        return
      }
    }

    if (enableTap && !wasHolding) {
      if (zone === "next") next()
      else prev()
    }
  }

  const handlePointerLeave = () => {
    clearHold()
    resume()
    startXRef.current = null
  }

  if (!enableTap && !enableSwipe) return null

  return (
    <div className="absolute inset-0 z-20 flex">
      <button
        type="button"
        aria-label="上一頁熱區"
        className="h-full w-1/2 outline-none"
        onPointerDown={handlePointerDown}
        onPointerUp={(event) => handlePointerUp(event, "prev")}
        onPointerLeave={handlePointerLeave}
      />
      <button
        type="button"
        aria-label="下一頁熱區"
        className="h-full w-1/2 outline-none"
        onPointerDown={handlePointerDown}
        onPointerUp={(event) => handlePointerUp(event, "next")}
        onPointerLeave={handlePointerLeave}
      />
    </div>
  )
}
