"use client"

import { useEffect, useState } from "react"

import { getChapterAction } from "@/lib/bible/actions"
import type { BiblePassage, BibleReference, BibleVersionKey } from "@/lib/bible"
import { VerseList } from "./verse-list"

// 選好書卷／章之後，先看到整章內容，再從裡面點選要用的節（可以點多節）——
// quote 模式跟閱讀模式的「管理者選段落」都是這個流程，跟自由模式／已配置
// 好的閱讀模式（PassageBody 那種點了直接跳標記/複製/比較）不一樣，這裡點
// 完是要「下一步」確認範圍，不是立刻做動作。
//
// 多選節目前是取「最小到最大」湊成一段連續範圍（不支援選不連續的節），
// 這跟一般讀經 App 的「選取範圍」行為一致，也讓底層 BibleReference 的
// verseStart/verseEnd 形狀不用為了離散節另外設計一套。
export function ChapterVerseSelect({
  version,
  book,
  chapter,
  confirmLabel = "下一步",
  onConfirm,
}: {
  version: BibleVersionKey
  book: string
  chapter: number
  confirmLabel?: string
  onConfirm: (reference: BibleReference) => void
}) {
  const [passage, setPassage] = useState<BiblePassage | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 換章節時要立刻顯示查詢中，不等 action 回來
    setLoading(true)
    setSelected(new Set())
    getChapterAction(version, book, chapter).then((result) => {
      if (!cancelled) {
        setPassage(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [version, book, chapter])

  function toggleVerse(verse: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(verse)) next.delete(verse)
      else next.add(verse)
      return next
    })
  }

  function handleConfirm() {
    if (selected.size === 0) return
    const numbers = [...selected]
    onConfirm({ book, chapter, verseStart: Math.min(...numbers), verseEnd: Math.max(...numbers) })
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="max-h-80 w-full min-w-0 overflow-y-auto rounded-xl border border-border p-3">
        {loading && <p className="text-sm text-muted-foreground">查詢中…</p>}
        {!loading && !passage && <p className="text-sm text-muted-foreground">尚未連接，或查無此章。</p>}
        {!loading && passage && <VerseList verses={passage.verses} interactive selected={selected} onToggleVerse={toggleVerse} />}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{selected.size > 0 ? `已選 ${selected.size} 節` : "點選經文裡的節"}</span>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="text-sm font-semibold text-primary disabled:opacity-40"
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  )
}
