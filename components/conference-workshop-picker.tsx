"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

import { LocationPinIcon } from "@/components/location-pin-icon"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useDialogBackClose } from "@/hooks/use-dialog-back-close"
import { saveWorkshopSelection } from "@/lib/conference-workshop-actions"
import {
  conferenceWorkshops,
  isWorkshopSelectionClosed,
  WORKSHOP_SELECTION_DEADLINE_MINUTES,
  workshopDateLabel,
  workshopRoundLabels,
  workshopRoundTimeLabels,
  type ConferenceWorkshop,
  type ConferenceWorkshopRound,
} from "@/lib/opening-conference-content"

type Registration = Record<ConferenceWorkshopRound, string | null>

// intro：還沒選過的人先滑過每個工作坊的介紹卡（跟主頁點縮圖看到的資訊欄
// 同樣內容），看完才進選擇畫面；R1／R2：兩步驟選擇。編輯（已經選完，從
// 「編輯」進來）不需要再看一次介紹，直接從 R1 開始（見 openPicker）。
type PickerStep = "intro" | "R1" | "R2"

const ROUNDS: ConferenceWorkshopRound[] = ["R1", "R2"]

function workshopById(id: string): ConferenceWorkshop {
  return conferenceWorkshops.find((w) => w.id === id)!
}

// 跟 components/conference-mission-home.tsx 裡同名函式是獨立副本，見那邊的說明。
function breakAfterFirstComma(text: string) {
  const commaIndex = text.indexOf("，")
  if (commaIndex === -1) return text
  return (
    <>
      {text.slice(0, commaIndex + 1)}
      <br />
      {text.slice(commaIndex + 1)}
    </>
  )
}

