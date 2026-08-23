"use client"

import { useEffect, useState } from "react"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAllVersionsAction } from "@/lib/bible/actions"
import { BIBLE_VERSIONS, referenceToLabel } from "@/lib/bible"
import type { BiblePassage, BibleReference, BibleVersionKey } from "@/lib/bible"

// 選幾節經文之後按「比較版本」跳出來的視窗：同一段參照，三個版本各拿一次，
// 平行顯示。資料要透過 server action 拿（API.Bible 需要密鑰，不能在瀏覽器
// 直接打），見 lib/bible/actions.ts。
export function CompareVersionsDialog({
  open,
  onOpenChange,
  reference,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  reference: BibleReference | null
}) {
  const [passages, setPassages] = useState<Partial<Record<BibleVersionKey, BiblePassage | null>> | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open || !reference) return
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 開窗時要立刻顯示查詢中，不等 action 回來
    setLoading(true)
    setPassages(null)
    getAllVersionsAction(reference).then((result) => {
      if (!cancelled) {
        setPassages(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [open, reference])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{reference ? referenceToLabel(reference) : "比較版本"}</DialogTitle>
        </DialogHeader>

        {loading && <p className="text-sm text-muted-foreground">查詢中…</p>}

        {!loading && passages && (
          <div className="flex flex-col gap-5">
            {(Object.keys(BIBLE_VERSIONS) as BibleVersionKey[]).map((key) => {
              const passage = passages[key]
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <span className="w-fit rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                    {BIBLE_VERSIONS[key].label}
                  </span>
                  {passage ? (
                    <p className="text-sm leading-relaxed">{passage.verses.map((v) => v.text).join(" ")}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">尚未連接或查無此段落。</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
