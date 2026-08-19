"use client"

import { useActionState, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  EXP_AMOUNT_MAX,
  EXP_AMOUNT_PRESETS,
  EXP_REASON_MAX_LENGTH,
  EXP_REASON_PRESETS,
  EXP_REGIONS,
  type ExpRegion,
} from "@/lib/exp-regions"
import { cn } from "@/lib/utils"
import { awardPoints } from "./actions"
import { emptyAward, type AwardedSummary } from "./state"

type Step = "region" | "amount" | "reason"

const STEPS: Step[] = ["region", "amount", "reason"]

const STEP_TITLES: Record<Step, string> = {
  region: "加分給哪一區？",
  amount: "加幾分？",
  reason: "原因",
}

// 上限是 100000，六位數。數字鍵盤直接擋在輸入長度，比按完才報錯好。
const MAX_DIGITS = String(EXP_AMOUNT_MAX).length

const KEYPAD_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "00", "0"] as const

// 未選中／選中的共用樣式。依 style.md：用顏色深淺、border、字重表達狀態，
// 不用陰影也不用縮放。
function choiceClass(selected: boolean, extra?: string) {
  return cn(
    "rounded-4xl border px-4 text-sm transition-colors",
    selected
      ? "border-primary font-semibold text-primary"
      : "border-border text-foreground hover:border-foreground/40",
    extra
  )
}

