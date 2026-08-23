"use client"

import { useState } from "react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BIBLE_VERSIONS, BOOK_BY_CODE } from "@/lib/bible"
import type { BibleVersionKey } from "@/lib/bible"
import { BookChapterPicker } from "./book-chapter-picker"

// 書卷章＋版本，兩顆藥丸並排（仿 YouVersion 自己的選單列：「提摩太後書 3」
// ＋「CUNP-神」）。左邊那顆點開全螢幕的書卷／章選擇器，右邊是版本下拉。
export function ReferencePills({
  book,
  chapter,
  version,
  onBookChapterChange,
  onVersionChange,
}: {
  book: string
  chapter: number
  version: BibleVersionKey
  onBookChapterChange: (book: string, chapter: number) => void
  onVersionChange: (version: BibleVersionKey) => void
}) {
  const [pickerOpen, setPickerOpen] = useState(false)
  const bookMeta = BOOK_BY_CODE.get(book)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="rounded-full border border-border px-4 py-1.5 text-sm hover:border-foreground/40"
      >
        {bookMeta?.fullName ?? book} {chapter}
      </button>

      <Select value={version} onValueChange={(v) => onVersionChange(v as BibleVersionKey)}>
        <SelectTrigger className="w-auto rounded-full border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.keys(BIBLE_VERSIONS) as BibleVersionKey[]).map((key) => (
            <SelectItem key={key} value={key}>
              {BIBLE_VERSIONS[key].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <BookChapterPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={onBookChapterChange} />
    </div>
  )
}
