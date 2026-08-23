"use client"

import { useState } from "react"

import type { BiblePassage } from "@/lib/bible"
import { VerseList } from "./verse-list"
import { VerseToolbar } from "./verse-toolbar"
import { CompareVersionsDialog } from "./compare-versions-dialog"

// 經文本體。interactive＝true 時每一節都能點：點一節加入選取，選取的節會
// 跳出動作列（VerseToolbar）。「標記」是純畫面互動、不存資料庫——重整頁面
// 或跨裝置不會保留，跟社群 App 常見的「螢光筆」功能不是同一回事，是刻意
// 先做輕量版。
export function PassageBody({ passage, interactive = false }: { passage: BiblePassage; interactive?: boolean }) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set())
  const [compareOpen, setCompareOpen] = useState(false)

  function toggleVerse(verse: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(verse)) next.delete(verse)
      else next.add(verse)
      return next
    })
  }

  function handleHighlight() {
    setHighlighted((prev) => {
      const next = new Set(prev)
      for (const v of selected) next.add(v)
      return next
    })
    setSelected(new Set())
  }

  function handleCopy() {
    const text = passage.verses
      .filter((v) => selected.has(v.verse))
      .map((v) => v.text)
      .join(" ")
    const ref = `${passage.bookLabel} ${passage.reference.chapter}:${[...selected].sort((a, b) => a - b).join(",")}`
    void navigator.clipboard.writeText(`${text}（${ref}，${passage.versionLabel}）`)
    setSelected(new Set())
  }

  function handleCompare() {
    setCompareOpen(true)
  }

  return (
    <div className={interactive ? "relative" : undefined}>
      <VerseList verses={passage.verses} interactive={interactive} selected={selected} highlighted={highlighted} onToggleVerse={toggleVerse} />

      {interactive && (
        <VerseToolbar
          count={selected.size}
          onHighlight={handleHighlight}
          onCopy={handleCopy}
          onCompare={handleCompare}
          onClear={() => setSelected(new Set())}
        />
      )}

      {interactive && (
        <CompareVersionsDialog open={compareOpen} onOpenChange={setCompareOpen} reference={passage.reference} />
      )}
    </div>
  )
}
