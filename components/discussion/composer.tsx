"use client"

import { useState } from "react"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { MAX_CONTENT_LENGTH, MAX_POLL_OPTIONS, MIN_POLL_OPTIONS } from "@/lib/discussion/constants"

type ComposerProps = {
  placeholder: string
  submitLabel: string
  allowPoll?: boolean
  pending: boolean
  onSubmit: (content: string, poll?: { allowMultiple: boolean; options: string[] }) => void
  onCancel?: () => void
}

export function Composer({ placeholder, submitLabel, allowPoll, pending, onSubmit, onCancel }: ComposerProps) {
  const [content, setContent] = useState("")
  const [pollOpen, setPollOpen] = useState(false)
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
  const [pollAllowMultiple, setPollAllowMultiple] = useState(false)

  const trimmedOptions = pollOptions.map((o) => o.trim()).filter(Boolean)
  const canSubmit =
    content.trim().length > 0 && (!pollOpen || trimmedOptions.length >= MIN_POLL_OPTIONS) && !pending

  function handleSubmit() {
    if (!canSubmit) return
    onSubmit(content.trim(), pollOpen ? { allowMultiple: pollAllowMultiple, options: trimmedOptions } : undefined)
    setContent("")
    setPollOpen(false)
    setPollOptions(["", ""])
    setPollAllowMultiple(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-2xl border border-border bg-transparent p-4 text-sm outline-none placeholder:text-muted-foreground"
      />

      {allowPoll && !pollOpen && (
        <button
          type="button"
          onClick={() => setPollOpen(true)}
          className="self-start text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          加入投票
        </button>
      )}

      {pollOpen && (
        <div className="flex flex-col gap-2 rounded-2xl border border-border p-4">
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
              className="w-full rounded-full border border-border bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground"
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
              <input
                type="checkbox"
                checked={pollAllowMultiple}
                onChange={(e) => setPollAllowMultiple(e.target.checked)}
              />
              允許多選
            </label>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            取消
          </Button>
        )}
        <Button onClick={handleSubmit} disabled={!canSubmit} className={cn(pending && "opacity-70")}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
