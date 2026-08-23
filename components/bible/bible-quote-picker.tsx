"use client"

import { useState } from "react"
import { BookOpen, X } from "lucide-react"

import { getPassageAction } from "@/lib/bible/actions"
import { referenceToLabel } from "@/lib/bible"
import type { BibleReference, BibleVersionKey } from "@/lib/bible"
import { ReferencePills } from "./reference-pills"
import { ChapterVerseSelect } from "./chapter-verse-select"

const DEFAULT_BOOK = "JHN"
const DEFAULT_CHAPTER = 3

// Quote 模式：composer 裡「加經文」的入口，跟圖片的加號格子並排、同樣的
// 尺寸語言（見 image-attachments.tsx 的 AttachmentEditor）。流程照真正的
// 讀經 App：選書卷／章 → 看整章內容 → 點選要用的節 → 下一步，插入的是
// 格式化好的文字，不是另外存一筆附件——root 以外的一般回覆本來就是純
// 文字，直接寫進 content 字串最簡單，也不用動 posts 的 schema。
export function BibleQuotePicker({ onInsert, disabled }: { onInsert: (text: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [version, setVersion] = useState<BibleVersionKey>("unv")
  const [book, setBook] = useState(DEFAULT_BOOK)
  const [chapter, setChapter] = useState(DEFAULT_CHAPTER)

  async function handleConfirm(reference: BibleReference) {
    const passage = await getPassageAction(version, reference)
    if (!passage) return
    const text = passage.verses.map((v) => v.text).join(" ")
    onInsert(`「${text}」\n——${referenceToLabel(reference)}，${passage.versionLabel}`)
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-label="加入經文"
        className="flex size-24 shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-border text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      >
        <BookOpen className="size-6" strokeWidth={1.75} />
        <span className="text-[11px]">加經文</span>
      </button>
    )
  }

  return (
    <div className="flex w-full min-w-0 basis-full flex-col gap-3 rounded-2xl border border-border p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">加入經文</p>
        <button type="button" onClick={() => setOpen(false)} aria-label="關閉" className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

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

      <ChapterVerseSelect version={version} book={book} chapter={chapter} confirmLabel="插入" onConfirm={handleConfirm} />
    </div>
  )
}
