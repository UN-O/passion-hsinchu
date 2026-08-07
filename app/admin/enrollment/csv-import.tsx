"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { confirmCsv, emptyPreview, previewCsv } from "./actions"

export function CsvImport() {
  const [preview, previewAction, previewPending] = useActionState(previewCsv, emptyPreview)
  const [confirmed, confirmAction, confirmPending] = useActionState(confirmCsv, emptyPreview)

  // 確認送出後以 confirmed 的結果為準
  const state = confirmed.applied ? confirmed : preview

  return (
    <div className="mt-6 flex flex-col gap-6">
      <form action={previewAction} className="flex flex-col gap-4">
        <input
          type="file"
          name="file"
          accept=".csv,text/csv"
          className="text-sm text-muted-foreground file:mr-4 file:rounded-4xl file:border file:border-border file:bg-transparent file:px-4 file:py-2 file:text-sm file:font-medium file:text-foreground"
        />
        <textarea
          name="csv"
          rows={6}
          placeholder="或直接貼上 CSV 內容"
          defaultValue={preview.csv}
          className="w-full rounded-2xl border border-border bg-transparent p-4 font-mono text-xs outline-none focus-visible:border-ring"
        />
        <Button type="submit" variant="outline" size="lg" disabled={previewPending}>
          {previewPending ? "比對中…" : "預覽變更"}
        </Button>
      </form>

      {state.message && <p className="text-sm">{state.message}</p>}

      {state.errors.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-destructive">
            以下 {state.errors.length} 列有問題，不會被匯入
          </p>
          <ul className="flex flex-col gap-1">
            {state.errors.map((e) => (
              <li key={`${e.lineNumber}-${e.message}`} className="text-xs text-muted-foreground">
                第 {e.lineNumber} 行：{e.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {preview.diff && !confirmed.applied && (
        <div className="flex flex-col gap-4 border-t border-border pt-6">
          <p className="text-sm">
            新增 <span className="font-semibold text-primary">{preview.diff.createCount}</span> 筆、
            更新 <span className="font-semibold text-primary">{preview.diff.updateCount}</span> 筆、
            未變更 <span className="font-semibold">{preview.diff.unchangedCount}</span> 筆
          </p>

          {preview.diff.entries.filter((e) => e.action !== "unchanged").length > 0 && (
            <ul className="flex flex-col gap-2">
              {preview.diff.entries
                .filter((e) => e.action !== "unchanged")
                .map((e) => (
                  <li key={`${e.row.nameNorm}-${e.row.churchNorm}`} className="text-sm">
                    <span className="text-muted-foreground">
                      {e.action === "create" ? "新增" : "更新"}
                    </span>{" "}
                    {e.row.name}／{e.row.church}
                    {e.changes.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {" "}
                        — {e.changes.join("、")}
                      </span>
                    )}
                  </li>
                ))}
            </ul>
          )}

          <form action={confirmAction}>
            <input type="hidden" name="csv" value={preview.csv} />
            <Button
              type="submit"
              size="lg"
              disabled={
                confirmPending ||
                preview.diff.createCount + preview.diff.updateCount === 0
              }
            >
              {confirmPending ? "匯入中…" : "確認匯入"}
            </Button>
          </form>
        </div>
      )}
    </div>
  )
}
