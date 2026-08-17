"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"

function subscribeNever() {
  return () => {}
}

function getFullscreenSupported() {
  return typeof document !== "undefined" && document.fullscreenEnabled === true
}

function getFullscreenSupportedServer() {
  return false
}

export function useFullscreen<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const detectedSupport = useSyncExternalStore(subscribeNever, getFullscreenSupported, getFullscreenSupportedServer)
  const [unsupported, setUnsupported] = useState(false)
  const isSupported = detectedSupport && !unsupported
  const [isFullscreen, setIsFullscreen] = useState(false)

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
      setUnsupported(true)
    }
  }, [])

  return { ref, isSupported, isFullscreen, toggle }
}
