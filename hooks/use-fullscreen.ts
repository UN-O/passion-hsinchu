"use client"

import { useCallback, useEffect, useRef, useState } from "react"

export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    setIsSupported(typeof document !== "undefined" && document.fullscreenEnabled === true)
  }, [])

  useEffect(() => {
    const onChange = () => setIsFullscreen(document.fullscreenElement === ref.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  const toggle = useCallback(async () => {
    if (!ref.current) return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await ref.current.requestFullscreen()
      }
    } catch {
      setIsSupported(false)
    }
  }, [])

  return { ref, isSupported, isFullscreen, toggle }
}
