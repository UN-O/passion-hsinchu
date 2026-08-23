import { ArrowUpRight } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BIBLE_VERSIONS } from "@/lib/bible"
import type { BiblePassage, BibleVersionKey } from "@/lib/bible"
import { PassageBody } from "./passage-body"

// 經文卡片的畫面本身：標題列（書卷章節＋版本徽章）＋ 內文 ＋ 出處。純
// 展示用，資料要已經拿到手（passage）——不自己 fetch。伺服器端已經有資料
// 時用 passage-panel.tsx（async server component 直接抓）；client 端狀態
// 驅動（例如自由模式換章節、閱讀模式讀者自己切版本）用
// passage-card-client.tsx，兩邊最後都畫這個元件，畫面才會一致。
//
// onVersionChange 有給的時候，版本徽章變成下拉選單（閱讀模式：管理者選好
// 段落，但讀者可以自己換版本讀同一段）；沒給就是純文字徽章（quote 模式
// 的預覽、伺服器端固定渲染的情境，沒有地方接收「換版本」這個動作）。
export function PassageCard({
  passage,
  interactive = false,
  onVersionChange,
  textClassName,
}: {
  passage: BiblePassage
  interactive?: boolean
  onVersionChange?: (version: BibleVersionKey) => void
  textClassName?: string
}) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-4 rounded-2xl border border-border bg-card p-5 text-card-foreground sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {passage.bookLabel} {passage.reference.chapter}
          {passage.reference.verseStart > 1 || passage.reference.verseEnd
            ? `:${passage.reference.verseStart}${passage.reference.verseEnd && passage.reference.verseEnd !== passage.reference.verseStart ? `-${passage.reference.verseEnd}` : ""}`
            : ""}
        </p>

        {onVersionChange ? (
          <Select value={passage.version} onValueChange={(v) => onVersionChange(v as BibleVersionKey)}>
            <SelectTrigger size="sm" className="w-auto shrink-0 rounded-full border-border text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(BIBLE_VERSIONS) as BibleVersionKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  {BIBLE_VERSIONS[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="shrink-0 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
            {passage.versionLabel}
          </span>
        )}
      </div>

      <PassageBody passage={passage} interactive={interactive} textClassName={textClassName} />

      {/* 版本已經在上面那顆徽章顯示過了，這裡改成連到自由模式的「閱讀
          整章」——只有登入的人打得開（見 app/bible/page.tsx），開新分頁
          接著往下讀整章，不是留在原地的一行重複文字。 */}
      <a
        href={`/bible?book=${passage.reference.book}&chapter=${passage.reference.chapter}&version=${passage.version}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        閱讀整章
        <ArrowUpRight className="size-3.5" strokeWidth={1.75} />
      </a>
    </div>
  )
}
