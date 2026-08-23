"use client"

import { useState } from "react"
import { ArrowLeft, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { BIBLE_BOOKS, BOOK_BY_CODE } from "@/lib/bible"

// 書卷／章節選擇——兩步：先選書卷（一路捲的清單），選了之後換成該書卷的
// 章數字格（跟 YouVersion 自己的選單一樣的流程）。全螢幕蓋板，跟
// composer-overlay.tsx 同一套「fixed inset-0」的做法，不是 dialog/sheet。
export function BookChapterPicker({
  open,
  onClose,
  onSelect,
}: {
  open: boolean
  onClose: () => void
  onSelect: (book: string, chapter: number) => void
}) {
  const [selectedBook, setSelectedBook] = useState<string | null>(null)

  if (!open) return null

  const book = selectedBook ? BOOK_BY_CODE.get(selectedBook) : null

  function handleClose() {
    setSelectedBook(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        {book ? (
          <button type="button" onClick={() => setSelectedBook(null)} aria-label="返回書卷清單" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-5" strokeWidth={1.75} />
          </button>
        ) : (
          <span className="size-5" />
        )}
        <p className="text-sm font-semibold">{book ? book.fullName : "選擇書卷"}</p>
        <button type="button" onClick={handleClose} aria-label="關閉" className="text-muted-foreground hover:text-foreground">
          <X className="size-5" strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!book ? (
          <div className="flex flex-col">
            {BIBLE_BOOKS.map((b) => (
              <button
                key={b.code}
                type="button"
                onClick={() => setSelectedBook(b.code)}
                className="border-b border-border py-3 text-left text-base hover:text-primary"
              >
                {b.fullName}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: book.chapters }, (_, i) => i + 1).map((chapter) => (
              <button
                key={chapter}
                type="button"
                onClick={() => {
                  onSelect(book.code, chapter)
                  handleClose()
                }}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-xl border border-border text-base font-medium",
                  "hover:border-foreground/40"
                )}
              >
                {chapter}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