// 特會任務主頁的「選工作坊」卡片，分兩種狀態：兩場都選了就顯示已報名的
// 工作坊照片＋「編輯」，沒選完就顯示 CTA 卡＋工作坊縮圖引導去選——不管
// 缺的是「完全沒選」還是「只選了一場」，兩場都要選完才算報名完成（跟
// 原本 Google 表單一次填完兩場一樣）。用照片而不是純文字：跟頁面其他
// 區塊（倒數計時、聚會卡片、工作坊橫向捲動列）一樣是滿版照片＋文字疊加，
// 純文字卡片在這個頁面裡會顯得突兀。卡片本身放在哪裡（置頂或跟橫向捲動
// 列相鄰）由呼叫端決定，這裡只負責兩種狀態的內容。
export function ConferenceWorkshopPicker({
  registration,
  onSaved,
  fullSlots,
}: {
  registration: Registration
  onSaved: (next: Registration) => void
  fullSlots: string[]
}) {
  const router = useRouter()
  const fullSlotSet = useMemo(() => new Set(fullSlots), [fullSlots])

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<PickerStep>("intro")
  const [introIndex, setIntroIndex] = useState(0)
  const [draft, setDraft] = useState<Registration>(registration)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const completed = registration.R1 !== null && registration.R2 !== null
  // 只是用來決定要不要顯示「立即選擇」／「編輯」，真正擋人的驗證在
  // saveMyWorkshopSelection 那邊（伺服器時間，不能被使用者的裝置時間騙過）。
  const closed = isWorkshopSelectionClosed()

  useDialogBackClose(open, () => setOpen(false))

  function openPicker() {
    if (closed) return
    setDraft(registration)
    // 編輯（已經報名過）跳過介紹，直接進選擇；第一次選才要求先看過介紹。
    setStep(completed ? "R1" : "intro")
    setIntroIndex(0)
    setError(null)
    setOpen(true)
  }

  // 點工作坊只是選取（畫面上打勾），不會馬上跳下一步或送出——要按「下一步」
  // ／「完成」才會真的前進／送出，使用者按錯可以先改選再確認。
  function selectRound(round: ConferenceWorkshopRound, workshopId: string) {
    setDraft((prev) => ({ ...prev, [round]: workshopId }))
  }

  function handleNext() {
    if (!draft.R1) return
    setStep("R2")
  }

  async function handleFinish() {
    if (!draft.R2 || pending) return
    setPending(true)
    setError(null)
    const result = await saveWorkshopSelection({ R1: draft.R1!, R2: draft.R2 })
    if (result.ok) {
      onSaved(result.data)
      setOpen(false)
      // 這次的選擇可能讓某個工作坊的名額用滿或空出來，重新整理拿到最新的
      // fullSlots，下次打開才不會顯示過期的額滿狀態。
      router.refresh()
    } else {
      setError(result.error)
    }
    setPending(false)
  }

  // 標題列左邊的返回：介紹卡片內是「上一張」，選擇步驟內是「回上一步」，
  // 都用同一個位置、同一種樣式表達，使用者不用分辨兩種不同的返回邏輯。
  function handleBack() {
    if (step === "intro") {
      if (introIndex > 0) setIntroIndex((i) => i - 1)
      return
    }
    if (step === "R1") {
      setStep("intro")
      return
    }
    setStep("R1")
  }

  const showBack = (step === "intro" && introIndex > 0) || (step === "R1" && !completed) || step === "R2"

  return (
    <>
      {/* 跟倒數計時卡片（components/conference-mission-home.tsx）同一種
          半透明毛玻璃底：backdrop-blur＋白色透明底，不是實色灰底，文字
          跟著換成白色系。 */}
      <div className="mt-6 overflow-hidden rounded-3xl border border-white/15 bg-white/10 text-white/90 backdrop-blur-xl">
        {completed ? (
          <div className="p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-[family-name:var(--font-noto-jp)] text-lg font-bold">已報名工作坊</p>
              {!closed && (
                <button
                  type="button"
                  onClick={openPicker}
                  className="text-sm font-medium underline underline-offset-4"
                >
                  編輯
                </button>
              )}
            </div>
            {closed && (
              <p className="mt-1 text-xs text-white/50">
                已截止更改（場次一開始前 {WORKSHOP_SELECTION_DEADLINE_MINUTES} 分鐘截止）
              </p>
            )}
            {/* 純文字：場次／時間／名稱／主講人／地點，已報名之後不用再放
                照片搶注意力（照片是還沒選、需要被吸引去選的時候才用）。 */}
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {ROUNDS.map((round) => {
                const workshop = workshopById(registration[round]!)
                return (
                  <div key={round} className="flex flex-col gap-0.5">
                    <p className="font-semibold">
                      {workshopRoundLabels[round]}｜{workshopRoundTimeLabels[round]}
                    </p>
                    <p>{workshop.topic || workshop.speaker}</p>
                    {workshop.topic && <p className="text-white/60">{workshop.speaker}</p>}
                    <p className="text-white/60">{workshop.location}</p>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <p className="font-[family-name:var(--font-noto-jp)] text-lg font-bold">
              {workshopDateLabel} 工作坊{closed ? "已截止選擇" : "還沒選"}
            </p>
            <p className="mt-1 text-sm text-white/60">
              {closed
                ? `已經超過場次一開始前 ${WORKSHOP_SELECTION_DEADLINE_MINUTES} 分鐘的更改期限，無法再選擇。`
                : "兩個場次各選一個工作坊，選完隨時可以再改。"}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {conferenceWorkshops.map((workshop) => (
                <div key={workshop.id} className="relative aspect-[4/5] overflow-hidden rounded-2xl">
                  <Image src={workshop.image} alt="" fill sizes="100px" className="object-cover" />
                </div>
              ))}
            </div>
            {!closed && (
              <Button type="button" size="lg" className="mt-4 w-full" onClick={openPicker}>
                立即選擇
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        {/* 不設 max-h／overflow-y-auto：介紹卡跟選項格狀排列都控制在一般
            手機螢幕高度內一次顯示完，不需要在彈窗裡再捲動。 */}
        <DialogContent
          showCloseButton={false}
          className="flex max-w-[calc(100%-2rem)] flex-col gap-0 rounded-3xl border-none bg-card p-0 sm:max-w-md"
        >
          <DialogTitle className="sr-only">選工作坊</DialogTitle>
          <div className="flex items-center justify-between p-6 pb-0">
            {showBack ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={pending}
                className="text-sm text-muted-foreground disabled:opacity-50"
              >
                ‹ 上一步
              </button>
            ) : (
              <p className="text-xl font-bold">{step === "intro" ? "工作坊介紹" : "選工作坊"}</p>
            )}
            <DialogClose className="text-white/80 hover:text-white">
              <X className="size-5" />
              <span className="sr-only">關閉</span>
            </DialogClose>
          </div>

          <div className="flex flex-col gap-4 p-6">
            {step === "intro" && (
              <WorkshopIntroCard
                workshop={conferenceWorkshops[introIndex]}
                index={introIndex}
                total={conferenceWorkshops.length}
                onNext={() => {
                  if (introIndex < conferenceWorkshops.length - 1) setIntroIndex((i) => i + 1)
                  else setStep("R1")
                }}
              />
            )}

            {/* 兩步驟：先選場次一按「下一步」才跳場次二，場次二選完按「完成」
                才送出——不是兩排選項一起選，但也不是點了就自動前進／自動
                送出，選錯了可以在同一步改選再確認。 */}
            {step === "R1" && (
              <>
                <p className="text-sm text-muted-foreground">
                  {workshopRoundLabels.R1}｜{workshopRoundTimeLabels.R1}
                </p>
                <WorkshopGrid
                  round="R1"
                  selectedId={draft.R1}
                  fullSlotSet={fullSlotSet}
                  ownCurrentId={registration.R1}
                  disabled={false}
                  onSelect={(id) => selectRound("R1", id)}
                />
                <Button type="button" size="lg" disabled={!draft.R1} onClick={handleNext}>
                  下一步
                </Button>
              </>
            )}

            {step === "R2" && (
              <>
                <p className="text-sm text-muted-foreground">
                  {workshopRoundLabels.R2}｜{workshopRoundTimeLabels.R2}
                </p>
                <WorkshopGrid
                  round="R2"
                  selectedId={draft.R2}
                  fullSlotSet={fullSlotSet}
                  ownCurrentId={registration.R2}
                  disabled={pending}
                  onSelect={(id) => selectRound("R2", id)}
                />
                <Button type="button" size="lg" disabled={!draft.R2 || pending} onClick={handleFinish}>
                  {pending ? "送出中…" : "完成"}
                </Button>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

function WorkshopIntroCard({
  workshop,
  index,
  total,
  onNext,
}: {
  workshop: ConferenceWorkshop
  index: number
  total: number
  onNext: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-[#3B82F6]">
        {workshop.infoImage && (
          <Image
            src={workshop.infoImage}
            alt=""
            fill
            sizes="(min-width: 640px) 448px, 100vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium">
          <LocationPinIcon className="size-4" />
          {workshop.location}
        </span>
        <p className="text-lg font-bold">{breakAfterFirstComma(workshop.topic || workshop.speaker)}</p>
        {workshop.topic && <p className="text-sm text-muted-foreground">{workshop.speaker}</p>}
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {workshop.rounds.map((round) => (
            <span key={round}>
              {workshopRoundLabels[round]}｜{workshopRoundTimeLabels[round]}
            </span>
          ))}
          <span>{workshopDateLabel}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className="size-1.5 rounded-full"
              style={{ backgroundColor: i === index ? "var(--primary)" : "var(--border)" }}
            />
          ))}
        </div>
        <Button type="button" onClick={onNext}>
          {index === total - 1 ? "開始選擇" : "下一個"}
        </Button>
      </div>
    </div>
  )
}

function WorkshopGrid({
  round,
  selectedId,
  fullSlotSet,
  ownCurrentId,
  disabled,
  onSelect,
}: {
  round: ConferenceWorkshopRound
  selectedId: string | null
  fullSlotSet: Set<string>
  ownCurrentId: string | null
  disabled: boolean
  onSelect: (workshopId: string) => void
}) {
  // 四個工作坊都列出來，不是這個場次沒開放的（例如工作坊 A 沒有場次二）
  // 就直接從畫面上消失——改成顯示但擋掉不能選，使用者才看得出「這個場次
  // 本來就沒有 A」，不是系統漏掉或壞掉。
  return (
    <div className="grid grid-cols-2 gap-2">
      {conferenceWorkshops.map((workshop) => {
        const offered = workshop.rounds.includes(round)
        const selected = offered && selectedId === workshop.id
        // 額滿只擋別人，自己原本就選在裡面的那個不會被自己的選擇擋住。
        const full = offered && fullSlotSet.has(`${workshop.id}:${round}`) && ownCurrentId !== workshop.id
        return (
          <button
            key={workshop.id}
            type="button"
            disabled={!offered || full || disabled}
            aria-label={workshop.topic || workshop.speaker}
            aria-pressed={selected}
            onClick={() => onSelect(workshop.id)}
            className="relative aspect-[4/5] overflow-hidden rounded-2xl disabled:cursor-not-allowed"
            style={{
              outline: selected ? "2px solid var(--primary)" : "1px solid var(--border)",
              outlineOffset: -2,
            }}
          >
            <Image src={workshop.image} alt="" fill sizes="120px" className="object-cover" />
            {selected && (
              <span className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="size-3" strokeWidth={3} />
              </span>
            )}
            {!offered && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs font-medium text-white">
                未開放
              </span>
            )}
            {offered && full && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/70 text-xs font-medium text-white">
                已額滿
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