export function AwardFlow() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("region")
  const [regions, setRegions] = useState<ExpRegion[]>([])
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [state, formAction, pending] = useActionState(awardPoints, emptyAward)

  const awarded = state.awarded
  // 每次成功都是一個新的 token，連續加分時完成畫面才會重新出現。
  const [seenToken, setSeenToken] = useState<string | null>(null)
  const showDone = awarded !== null && awarded.token !== seenToken

  // 清掉上一輪的輸入。
  //
  // 刻意在「開始加分」「再加一筆」這兩個handler 裡呼叫，而不是用 useEffect 去
  // 監看送出成功：送出成功後畫面是完成回饋，那些欄位根本沒顯示，等使用者真的
  // 要再加一筆時才清就夠了。在 effect 裡 setState 會多跑一輪 render，
  // eslint 的 react-hooks/set-state-in-effect 也會擋。
  function resetInputs() {
    setStep("region")
    setRegions([])
    setAmount("")
    setReason("")
  }

  function start() {
    setSeenToken(awarded?.token ?? null)
    resetInputs()
    setOpen(true)
  }

  function close() {
    setSeenToken(awarded?.token ?? null)
    setOpen(false)
  }

  function toggleRegion(region: ExpRegion) {
    setRegions((current) =>
      current.includes(region) ? current.filter((r) => r !== region) : [...current, region]
    )
  }

  function pressKey(key: string) {
    setAmount((current) => {
      const next = (current + key).replace(/^0+(?=\d)/, "")
      return next.length > MAX_DIGITS ? current : next
    })
  }

  const stepIndex = STEPS.indexOf(step)
  const canGoNext =
    step === "region" ? regions.length > 0 : step === "amount" ? amount !== "" : true

  if (!open) {
    return (
      <Button type="button" size="xl" className="mt-6 w-full sm:w-auto" onClick={start}>
        開始加分
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 h-svh overflow-hidden bg-background">
      <div className="mx-auto flex h-full max-w-xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex shrink-0 items-center gap-4">
          <div className="flex flex-1 gap-1">
            {STEPS.map((value, index) => (
              <div key={value} className="h-1 flex-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{
                    width: showDone || index < stepIndex ? "100%" : index === stepIndex ? "50%" : "0%",
                  }}
                />
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={close}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            關閉
          </button>
        </div>

        {showDone ? (
          <DoneStep
            awarded={awarded}
            onAgain={() => {
              setSeenToken(awarded.token)
              resetInputs()
            }}
            onClose={close}
          />
        ) : (
          <form action={formAction} className="flex flex-1 flex-col overflow-hidden">
            {regions.map((region) => (
              <input key={region} type="hidden" name="regions" value={region} />
            ))}
            <input type="hidden" name="amount" value={amount} />
            <input type="hidden" name="reason" value={reason} />

            <h2 className="font-heading mt-6 shrink-0 text-2xl font-bold tracking-tight sm:mt-12 sm:text-3xl">
              {STEP_TITLES[step]}
              {step === "reason" && (
                <span className="ml-3 text-sm font-normal text-muted-foreground">選填</span>
              )}
            </h2>

            {/* 這個區塊要能在極窄螢幕內部自己捲動，外層 overlay 才不用捲——
                header 跟下面的按鈕永遠留在畫面上。 */}
            <div className="mt-6 flex-1 overflow-y-auto sm:mt-10">
              {step === "region" && (
                <RegionStep selected={regions} onToggle={toggleRegion} />
              )}
              {step === "amount" && (
                <AmountStep
                  amount={amount}
                  onPreset={(value) => setAmount(String(value))}
                  onKey={pressKey}
                  onBackspace={() => setAmount((current) => current.slice(0, -1))}
                  onClear={() => setAmount("")}
                />
              )}
              {step === "reason" && <ReasonStep reason={reason} onChange={setReason} />}

              <Summary regions={regions} amount={amount} reason={reason} step={step} />
            </div>

            {state.error && <p className="mt-4 shrink-0 text-sm text-destructive">{state.error}</p>}

            <div className="mt-6 flex shrink-0 gap-3">
              {stepIndex > 0 && (
                <Button
                  type="button"
                  size="xl"
                  variant="outline"
                  onClick={() => setStep(STEPS[stepIndex - 1])}
                >
                  上一步
                </Button>
              )}
              {/* key 一定要不一樣。
                  兩個分支如果共用同一個 <button> 節點，「下一步」按到最後一步時
                  React 會在 click 事件還在派送的過程中把同一顆按鈕從
                  type="button" 換成 type="submit"，瀏覽器接著執行 click 的預設
                  行為時看到的已經是 submit —— 於是還沒填原因就直接送出。
                  給不同的 key 會讓 React 換掉節點，舊節點離開表單就不會送出。 */}
              {step === "reason" ? (
                <Button
                  key="award-submit"
                  type="submit"
                  size="xl"
                  className="flex-1"
                  disabled={pending}
                >
                  {pending ? "送出中…" : "確認加分"}
                </Button>
              ) : (
                <Button
                  key="award-next"
                  type="button"
                  size="xl"
                  className="flex-1"
                  disabled={!canGoNext}
                  onClick={() => setStep(STEPS[stepIndex + 1])}
                >
                  下一步
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function RegionStep({
  selected,
  onToggle,
}: {
  selected: ExpRegion[]
  onToggle: (region: ExpRegion) => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">可以複選，選到的每一區都會各加一次分。</p>
      {EXP_REGIONS.map((region) => {
        const isSelected = selected.includes(region.key)
        return (
          <button
            key={region.key}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onToggle(region.key)}
            className={choiceClass(isSelected, "h-20 text-xl sm:h-24 sm:text-2xl")}
          >
            {region.label}
          </button>
        )
      })}
    </div>
  )
}

function AmountStep({
  amount,
  onPreset,
  onKey,
  onBackspace,
  onClear,
}: {
  amount: string
  onPreset: (value: number) => void
  onKey: (key: string) => void
  onBackspace: () => void
  onClear: () => void
}) {
  return (
    <div className="flex flex-col gap-8">
      <p
        className="text-5xl font-bold text-primary sm:text-6xl"
        aria-live="polite"
        aria-label={amount ? `目前分數 ${amount}` : "尚未輸入分數"}
      >
        {amount === "" ? <span className="text-muted-foreground">0</span> : Number(amount).toLocaleString("en-US")}
      </p>

      <div className="flex flex-wrap gap-2">
        {EXP_AMOUNT_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={amount === String(preset)}
            onClick={() => onPreset(preset)}
            className={choiceClass(amount === String(preset), "h-11 min-w-20")}
          >
            {preset.toLocaleString("en-US")}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {KEYPAD_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onKey(key)}
            className="h-14 rounded-4xl border border-border text-lg transition-colors hover:border-foreground/40"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          onClick={onBackspace}
          className="h-14 rounded-4xl border border-border text-sm transition-colors hover:border-foreground/40"
        >
          退格
        </button>
      </div>

      <button
        type="button"
        onClick={onClear}
        className="self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        清除
      </button>
    </div>
  )
}

function ReasonStep({ reason, onChange }: { reason: string; onChange: (value: string) => void }) {
  const trimmed = reason.trim()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {EXP_REASON_PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={trimmed === preset}
            // preset 只是把文字填進去，填完還可以再改
            onClick={() => onChange(trimmed === preset ? "" : preset)}
            className={choiceClass(trimmed === preset, "h-10")}
          >
            {preset}
          </button>
        ))}
      </div>

      {/* 沒有 name：真正送出的是上面那個 hidden input，
          兩個同名欄位會讓 formData.get("reason") 拿到哪一個變得不明確。 */}
      <textarea
        value={reason}
        maxLength={EXP_REASON_MAX_LENGTH}
        onChange={(event) => onChange(event.target.value)}
        placeholder="也可以自己打，或直接留空"
        aria-label="加分原因"
        className="min-h-24 w-full rounded-3xl border border-transparent bg-input/50 px-4 py-3 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring md:text-sm"
      />
    </div>
  )
}

function Summary({
  regions,
  amount,
  reason,
  step,
}: {
  regions: ExpRegion[]
  amount: string
  reason: string
  step: Step
}) {
  if (step === "region") return null

  const labels = EXP_REGIONS.filter((region) => regions.includes(region.key)).map((r) => r.label)
  const trimmed = reason.trim()

  return (
    <p className="mt-6 border-t border-border pt-4 text-sm text-muted-foreground sm:mt-10">
      {labels.join("、")}
      {amount !== "" && ` 各 +${Number(amount).toLocaleString("en-US")} 分`}
      {trimmed && `／${trimmed}`}
    </p>
  )
}

function DoneCheckmark() {
  return (
    <svg viewBox="0 0 52 52" className="size-14 text-primary" aria-hidden="true">
      <circle
        cx="26"
        cy="26"
        r="24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        pathLength={100}
        className="animate-done-circle"
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 27l7 7 17-17"
        pathLength={100}
        className="animate-done-check"
      />
    </svg>
  )
}

function DoneStep({
  awarded,
  onAgain,
  onClose,
}: {
  awarded: AwardedSummary
  onAgain: () => void
  onClose: () => void
}) {
  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="mt-12">
        <DoneCheckmark />
      </div>
      <p className="mt-6 text-sm tracking-[0.2em] text-muted-foreground">已完成</p>
      <p className="mt-6 text-5xl font-bold text-primary sm:text-6xl">
        +{awarded.amount.toLocaleString("en-US")}
      </p>
      <p className="mt-4 text-lg">{awarded.regions.join("、")}</p>
      {awarded.reason && <p className="mt-2 text-sm text-muted-foreground">{awarded.reason}</p>}

      <div className="mt-auto flex flex-col gap-3 pt-12 sm:flex-row">
        <Button type="button" size="xl" className="flex-1" onClick={onAgain}>
          再加一筆
        </Button>
        <Button type="button" size="xl" variant="outline" className="flex-1" onClick={onClose}>
          回到記錄
        </Button>
      </div>
    </div>
  )
}
