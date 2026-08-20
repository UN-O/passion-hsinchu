"use client"

import { useState } from "react"
import { BadgeCheck, Pencil } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { MAX_CONTENT_LENGTH } from "@/lib/discussion/constants"
import { submitEditRootContent } from "@/lib/discussion/actions"
import { Avatar } from "./post-row"

// root post 一律顯示成「PASSION 官方」發文（跟一般回覆的官方旗標是同一顆
// 徽章、同一個視覺語言，見 post-row.tsx 的 showOfficial），不是另外一種
// 排版——root 就是這場活動/聚會本身在講話。內容支援 markdown（圖片、
// 標題、清單…），只有 root 這樣，一般回覆還是純文字。
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

  return (
    <div className="flex gap-3">
      <Avatar name="PASSION 官方" size={32} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="flex items-center gap-1 text-sm font-semibold text-primary">
          <BadgeCheck className="size-3.5" strokeWidth={2} />
          PASSION 官方
        </span>

        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
              placeholder="支援 markdown：圖片用 ![說明](網址)、標題用 #、清單用 -"
              className="min-h-32 w-full resize-none rounded-2xl border border-border bg-transparent p-3 font-mono text-sm outline-none placeholder:text-muted-foreground"
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
        ) : (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 text-base leading-relaxed [&>*+*]:mt-3">
              <ReactMarkdown
                components={{
                  // eslint-disable-next-line @next/next/no-img-element -- 內容來自 admin 貼的任意網址，不是本地靜態資源
                  img: ({ src, alt }) => <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} className="w-full rounded-2xl" loading="lazy" />,
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-primary">
                      {children}
                    </a>
                  ),
                  h1: ({ children }) => <p className="text-xl font-bold">{children}</p>,
                  h2: ({ children }) => <p className="text-lg font-bold">{children}</p>,
                  h3: ({ children }) => <p className="text-base font-bold">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
                }}
              >
                {saved}
              </ReactMarkdown>
            </div>
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
        )}
      </div>
    </div>
  )
}
