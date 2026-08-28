"use client"

import { useState } from "react"

import { downloadWorkshopRosterImages } from "@/lib/export-workshop-roster"
import { workshopDateLabel, workshopRoundTimeLabels, type ConferenceWorkshopRound } from "@/lib/opening-conference-content"

export function RosterDownload({
  workshopId,
  round,
}: {
  workshopId: string
  round: ConferenceWorkshopRound
}) {
  const [pending, setPending] = useState(false)

  async function handleImageDownload() {
    setPending(true)
    try {
      const res = await fetch(`/api/admin/conference-workshop/roster?workshopId=${workshopId}&round=${round}`)
      const data = await res.json()
      if (!data.ok) throw new Error(data.error ?? "下載失敗")
      await downloadWorkshopRosterImages(
        {
          title: data.workshop.title,
          speaker: data.workshop.speaker,
          location: data.workshop.location,
          roundLabel: data.roundLabel,
          roundTimeLabel: workshopRoundTimeLabels[round],
          dateLabel: workshopDateLabel,
          roster: data.roster,
        },
        `${workshopId}-${round}-roster`
      )
    } catch {
      // 內部工具，直接靜默失敗不影響頁面其他功能；重新點一次通常就好了
      // （多半是網路問題），不特別做錯誤提示 UI。
    } finally {
      setPending(false)
    }
  }

  return (
    <span className="flex items-center gap-3 text-xs">
      <a
        href={`/api/admin/conference-workshop/roster?workshopId=${workshopId}&round=${round}&format=txt`}
        className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        下載名單（文字）
      </a>
      <button
        type="button"
        onClick={handleImageDownload}
        disabled={pending}
        className="text-muted-foreground underline underline-offset-4 hover:text-foreground disabled:opacity-50"
      >
        {pending ? "產生中…" : "下載名單（圖片）"}
      </button>
    </span>
  )
}
