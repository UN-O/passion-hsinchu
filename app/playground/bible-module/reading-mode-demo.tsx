"use client"

import { useState } from "react"

import type { BibleReference, BibleVersionKey } from "@/lib/bible"
import { ReferencePills } from "@/components/bible/reference-pills"
import { ChapterVerseSelect } from "@/components/bible/chapter-verse-select"
import { PassageCardClient } from "@/components/bible/passage-card-client"

// 閱讀模式的兩段式 demo：上半段是「管理者選段落」的畫面（選書卷／章 →
// 整章顯示 → 點選節 → 下一步確認），下半段是確認後讀者實際看到、可以互動
// 的閱讀區塊（BibleReadingBlock）。正式版這個「確認的段落」要存到資料庫，
// 這裡先用 useState 模擬。
export function ReadingModeDemo() {
  const [version, setVersion] = useState<BibleVersionKey>("unv")
  const [book, setBook] = useState("JHN")
  const [chapter, setChapter] = useState(16)
  const [confirmed, setConfirmed] = useState<{ version: BibleVersionKey; reference: BibleReference } | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
        <p className="text-sm font-medium">管理者設定（選段落）</p>
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
        <ChapterVerseSelect
          version={version}
          book={book}
          chapter={chapter}
          confirmLabel="設為閱讀段落"
          onConfirm={(reference) => setConfirmed({ version, reference })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">讀者看到的樣子</p>
        {confirmed ? (
          <PassageCardClient version={confirmed.version} reference={confirmed.reference} />
        ) : (
          <p className="text-sm text-muted-foreground">還沒設定段落。</p>
        )}
      </div>
    </div>
  )
}
