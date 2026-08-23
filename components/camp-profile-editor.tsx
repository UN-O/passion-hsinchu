"use client"

import { useRef, useState } from "react"
import { Pencil } from "lucide-react"

import { compressAvatar } from "@/lib/avatar-compress"
import { clearAvatar, saveHeroName } from "@/lib/profile-actions"
import { HERO_NAME_MAX_LENGTH } from "@/lib/profile-constants"
import { CAMP_ZONE_META } from "@/lib/camp-zones"
import type { ExpRegion } from "@/lib/exp-regions"

// 個人資料頁的可編輯區塊：大頭貼與勇者名。
//
// 兩個欄位各自獨立儲存（不是一個大表單按一次送出）——改名字跟換頭像是兩件
// 不相干的事，混在一起只會讓「我只是想換張照片」也要多按一次儲存。
export function CampProfileEditor({
  initialHeroName,
  initialAvatarUrl,
  initialAvatarSource,
  fallbackAvatarUrl,
  zone,
}: {
  initialHeroName: string
  initialAvatarUrl: string | null
  initialAvatarSource: "upload" | "google" | null
  // 沒有頭像時顯示的預設圖（姓名第一個字），由伺服器端算好傳進來
  fallbackAvatarUrl: string
  zone: ExpRegion | null
}) {
  const [heroName, setHeroName] = useState(initialHeroName)
  const [draftName, setDraftName] = useState(initialHeroName)
  const [editingName, setEditingName] = useState(false)
  const [namePending, setNamePending] = useState(false)

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl)
  const [avatarSource, setAvatarSource] = useState(initialAvatarSource)
  const [avatarStatus, setAvatarStatus] = useState<"idle" | "processing" | "uploading">("idle")
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    setError(null)
    try {
      setAvatarStatus("processing")
      const blob = await compressAvatar(file)

      setAvatarStatus("uploading")
      const form = new FormData()
      form.append("avatar", blob, blob.type === "image/webp" ? "avatar.webp" : "avatar.jpg")
      const response = await fetch("/api/profile/avatar", { method: "POST", body: form })
      const payload = (await response.json()) as { ok: true; url: string } | { ok: false; error: string }

      if (!response.ok || !payload.ok) {
        setError(payload.ok ? "上傳失敗" : payload.error)
        return
      }
      setAvatarUrl(payload.url)
      setAvatarSource("upload")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "圖片處理失敗")
    } finally {
      setAvatarStatus("idle")
    }
  }

  async function handleRemoveAvatar() {
    setError(null)
    setAvatarStatus("uploading")
    const result = await clearAvatar()
    if (result.ok) {
      // 移除自己上傳的那張之後要退回 Google 頭像或姓名第一個字——那是
      // 伺服器端的優先序（見 lib/profile.ts），整頁重新載入拿正確結果，
      // 不在前端自己猜一次。
      window.location.reload()
      return
    }
    setError(result.error)
    setAvatarStatus("idle")
  }

  async function handleSaveName() {
    const trimmed = draftName.trim()
    if (!trimmed || namePending) return
    setError(null)
    setNamePending(true)
    const result = await saveHeroName(trimmed)
    if (result.ok) {
      setHeroName(result.data)
      setEditingName(false)
    } else {
      setError(result.error)
    }
    setNamePending(false)
  }

  const busy = avatarStatus !== "idle"

  return (
    <div className="flex w-full flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className="size-40 overflow-hidden rounded-full border border-border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element -- 頭像來自站上的讀取端點、Google 或 data URI */}
            <img src={avatarUrl ?? fallbackAvatarUrl} alt="勇者頭像" className="size-full object-cover" />
          </div>

          {busy && (
            <div className="absolute inset-0 flex items-end justify-center rounded-full bg-background/70 pb-6">
              <span className="animate-pulse text-xs text-muted-foreground">
                {avatarStatus === "processing" ? "處理中" : "上傳中"}
              </span>
            </div>
          )}
        </div>

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

        <div className="flex items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="font-medium text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {avatarSource === "upload" ? "更換照片" : "上傳照片"}
          </button>
          {avatarSource === "upload" && (
            <button
              type="button"
              onClick={handleRemoveAvatar}
              disabled={busy}
              className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              移除
            </button>
          )}
        </div>
      </div>

      <div className="flex w-full max-w-xs flex-col gap-1">
        <p className="text-sm text-muted-foreground">勇者姓名</p>

        {editingName ? (
          <div className="flex flex-col gap-3">
            <input
              autoFocus
              value={draftName}
              onChange={(e) => setDraftName(e.target.value.slice(0, HERO_NAME_MAX_LENGTH))}
              placeholder="輸入你的勇者名"
              className="w-full rounded-full border border-border bg-transparent px-4 py-2 text-center text-base outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-center gap-4 text-sm">
              <button
                type="button"
                onClick={() => {
                  setDraftName(heroName)
                  setEditingName(false)
                }}
                disabled={namePending}
                className="text-muted-foreground hover:text-foreground"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveName}
                disabled={namePending || !draftName.trim()}
                className="font-semibold text-primary disabled:opacity-40"
              >
                儲存
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            {/* 分區徽章的高度＝旁邊那行字的字級（1em），跟討論區的
                ZoneBadge 同一套做法 */}
            <p className="flex items-center gap-1.5 text-2xl font-bold">
              {heroName}
              {zone && (
                // eslint-disable-next-line @next/next/no-img-element -- 尺寸跟著字級走（1em），next/image 需要固定尺寸
                <img
                  src={CAMP_ZONE_META[zone].icon}
                  alt={CAMP_ZONE_META[zone].title}
                  className="inline-block h-[1em] w-auto align-middle"
                />
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                setDraftName(heroName)
                setEditingName(true)
              }}
              aria-label="修改勇者名"
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil className="size-4" strokeWidth={1.75} />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
