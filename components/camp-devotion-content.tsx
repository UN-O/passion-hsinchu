"use client"

import { YouVersionProvider, BibleCard } from "@youversion/platform-react-ui"

import { DEVOTION_ENTRIES, YOUVERSION_DEFAULT_VERSION_ID } from "@/lib/devotion-content"

// 經文串接 YouVersion Platform API（bible.com 官方 API），要在 platform.youversion.com
// 免費註冊一個 App 拿 App Key，填進 .env 的 NEXT_PUBLIC_YOUVERSION_APP_KEY 才會生效。
// 這把 Key 設計上就是給前端公開用的（不是要保密的密鑰），所以用 NEXT_PUBLIC_ 前綴。
// 沒設定的時候先顯示「經文尚未連接」，不要讓頁面直接壞掉。
const APP_KEY = process.env.NEXT_PUBLIC_YOUVERSION_APP_KEY

function DevotionList({ children }: { children: (entry: (typeof DEVOTION_ENTRIES)[number]) => React.ReactNode }) {
  return (
    <div className="flex flex-col gap-10">
      {DEVOTION_ENTRIES.map((entry) => (
        <div key={entry.reference} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">{entry.day}</p>
            <p className="text-xl font-bold">{entry.title}</p>
          </div>
          {children(entry)}
        </div>
      ))}
    </div>
  )
}

export function CampDevotionContent() {
  if (!APP_KEY) {
    return <DevotionList>{() => <p className="text-sm text-muted-foreground">經文尚未連接。</p>}</DevotionList>
  }

  return (
    <YouVersionProvider appKey={APP_KEY} theme="light">
      <DevotionList>
        {(entry) => (
          <BibleCard reference={entry.reference} versionId={YOUVERSION_DEFAULT_VERSION_ID} background="light" showVersionPicker />
        )}
      </DevotionList>
    </YouVersionProvider>
  )
}
