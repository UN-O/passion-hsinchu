"use client"

import { useEffect, useState } from "react"

import { getChapterAction } from "@/lib/bible/actions"
import type { BiblePassage, BibleVersionKey } from "@/lib/bible"
import { ReferencePills } from "./reference-pills"
import { PassageBody } from "./passage-body"

// 自由模式：最齊全——選書卷／章／版本，整章顯示，經文可以點選、標記、
// 複製、比較版本。跟閱讀模式的差別是「使用者自己導覽」而不是「admin 選好
// 固定顯示」，所以換書卷／章／版本時要重新查詢（透過 server action）。
export function BibleFreeReader({
  initialVersion = "unv",
  initialBook,
  initialChapter,
}: {
  initialVersion?: BibleVersionKey
  initialBook: string
  initialChapter: number
}) {
  const [version, setVersion] = useState<BibleVersionKey>(initialVersion)
  const [book, setBook] = useState(initialBook)
  const [chapter, setChapter] = useState(initialChapter)
  const [passage, setPassage] = useState<BiblePassage | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 換章節時要立刻顯示查詢中，不等 action 回來
    setLoading(true)
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

  return (
    <div className="flex flex-col gap-4">
      <ReferencePills
        book={book}
        chapter={chapter}
        version={version}
        onBookChapterChange={(b, c) => {
          setBook(b)
          setChapter(c)
        }}
        onVersionChange={setVersion}
      />

      <div className="relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {passage?.bookLabel ?? book} {chapter}
          </p>
          {passage && (
            <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              {passage.versionLabel}
            </span>
          )}
        </div>

        {loading && <p className="text-sm text-muted-foreground">查詢中…</p>}
        {!loading && !passage && <p className="text-sm text-muted-foreground">尚未連接，或查無此章。</p>}
        {!loading && passage && <PassageBody passage={passage} interactive />}
      </div>
    </div>
  )
}
