"use client"

import { useEffect, useRef } from "react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

export type CanvasDrawFrame = { width: number; height: number; time: number }
export type CanvasDraw = (ctx: CanvasRenderingContext2D, frame: CanvasDrawFrame) => void

const defaultDraw: CanvasDraw = (ctx, { width, height, time }) => {
  ctx.fillStyle = "#000000"
  ctx.fillRect(0, 0, width, height)

  const dotCount = 40
  for (let i = 0; i < dotCount; i++) {
    const seed = i * 137.5
    const drift = (i % 5) - 2
    const x = (((Math.sin(seed) * 0.5 + 0.5) * width) + time * 0.01 * drift + width) % width
    const y = (((Math.cos(seed) * 0.5 + 0.5) * height) + time * 0.008 * drift + height) % height
    ctx.beginPath()
    ctx.arc(x, y, 1 + (i % 4), 0, Math.PI * 2)
    ctx.fillStyle = "rgba(255,255,255,0.15)"
    ctx.fill()
  }
}

export type CanvasBackgroundProps = {
  draw?: CanvasDraw
}

export function CanvasBackground({ draw = defaultDraw }: CanvasBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2)
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener("resize", resize)

    const renderAt = (elapsed: number) =>
      draw(ctx, { width: canvas.clientWidth, height: canvas.clientHeight, time: elapsed })

    if (reducedMotion) {
      renderAt(0)
      return () => window.removeEventListener("resize", resize)
    }

    let frameId = 0
    let elapsedBeforePause = 0
    let start: number | null = null

    const loop = (time: number) => {
      if (start === null) start = time
      renderAt(elapsedBeforePause + (time - start))
      frameId = requestAnimationFrame(loop)
    }

    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frameId)
        if (start !== null) elapsedBeforePause += performance.now() - start
        start = null
      } else {
        frameId = requestAnimationFrame(loop)
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)
    frameId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener("resize", resize)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [draw, reducedMotion])

  return <canvas ref={canvasRef} className="h-full w-full" />
}
