"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { compressIgStory } from "@/lib/ig-story-compress"

// 上傳走 fetch 打 API route，不是 server action：server action 不適合處理
// 這種二進位的 File payload（跟大頭貼／討論區附圖同一個理由，見那兩邊的
// route.ts）。壓縮（縮到長邊 1600、轉 webp）在瀏覽器端做完才送出。
export function IgStoryUploadForm() {
  const router = useRouter()
  const [status, setStatus] = useState<"idle" | "processing" | "uploading">("idle")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    try {
      setStatus("processing")
      const blob = await compressIgStory(file)

      setStatus("uploading")
      const form = new FormData()
      form.append("image", blob, "ig-story.webp")
      const response = await fetch("/api/ig-stories", { method: "POST", body: form })
      const payload = (await response.json()) as { ok: true } | { ok: false; error: string }

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "上傳失敗" : payload.error)
        return
      }
      // 列表是伺服器端渲染的（見 page.tsx），上傳成功後重新整理這頁的資料
      // 才會看到新的一張，不用整頁重新載入。
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "圖片處理失敗")
    } finally {
      setStatus("idle")
    }
  }

  const busy = status !== "idle"

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void handleFile(file)
          event.target.value = ""
        }}
      />

      <Button
        type="button"
        size="xl"
        className="w-full sm:w-auto"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {status === "processing" ? "處理中…" : status === "uploading" ? "上傳中…" : "上傳限動截圖"}
      </Button>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
