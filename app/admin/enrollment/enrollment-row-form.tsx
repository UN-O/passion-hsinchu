"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { saveEnrollment, type RowState } from "./actions"

const initial: RowState = { error: null, message: null }

export type Row = {
  id: string
  name: string
  church: string
  camp: boolean
  conference: boolean
  note: string | null
}

export function EnrollmentRowForm({ row }: { row?: Row }) {
  const [state, formAction, pending] = useActionState(saveEnrollment, initial)

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {row && <input type="hidden" name="id" value={row.id} />}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          name="name"
          defaultValue={row?.name}
          placeholder="姓名"
          aria-label="姓名"
          className="sm:flex-1"
        />
        <Input
          name="church"
          defaultValue={row?.church}
          placeholder="教會"
          aria-label="教會"
          className="sm:flex-1"
        />
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="camp"
            defaultChecked={row?.camp ?? false}
            className="size-4 accent-primary"
          />
          CAMP
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="conference"
            defaultChecked={row?.conference ?? false}
            className="size-4 accent-primary"
          />
          CONFERENCE
        </label>

        <Input
          name="note"
          defaultValue={row?.note ?? ""}
          placeholder="備註（選填）"
          aria-label="備註"
          className="w-full sm:w-48"
        />

        <Button
          type="submit"
          variant={row ? "outline" : "default"}
          size="sm"
          disabled={pending}
          className="sm:ml-auto"
        >
          {pending ? "儲存中…" : row ? "更新" : "新增"}
        </Button>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.message && <p className="text-sm text-muted-foreground">{state.message}</p>}
    </form>
  )
}
