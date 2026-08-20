"use client"

import { useState } from "react"
import { ListChecks, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { MAX_CONTENT_LENGTH, MAX_POLL_OPTIONS, MIN_POLL_OPTIONS } from "@/lib/discussion/constants"

// 要回覆的貼文，以及它上面完整的祖先鏈（root 端在最前面）。全部顯示、
// 不裁切——按下回覆之後應該看得到一路往上的完整脈絡，不是只有正上方那則
// 的三行預覽（仿 Threads 的回覆畫面：往上一路排到最上層）。
export type ComposerContextItem = {
  id: string
  authorName: string | null
  content: string
  isDeleted: boolean
}

export type ComposerTarget = {
  parentId: string
  context: ComposerContextItem[]
  allowPoll: boolean
}

type ComposerOverlayProps = {
  target: ComposerTarget | null
  pending: boolean
  onSubmit: (content: string, poll?: { allowMultiple: boolean; options: string[] }) => void
  onClose: () => void
}

// 全螢幕的發文／回覆畫面，仿 Threads：上面一條 Cancel／標題／送出的 header，
// 下面是撐滿剩餘高度的輸入框。textarea 字級一定要 >= 16px（text-base），
// 不然 iOS Safari 對焦時會自動放大整個頁面。
//
// 呼叫端要記得在外層用 key={target?.parentId} 包這個元件：換一個回覆對象
// 時要讓輸入內容重置，用 key 讓 React 直接整個重新掛載、拿到全新的
// useState 初始值，比在 effect 裡 setState 乾淨（也不會觸發
// react-hooks/set-state-in-effect 那個 cascading render 的警告）。
export function ComposerOverlay({ target, pending, onSubmit, onClose }: ComposerOverlayProps) {
  const [content, setContent] = useState("")
  const [pollOpen, setPollOpen] = useState(false)
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false)

  if (!target) return null

  const trimmedOptions = pollOptions.map((o) => o.trim()).filter(Boolean)
  const canSubmit = content.trim().length > 0 && (!pollOpen || trimmedOptions.length >= MIN_POLL_OPTIONS) && !pending
  const replyingTo = target.context[target.context.length - 1]

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(content.trim(), pollOpen ? { allowMultiple: pollAllowMultiple, options: trimmedOptions } : undefined)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
        <button type="button" onClick={onClose} disabled={pending} className="text-sm text-muted-foreground hover:text-foreground">
          取消
        </button>
        <p className="text-sm font-semibold">{replyingTo ? `回覆 ${replyingTo.isDeleted ? "已刪除的貼文" : (replyingTo.authorName ?? "匿名")}` : "發布"}</p>
        <div className="flex items-center gap-3">
          {/* 只有工作人員以上看得到（allowPoll 由呼叫端依 viewer.role 決定，
              server action 也另外擋一次）。放在送出旁邊，跟送出同一個
              「這篇貼文最終長怎樣」的決定點，不是內文裡的次要選項。 */}
          {target.allowPoll && !pollOpen && (
            <button
              type="button"
              onClick={() => setPollOpen(true)}
              disabled={pending}
              aria-label="加入投票"
              className="text-muted-foreground hover:text-foreground"
            >
              <ListChecks className="size-5" strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn("text-sm font-semibold text-primary disabled:opacity-40", pending && "opacity-70")}
          >
            送出
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        {/* 完整的祖先鏈，一路排到最上層（不裁切）——按下回覆要看得到整段
            脈絡，不是只有正上方那則的三行預覽。 */}
        {target.context.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-border pb-4">
            {target.context.map((item) => (
              <div key={item.id} className="border-l-2 border-border pl-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{item.isDeleted ? "已刪除的貼文" : (item.authorName ?? "匿名")}</p>
                {!item.isDeleted && <p className="whitespace-pre-wrap">{item.content}</p>}
              </div>
            ))}
          </div>
        )}

        <textarea
          autoFocus
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
          placeholder={replyingTo ? "寫下回覆..." : "分享你的心得、筆記，或提出問題..."}
          className="min-h-32 w-full flex-1 resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />

        {pollOpen && (
          <div className="flex shrink-0 flex-col gap-2 rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">投票選項</p>
              <button type="button" onClick={() => setPollOpen(false)} aria-label="移除投票" className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>

            {pollOptions.map((option, index) => (
              <input
                key={index}
                value={option}
                onChange={(e) => {
                  const next = [...pollOptions]
                  next[index] = e.target.value
                  setPollOptions(next)
                }}
                placeholder={`選項 ${index + 1}`}
                className="w-full rounded-full border border-border bg-transparent px-4 py-2 text-base outline-none placeholder:text-muted-foreground"
              />
            ))}

            <div className="flex items-center justify-between">
              {pollOptions.length < MAX_POLL_OPTIONS ? (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  新增選項
                </button>
              ) : (
                <span />
              )}

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" checked={pollAllowMultiple} onChange={(e) => setPollAllowMultiple(e.target.checked)} />
                允許多選
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
