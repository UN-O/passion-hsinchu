"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import type { ConferenceWorkshopRound } from "@/lib/opening-conference-content"
import { saveCapacity } from "./actions"

// 一個工作坊＋場次一組：目前人數（後端算好傳進來，這裡不重算）、
// 上限輸入框（空白＝不限）。currentCapacity 是目前資料庫的值，拿來當
// input 的 defaultValue，讓工作人員看得到現在設的是多少。
export function CapacityForm({
  workshopId,
  round,
  label,
  count,
  currentCapacity,
}: {
  workshopId: string
  round: ConferenceWorkshopRound
  label: string
  count: number
  currentCapacity: number | null
}) {
  const [state, formAction, pending] = useActionState(saveCapacity, { error: null, message: null })

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3 py-2">
      <input type="hidden" name="workshopId" value={workshopId} />
      <input type="hidden" name="round" value={round} />
      <p className="min-w-0 flex-1 text-sm">
        {label}
        <span className="ml-2 text-muted-foreground">目前 {count} 人</span>
      </p>
      <input
        type="number"
        name="capacity"
        min={0}
        placeholder="不限"
        defaultValue={currentCapacity ?? ""}
        className="h-9 w-24 rounded-full border border-border bg-transparent px-4 text-sm outline-none focus-visible:border-ring"
      />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "儲存中…" : "儲存"}
      </Button>
      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
      {state.message && <p className="w-full text-xs text-muted-foreground">{state.message}</p>}
    </form>
  )
}
