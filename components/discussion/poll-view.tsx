"use client"

import { useTransition } from "react"

import type { PollDTO } from "@/lib/discussion/dto"
import { cn } from "@/lib/utils"
import { submitPollVote } from "@/lib/discussion/actions"

type PollViewProps = {
  poll: PollDTO
  onChange: (next: Pick<PollDTO, "options" | "viewerOptionIds">) => void
}

export function PollView({ poll, onChange }: PollViewProps) {
  const [pending, startTransition] = useTransition()
  const totalVotes = poll.options.reduce((sum, o) => sum + o.voteCount, 0)

  function vote(optionId: string) {
    const alreadyVoted = poll.viewerOptionIds.includes(optionId)
    const nextViewerOptionIds = poll.allowMultiple
      ? alreadyVoted
        ? poll.viewerOptionIds.filter((id) => id !== optionId)
        : [...poll.viewerOptionIds, optionId]
      : alreadyVoted
        ? []
        : [optionId]

    const nextOptions = poll.options.map((option) => {
      const wasSelected = poll.viewerOptionIds.includes(option.id)
      const isSelected = nextViewerOptionIds.includes(option.id)
      if (wasSelected === isSelected) return option
      return { ...option, voteCount: option.voteCount + (isSelected ? 1 : -1) }
    })

    onChange({ options: nextOptions, viewerOptionIds: nextViewerOptionIds })

    startTransition(async () => {
      const result = await submitPollVote(poll.postId, optionId)
      if (result.ok) onChange(result.data)
    })
  }

  return (
    <div className={cn("mt-3 flex flex-col gap-2", pending && "opacity-70")}>
      {poll.options.map((option) => {
        const selected = poll.viewerOptionIds.includes(option.id)
        const pct = totalVotes > 0 ? Math.round((option.voteCount / totalVotes) * 100) : 0
        return (
          <button
            key={option.id}
            type="button"
            disabled={poll.closed}
            onClick={() => vote(option.id)}
            className={cn(
              "relative overflow-hidden rounded-2xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              selected ? "border-primary font-semibold text-primary" : "border-border text-foreground hover:border-foreground/40"
            )}
          >
            <span
              className={cn("absolute inset-y-0 left-0 bg-foreground/5", selected && "bg-primary/10")}
              style={{ width: `${pct}%` }}
              aria-hidden
            />
            <span className="relative flex items-center justify-between gap-3">
              <span>{option.label}</span>
              <span className="text-muted-foreground">
                {pct}%（{option.voteCount}）
              </span>
            </span>
          </button>
        )
      })}
      {poll.closed && <p className="text-xs text-muted-foreground">投票已結束</p>}
    </div>
  )
}
