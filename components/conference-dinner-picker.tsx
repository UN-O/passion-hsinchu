"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"

import { LocationPinIcon } from "@/components/location-pin-icon"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useDialogBackClose } from "@/hooks/use-dialog-back-close"
import { saveDinnerSelection } from "@/lib/conference-dinner-actions"
import type { DinnerMealType, DinnerRegistrationState } from "@/lib/conference-dinner"
import { dinnerDateLabel, dinnerLocationLabel, dinnerTimeLabel } from "@/lib/opening-conference-content"

const MEAL_TYPE_LABELS: Record<DinnerMealType, string> = { meat: "葷", veggie: "素" }

// 特會任務主頁的「填晚餐」卡片，跟 ConferenceWorkshopPicker 同一種視覺（毛玻璃
// 底卡片＋彈窗），但只有一步：選參加與否，參加的話再選葷素——不像工作坊要
// 分兩個場次各自挑一次，這裡合在同一個畫面一次填完、按「完成」送出。
export function ConferenceDinnerPicker({
  registration,
  onSaved,
}: {
  registration: DinnerRegistrationState
  onSaved: (next: DinnerRegistrationState) => void
}) {
  const completed = registration.attending !== null

  const [open, setOpen] = useState(false)
  const [attending, setAttending] = useState<boolean | null>(registration.attending)
  const [mealType, setMealType] = useState<DinnerMealType | null>(registration.mealType)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useDialogBackClose(open, () => setOpen(false))

  function openPicker() {
    setAttending(registration.attending)
    setMealType(registration.mealType)
    setError(null)
    setOpen(true)
  }

  function selectAttending(next: boolean) {
    setAttending(next)
    // 從「參加」改選「不參加」時清掉已選的葷素，不留下跟畫面不一致的舊選擇。
    if (!next) setMealType(null)
  }

  const canSubmit = attending !== null && (!attending || mealType !== null)

  async function handleSubmit() {
    if (!canSubmit || pending) return
    setPending(true)
    setError(null)
    const result = await saveDinnerSelection({ attending: attending!, mealType })
    if (result.ok) {
      onSaved(result.data)
      setOpen(false)
    } else {
      setError(result.error)
    }
    setPending(false)
  }

  return (
    <>
      {/* 跟 ConferenceWorkshopPicker 同一種半透明毛玻璃底卡片。 */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-white/15 bg-white/10 p-6 text-white/90 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <p className="font-[family-name:var(--font-noto-jp)] text-lg font-bold">
            {completed ? "已回覆晚餐" : `${dinnerDateLabel}晚餐還沒填`}
          </p>
          {completed && (
            <button type="button" onClick={openPicker} className="text-sm font-medium underline underline-offset-4">
              編輯
            </button>
          )}
        </div>

        <span className="mt-2 inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
          <LocationPinIcon className="size-4" />
          {dinnerDateLabel} {dinnerTimeLabel}｜{dinnerLocationLabel}
        </span>

        {completed ? (
          <p className="mt-3 text-sm">
            {registration.attending ? `參加・${MEAL_TYPE_LABELS[registration.mealType!]}食` : "不參加"}
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-white/60">選擇要不要參加、葷或素，選完隨時可以再改。</p>
            <Button type="button" size="lg" className="mt-4 w-full" onClick={openPicker}>
              立即填寫
            </Button>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showCloseButton={false}
          className="flex max-w-[calc(100%-2rem)] flex-col gap-0 rounded-3xl border-none bg-card p-0 sm:max-w-md"
        >
          <DialogTitle className="sr-only">填晚餐</DialogTitle>
          <div className="flex items-center justify-between p-6 pb-0">
            <p className="text-xl font-bold">週六晚餐</p>
            <DialogClose className="text-white/80 hover:text-white">
              <X className="size-5" />
              <span className="sr-only">關閉</span>
            </DialogClose>
          </div>

          <div className="flex flex-col gap-4 p-6">
            <p className="text-sm text-muted-foreground">
              {dinnerDateLabel} {dinnerTimeLabel}｜{dinnerLocationLabel}
            </p>

            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">要參加嗎？</p>
              <div className="grid grid-cols-2 gap-2">
                <ToggleButton label="參加" selected={attending === true} onClick={() => selectAttending(true)} />
                <ToggleButton label="不參加" selected={attending === false} onClick={() => selectAttending(false)} />
              </div>
            </div>

            {attending && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">葷或素？</p>
                <div className="grid grid-cols-2 gap-2">
                  <ToggleButton label="葷" selected={mealType === "meat"} onClick={() => setMealType("meat")} />
                  <ToggleButton label="素" selected={mealType === "veggie"} onClick={() => setMealType("veggie")} />
                </div>
              </div>
            )}

            <Button type="button" size="lg" disabled={!canSubmit || pending} onClick={handleSubmit}>
              {pending ? "送出中…" : "完成"}
            </Button>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function ToggleButton({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className="relative flex h-12 items-center justify-center rounded-2xl text-sm font-medium"
      style={{
        outline: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
        outlineOffset: -2,
        backgroundColor: selected ? "color-mix(in srgb, var(--primary) 12%, transparent)" : "transparent",
      }}
    >
      {label}
      {selected && (
        <span className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-2.5" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}
