"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"

import { MAX_CONTENT_LENGTH } from "@/lib/discussion/constants"
import { submitEditRootContent } from "@/lib/discussion/actions"

// 討論 root 最上面的大綱文字。一般人看到的是純文字段落；discussion admin
// 旁邊多一顆編輯 icon，點下去原地換成 textarea——互動模式比照
// composer-overlay.tsx 的送出邏輯，但不用全螢幕，就是行內展開收合。
export function RootContent({
  rootPostId,
  content,
  isDiscussionAdmin,
}: {
  rootPostId: string
  content: string
  isDiscussionAdmin: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(content)
  const [draft, setDraft] = useState(content)
  const [pending, setPending] = useState(false)

  function startEdit() {
    setDraft(saved)
    setEditing(true)
  }

  async function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed || pending) return
    setPending(true)
    const result = await submitEditRootContent(rootPostId, trimmed)
    if (result.ok) {
      setSaved(trimmed)
      setEditing(false)
    }
    setPending(false)
  }

  if (editing) {
    return (
      <div className="flex flex-col gap-2">
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
          className="min-h-24 w-full resize-none rounded-2xl border border-border bg-transparent p-3 text-base outline-none"
        />
        <div className="flex items-center gap-3 self-end text-sm">
          <button type="button" onClick={() => setEditing(false)} disabled={pending} className="text-muted-foreground hover:text-foreground">
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || !draft.trim()}
            className="font-semibold text-primary disabled:opacity-40"
          >
            儲存
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2">
      <p className="flex-1 whitespace-pre-wrap text-base">{saved}</p>
      {isDiscussionAdmin && (
        <button
          type="button"
          onClick={startEdit}
          aria-label="編輯大綱文字"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="size-4" strokeWidth={1.75} />
        </button>
      )}
    </div>
  )
}
