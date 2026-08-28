"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import {
  conferenceWorkshops,
  workshopRoundLabels,
  type ConferenceWorkshopRound,
} from "@/lib/opening-conference-content"
import { assignWorkshop, searchForAssign } from "./actions"
import { emptyAssignSearch } from "./state"

const ROUNDS: ConferenceWorkshopRound[] = ["R1", "R2"]

function workshopLabel(id: string | null): string {
  if (!id) return "未選"
  return conferenceWorkshops.find((w) => w.id === id)?.topic || id
}

// 現場救援用：搜不到自己選的人、或想幫忙補選，工作人員直接搜名冊、選一個
// 工作坊把人加進去——不像自選（saveMyWorkshopSelection）卡截止時間跟
// 人數上限，也不需要兩場一起選，見 lib/conference-workshop.ts 的
// assignWorkshopForEnrollment 說明。
export function WorkshopAssignSearch() {
  const [state, formAction, pending] = useActionState(searchForAssign, emptyAssignSearch)

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form action={formAction} className="flex gap-2">
        <input
          type="search"
          name="query"
          placeholder="搜尋姓名或教會"
          className="h-9 flex-1 rounded-4xl border border-border bg-transparent px-4 text-sm outline-none focus-visible:border-ring"
        />
        <Button type="submit" variant="outline" disabled={pending}>
          {pending ? "搜尋中…" : "搜尋"}
        </Button>
      </form>

      {state.message && <p className="text-sm text-muted-foreground">{state.message}</p>}

      {state.results.length > 0 && (
        <ul className="flex flex-col divide-y divide-border">
          {state.results.map((r) => (
            <li key={r.enrollmentId} className="flex flex-col gap-3 py-4">
              <p className="min-w-0 text-sm font-medium">
                {r.name}／{r.church}
              </p>
              <p className="text-xs text-muted-foreground">
                目前 場次一：{workshopLabel(r.registration.R1)}｜場次二：{workshopLabel(r.registration.R2)}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                {ROUNDS.map((round) => (
                  <AssignRoundControl
                    key={round}
                    enrollmentId={r.enrollmentId}
                    round={round}
                    currentWorkshopId={r.registration[round]}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AssignRoundControl({
  enrollmentId,
  round,
  currentWorkshopId,
}: {
  enrollmentId: string
  round: ConferenceWorkshopRound
  currentWorkshopId: string | null
}) {
  const [state, formAction, pending] = useActionState(assignWorkshop, { error: null, message: null })
  const options = conferenceWorkshops.filter((w) => w.rounds.includes(round))

  return (
    <form action={formAction} className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <input type="hidden" name="round" value={round} />
      <span className="text-xs text-muted-foreground">{workshopRoundLabels[round]}</span>
      <select
        name="workshopId"
        defaultValue={currentWorkshopId ?? ""}
        className="h-9 min-w-0 flex-1 rounded-full border border-border bg-transparent px-3 text-sm outline-none focus-visible:border-ring"
      >
        <option value="" disabled>
          選工作坊
        </option>
        {options.map((w) => (
          <option key={w.id} value={w.id} className="bg-background text-foreground">
            {w.topic || w.speaker}
          </option>
        ))}
      </select>
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending ? "加入中…" : "加入"}
      </Button>
      {state.error && <span className="w-full text-xs text-destructive">{state.error}</span>}
      {state.message && <span className="w-full text-xs text-muted-foreground">{state.message}</span>}
    </form>
  )
}
