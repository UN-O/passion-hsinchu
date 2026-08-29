"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { DinnerMealType } from "@/lib/conference-dinner"
import { downloadDinnerRosterImages, renderDinnerRosterSlides, type DinnerRosterData } from "@/lib/export-dinner-roster"

const COLUMN_OPTIONS = [1, 2, 3] as const
const MEAL_TYPE_LABELS: Record<DinnerMealType, string> = { meat: "葷食", veggie: "素食" }

// 「下載名單圖片」跟「下載簽到表」共用同一支對話框（跟工作坊名單那支
// roster-image-dialog.tsx 同一套做法：開對話框先抓一次名單資料，依欄數
// 即時重畫預覽，下載才真的產生檔案），差別只在 withCheckColumn 要不要
// 多畫「是否領取」欄，不用另外做一支重複的對話框。
export function DinnerRosterImageDialog({
  mealType,
  withCheckColumn,
}: {
  mealType: DinnerMealType
  withCheckColumn: boolean
}) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<DinnerRosterData | null>(null)
  const [columns, setColumns] = useState<number>(2)
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openDialog() {
    setOpen(true)
    setError(null)
    if (data) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/conference-dinner/roster?mealType=${mealType}&format=json`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? "讀取名單失敗")
      setData({
        mealLabel: json.mealLabel,
        dateLabel: json.dateLabel,
        timeLabel: json.timeLabel,
        location: json.location,
        roster: json.roster,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "讀取名單失敗")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!data) return
    let cancelled = false

    async function renderPreview() {
      setLoading(true)
      try {
        const canvases = await renderDinnerRosterSlides(data!, { columns, withCheckColumn })
        if (cancelled) return
        setPreviewUrls(canvases.map((c) => c.toDataURL("image/png")))
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "產生預覽失敗")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    renderPreview()

    return () => {
      cancelled = true
    }
  }, [data, columns, withCheckColumn])

  async function handleDownload() {
    if (!data) return
    setDownloading(true)
    try {
      await downloadDinnerRosterImages(data, `dinner-${mealType}${withCheckColumn ? "-checkin" : ""}`, {
        columns,
        withCheckColumn,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "下載失敗")
    } finally {
      setDownloading(false)
    }
  }

  const label = withCheckColumn
    ? `下載簽到表（${MEAL_TYPE_LABELS[mealType]}）`
    : `下載名單圖片（${MEAL_TYPE_LABELS[mealType]}）`

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-w-[calc(100%-2rem)] flex-col gap-0 rounded-3xl border-none bg-card p-0 sm:max-w-2xl"
        >
          <DialogTitle className="sr-only">{withCheckColumn ? "簽到表預覽" : "名單圖片預覽"}</DialogTitle>
          <div className="flex items-center justify-between p-6 pb-0">
            <p className="text-xl font-bold">{withCheckColumn ? "簽到表預覽" : "名單圖片預覽"}</p>
            <DialogClose className="text-white/80 hover:text-white">
              <span aria-hidden>✕</span>
              <span className="sr-only">關閉</span>
            </DialogClose>
          </div>

          <div className="flex flex-col gap-4 p-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">欄數</span>
              {COLUMN_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setColumns(n)}
                  className="rounded-full border px-3 py-1 text-sm"
                  style={{
                    borderColor: columns === n ? "var(--primary)" : "var(--border)",
                    color: columns === n ? "var(--primary)" : undefined,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              {loading && previewUrls.length === 0 && (
                <p className="py-12 text-sm text-muted-foreground">產生預覽中…</p>
              )}
              {previewUrls.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- 預覽圖是動態產生的 data URL，next/image 不適用
                <img
                  key={i}
                  src={url}
                  alt={`名單投影片 ${i + 1}`}
                  className="aspect-video w-full max-w-md shrink-0 rounded-xl border border-border"
                />
              ))}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="button" size="lg" disabled={!data || downloading || loading} onClick={handleDownload}>
              {downloading
                ? "下載中…"
                : previewUrls.length > 1
                  ? `下載全部（${previewUrls.length} 張，zip）`
                  : "下載"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
