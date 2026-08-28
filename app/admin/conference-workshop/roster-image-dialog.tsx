"use client"

import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { downloadWorkshopRosterImages, renderWorkshopRosterSlides, type WorkshopRosterData } from "@/lib/export-workshop-roster"
import { workshopDateLabel, workshopRoundTimeLabels, type ConferenceWorkshopRound } from "@/lib/opening-conference-content"

const COLUMN_OPTIONS = [2, 3, 4] as const

// 「下載名單（圖片）」不是點了就直接下載，而是先開一個對話框：抓一次
// 名單資料、依目前欄數設定畫出預覽，讓工作人員在真的下載之前先看到
// 投影片長怎樣、調整欄數。多張投影片一次下載是打包成 zip（等同「整個
// 資料夾下載」，見 lib/export-workshop-roster.ts 的說明），不是逐張跳出
// 多次下載視窗。
export function RosterImageDialog({
  workshopId,
  round,
}: {
  workshopId: string
  round: ConferenceWorkshopRound
}) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<WorkshopRosterData | null>(null)
  const [columns, setColumns] = useState<number>(4)
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
      const res = await fetch(`/api/admin/conference-workshop/roster?workshopId=${workshopId}&round=${round}`)
      const json = await res.json()
      if (!json.ok) throw new Error(json.error ?? "讀取名單失敗")
      setData({
        title: json.workshop.title,
        speaker: json.workshop.speaker,
        location: json.workshop.location,
        roundLabel: json.roundLabel,
        roundTimeLabel: workshopRoundTimeLabels[round],
        dateLabel: workshopDateLabel,
        roster: json.roster,
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "讀取名單失敗")
    } finally {
      setLoading(false)
    }
  }

  // 資料抓到、或欄數被調整時，重畫預覽——每次都是全新的 canvas，不用
  // 手動清舊的，舊的 object URL 用完就 revoke 掉避免累積記憶體。
  useEffect(() => {
    if (!data) return
    let cancelled = false
    const urlsToRevoke: string[] = []

    async function renderPreview() {
      setLoading(true)
      try {
        const canvases = await renderWorkshopRosterSlides(data!, { columns })
        if (cancelled) return
        const urls = canvases.map((c) => c.toDataURL("image/png"))
        setPreviewUrls(urls)
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "產生預覽失敗")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    renderPreview()

    return () => {
      cancelled = true
      urlsToRevoke.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [data, columns])

  async function handleDownload() {
    if (!data) return
    setDownloading(true)
    try {
      await downloadWorkshopRosterImages(data, `${workshopId}-${round}-roster`, { columns })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "下載失敗")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        下載名單（圖片）
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-w-[calc(100%-2rem)] flex-col gap-0 rounded-3xl border-none bg-card p-0 sm:max-w-2xl"
        >
          <DialogTitle className="sr-only">名單圖片預覽</DialogTitle>
          <div className="flex items-center justify-between p-6 pb-0">
            <p className="text-xl font-bold">名單圖片預覽</p>
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
