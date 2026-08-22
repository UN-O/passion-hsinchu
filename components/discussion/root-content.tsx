"use client"

import { useState } from "react"
import { BadgeCheck, Pencil } from "lucide-react"
import ReactMarkdown from "react-markdown"

import { MAX_CONTENT_LENGTH } from "@/lib/discussion/constants"
import type { PostImageDTO } from "@/lib/discussion/dto"
import { submitEditRootContent, submitRemovePostImages } from "@/lib/discussion/actions"
import { Avatar, RailLine } from "./post-row"
import { AttachmentEditor, useImageAttachments } from "./image-attachments"
import { PostImages } from "./post-images"

// root post 一律顯示成「PASSION 官方」發文（跟一般回覆的官方旗標是同一顆
// 徽章、同一個視覺語言，見 post-row.tsx 的 showOfficial），不是另外一種
// 排版——root 就是這場活動/聚會本身在講話。內容支援 markdown（圖片、
// 標題、清單…），只有 root 這樣，一般回覆還是純文字。
export function RootContent({
  rootPostId,
  content,
  images = [],
  isDiscussionAdmin,
  hasRail = false,
}: {
  rootPostId: string
  content: string
  // root 的附圖。跟一般貼文用同一張 post_images 表、同一個顯示元件，
  // 差別只在「誰可以編輯」——root 沒有作者，改由 discussion admin 管。
  images?: PostImageDTO[]
  isDiscussionAdmin: boolean
  // 討論串頁（/discussion/[postId]）root 後面接著祖先鏈，兩者中間要接一條
  // 線，視覺上才看得出祖先鏈是接在 root 底下——跟 post-row.tsx 的 EntryBody
  // 同一套「頭貼下面接線、內文留 pb-3 讓線一路長到底」的做法。討論主頁的
  // header 不用（root 底下是互不隸屬的頂層回覆，見 post-row.tsx 規則 3）。
  hasRail?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(content)
  const [savedImages, setSavedImages] = useState(images)
  const [draft, setDraft] = useState(content)
  const [pending, setPending] = useState(false)
  const newImages = useImageAttachments()

  function startEdit() {
    setDraft(saved)
    setEditing(true)
  }

  function cancelEdit() {
    // 取消＝這次新選的圖沒有人要了，連 R2 一起清掉。
    newImages.discardAll()
    setEditing(false)
  }

  async function handleSave() {
    const trimmed = draft.trim()
    if (!trimmed || pending || newImages.busy) return
    setPending(true)
    const result = await submitEditRootContent(
      rootPostId,
      trimmed,
      newImages.readyImages.map((image) => image.id)
    )
    if (result.ok) {
      setSaved(trimmed)
      // 伺服器回來的是綁定之後的完整清單（含 position 排序），直接採用，
      // 不要自己在前端拼——不然重新整理之後順序可能跟畫面不一樣。
      setSavedImages(result.data)
      // 已經綁到 root 上了，只清本地狀態（discardAll 會把它們從 R2 刪掉）。
      newImages.clearLocal()
      setEditing(false)
    }
    setPending(false)
  }

  // root 沒有作者，圖片的刪除權限跟編輯大綱一樣是 discussion admin
  // （server action 會再擋一次）。
  async function handleRemoveImage(imageId: string) {
    const previous = savedImages
    setSavedImages((prev) => prev.filter((image) => image.id !== imageId))
    const result = await submitRemovePostImages(rootPostId, [imageId])
    if (!result.ok) setSavedImages(previous)
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <Avatar name="PASSION 官方" size={32} />
        {hasRail && <RailLine />}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col gap-2 ${hasRail ? "pb-3" : ""}`}>
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
              placeholder="支援 markdown：標題用 #、清單用 -。圖片用下面的加號上傳，也可以拍照你的筆記"
              className="min-h-32 w-full resize-none rounded-2xl border border-border bg-transparent p-3 font-mono text-sm outline-none placeholder:text-muted-foreground"
            />
            <AttachmentEditor
              controller={newImages}
              existing={savedImages}
              onRemoveExisting={handleRemoveImage}
              disabled={pending}
            />
            <div className="flex items-center gap-3 self-end text-sm">
              <button type="button" onClick={cancelEdit} disabled={pending} className="text-muted-foreground hover:text-foreground">
                取消
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={pending || !draft.trim() || newImages.busy}
                className="font-semibold text-primary disabled:opacity-40"
              >
                儲存
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1 text-sm leading-relaxed [&>*+*]:mt-3">
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

              {savedImages.length > 0 && (
                <div className="mt-3">
                  <PostImages images={savedImages} />
                </div>
              )}
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
