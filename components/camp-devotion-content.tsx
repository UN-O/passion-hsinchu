"use client"

import { useLayoutEffect, useRef, useState } from "react"
import { YouVersionProvider, BibleCard } from "@youversion/platform-react-ui"

import { MeetingNotes } from "@/components/meeting-notes"
import { genRyuMin } from "@/app/fonts/gen-ryu-min"
import { cn } from "@/lib/utils"
import { DEVOTION_ENTRIES, YOUVERSION_DEFAULT_VERSION_ID, type DevotionEntry } from "@/lib/devotion-content"

// 經文串接 YouVersion Platform API（bible.com 官方 API），要在 platform.youversion.com
// 免費註冊一個 App 拿 App Key，填進 .env 的 NEXT_PUBLIC_YOUVERSION_APP_KEY 才會生效。
// 這把 Key 設計上就是給前端公開用的（不是要保密的密鑰），所以用 NEXT_PUBLIC_ 前綴。
// 沒設定的時候先顯示「經文尚未連接」，不要讓頁面直接壞掉。
const APP_KEY = process.env.NEXT_PUBLIC_YOUVERSION_APP_KEY

const CHINESE_DAY_DIGIT: Record<string, string> = { 一: "1", 二: "2", 三: "3", 四: "4", 五: "5", 六: "6" }

// 「第二天早上」→ "DAY2"：從 day 文字本身推算，不是看陣列 index，
// 之後補第一天的資料、陣列順序改變也不會跟著跑掉。
function dayTabLabel(day: string): string {
  const digit = CHINESE_DAY_DIGIT[day.charAt(1)]
  return digit ? `DAY${digit}` : day
}

function DevotionEntryCard({ entry, passage }: { entry: DevotionEntry; passage: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">{entry.day}</p>
        <p
          className={`${genRyuMin.className} w-[min(74%,28rem)] text-xl`}
          style={{ transform: "skewX(-5deg)" }}
        >
          {entry.title}
        </p>
      </div>

      {passage}

      {entry.intro && (
        <div className="flex flex-col gap-2 text-base">
          {entry.intro.split("\n").map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">反思問題</p>
        <ol className="flex flex-col gap-2 text-base">
          {entry.questions.map((question, index) => (
            <li key={index}>
              ({index === 0 ? "一" : "二"}）{question}
            </li>
          ))}
        </ol>
      </div>

      {entry.closing && <p className="text-base font-bold">{entry.closing}</p>}

      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">心得筆記欄</p>
        <div className="mt-2">
          <MeetingNotes />
        </div>
      </div>
    </div>
  )
}

export function CampDevotionContent() {
  const [current, setCurrent] = useState(0)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [indicator, setIndicator] = useState<{ left: number; width: number } | null>(null)

  // 液態玻璃背景跟著切到的按鈕滑過去，量的是按鈕相對於外層 relative 容器的
  // offsetLeft／offsetWidth，掛載時跟每次切換都要重算一次。
  useLayoutEffect(() => {
    const button = buttonRefs.current[current]
    if (button) setIndicator({ left: button.offsetLeft, width: button.offsetWidth })
  }, [current])

  const content = (
    <div className="flex flex-col gap-6">
      {/* DAY2／DAY3 開關：按一下切換頁面，兩天的內容都留著掛在 DOM 上（用 hidden
          切換顯示），不是條件式渲染再互相替換——不然切換頁面時心得筆記欄會被整個
          卸載重掛，剛打的字會不見。 */}
      <div className="relative inline-flex w-fit gap-2">
        {indicator && (
          <div
            aria-hidden
            className="absolute inset-y-0 rounded-full border border-white/50 bg-white/30 shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_1px_4px_rgba(0,0,0,0.12)] backdrop-blur-md transition-[left,width] duration-300 ease-out"
            style={{ left: indicator.left, width: indicator.width }}
          />
        )}
        {DEVOTION_ENTRIES.map((entry, index) => (
          <button
            key={entry.reference}
            ref={(el) => {
              buttonRefs.current[index] = el
            }}
            type="button"
            aria-pressed={current === index}
            onClick={() => setCurrent(index)}
            className={cn(
              "relative z-10 rounded-full border px-4 py-1.5 text-sm transition-colors",
              current === index
                ? "border-transparent font-semibold text-foreground"
                : "border-border text-foreground hover:border-foreground/40"
            )}
          >
            {dayTabLabel(entry.day)}
          </button>
        ))}
      </div>

      {DEVOTION_ENTRIES.map((entry, index) => (
        <div key={entry.reference} className={current === index ? undefined : "hidden"}>
          <DevotionEntryCard
            entry={entry}
            passage={
              APP_KEY ? (
                <BibleCard
                  reference={entry.reference}
                  versionId={YOUVERSION_DEFAULT_VERSION_ID}
                  background="light"
                  showVersionPicker
                />
              ) : (
                <p className="text-sm text-muted-foreground">經文尚未連接。</p>
              )
            }
          />
        </div>
      ))}
    </div>
  )

  if (!APP_KEY) return content

  return <YouVersionProvider appKey={APP_KEY} theme="light">{content}</YouVersionProvider>
}
