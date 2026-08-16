"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EXP_AMOUNT_MAX, EXP_REGIONS, type ExpRegion } from "@/lib/exp-regions"
import { editExpRecord, removeExpRecord } from "./actions"
import { emptyRecord } from "./state"

export type RecordRowData = {
  id: string
  region: ExpRegion
  amount: number
  reason: string | null
  createdByName: string
  createdAt: string
}

export function RecordRow({ row }: { row: RecordRowData }) {
  const [editing, setEditing] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [editState, editAction, editPending] = useActionState(editExpRecord, emptyRecord)
  const [deleteState, deleteAction, deletePending] = useActionState(removeExpRecord, emptyRecord)

  const regionLabel = EXP_REGIONS.find((region) => region.key === row.region)?.label ?? row.region

  return (
    <div className="flex flex-col gap-3 border-b border-border pb-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-base font-medium">{regionLabel}</span>
        <span className="text-base font-semibold text-primary tabular-nums">
          +{row.amount.toLocaleString("en-US")}
        </span>
        <span className="text-sm text-muted-foreground">{row.reason ?? "（無原因）"}</span>
        <span className="w-full text-xs text-muted-foreground sm:ml-auto sm:w-auto">
          {row.createdAt}．{row.createdByName}
        </span>
      </div>

      {editing && (
        <form action={editAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input type="hidden" name="id" value={row.id} />

          <select
            name="region"
            defaultValue={row.region}
            aria-label="分區"
            className="h-9 rounded-3xl border border-transparent bg-input/50 px-3 text-sm outline-none focus-visible:border-ring"
          >
            {EXP_REGIONS.map((region) => (
              <option key={region.key} value={region.key} className="bg-background">
                {region.label}
              </option>
            ))}
          </select>

          <Input
            name="amount"
            type="number"
            inputMode="numeric"
            min={1}
            max={EXP_AMOUNT_MAX}
            defaultValue={row.amount}
            aria-label="分數"
            className="sm:w-32"
          />

          <Input
            name="reason"
            defaultValue={row.reason ?? ""}
            placeholder="原因（選填）"
            aria-label="原因"
            className="sm:flex-1"
          />

          <Button type="submit" size="sm" disabled={editPending}>
            {editPending ? "儲存中…" : "儲存"}
          </Button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            修正
          </button>
        )}
        {editing && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            取消修正
          </button>
        )}

        {/* 刪除做兩段確認。這是不可復原的操作，而且畫面上每一列都長一樣，
            按錯列的成本比多按一次高。 */}
        {confirmingDelete ? (
          <form action={deleteAction} className="flex items-center gap-3">
            <input type="hidden" name="id" value={row.id} />
            <Button type="submit" size="sm" variant="destructive" disabled={deletePending}>
              {deletePending ? "刪除中…" : "確定刪除"}
            </Button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              取消
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="text-sm text-muted-foreground transition-colors hover:text-destructive"
          >
            刪除
          </button>
        )}

        {editState.error && <p className="text-sm text-destructive">{editState.error}</p>}
        {editState.message && <p className="text-sm text-muted-foreground">{editState.message}</p>}
        {deleteState.error && <p className="text-sm text-destructive">{deleteState.error}</p>}
      </div>
    </div>
  )
}
