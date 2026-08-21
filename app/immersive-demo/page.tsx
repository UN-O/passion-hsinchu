"use client"

import { useState } from "react"
import { ImmersiveScreen } from "@/components/immersive/immersive-screen"
import { useImmersiveNav } from "@/components/immersive/immersive-nav-context"
import type { ImmersiveBackgroundConfig } from "@/components/immersive/immersive-background"

const slides = [
  { title: "第一則", body: "左右點擊或滑動可以切換，長按會暫停自動進度。" },
  { title: "第二則", body: "這是手動控制進度條的示範內容。" },
  { title: "第三則", body: "背景可以換成圖片、shader 或 canvas 動畫。" },
]

function SlideContent() {
  const { index, next, prev } = useImmersiveNav()
  const slide = slides[index] ?? slides[0]

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm tracking-[0.2em] text-white/60">
        {index + 1} / {slides.length}
      </p>
      <h2 className="text-2xl font-bold">{slide.title}</h2>
      <p className="max-w-sm text-white/80">{slide.body}</p>
      <div className="relative z-30 flex gap-3">
        <button
          type="button"
          onClick={prev}
          className="rounded-full border border-white/30 px-4 py-2 text-sm"
        >
          上一則
        </button>
        <button
          type="button"
          onClick={next}
          className="rounded-full border border-white/30 px-4 py-2 text-sm"
        >
          下一則
        </button>
      </div>
    </div>
  )
}

const backgroundOptions = [
  { key: "shader", label: "Shader Gradient" },
  { key: "canvas", label: "Canvas 動畫" },
  { key: "image", label: "圖片" },
] as const

export default function ImmersiveDemoPage() {
  const [backgroundKey, setBackgroundKey] = useState<(typeof backgroundOptions)[number]["key"]>(
    "shader"
  )
  const [mode, setMode] = useState<"auto" | "manual">("manual")

  const background: ImmersiveBackgroundConfig =
    backgroundKey === "shader"
      ? { type: "shader", colors: ["#f6ed8e", "#1a1a2e", "#0f0f1a"] }
      : backgroundKey === "canvas"
        ? { type: "canvas" }
        : { type: "image", src: "/images/passion-logo.webp", alt: "demo" }

  return (
    <div className="min-h-svh bg-background">
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        {backgroundOptions.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setBackgroundKey(option.key)}
            className={
              backgroundKey === option.key
                ? "rounded-full border border-primary px-3 py-1.5 text-sm font-medium text-primary"
                : "rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground"
            }
          >
            {option.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMode(mode === "auto" ? "manual" : "auto")}
          className="ml-auto rounded-full border border-border px-3 py-1.5 text-sm text-muted-foreground"
        >
          進度條模式：{mode === "auto" ? "自動計時" : "手動"}
        </button>
      </div>

      <ImmersiveScreen background={background} totalSteps={slides.length} progress={{ mode, durationMs: 4000, value: 1 }}>
        <SlideContent />
      </ImmersiveScreen>
    </div>
  )
}
