"use client"

import { cn } from "@/lib/utils"
import type { BibleVerse } from "@/lib/bible"

// 純粹的經文渲染：有標題的節會先起一個新段落（標題＋接著的經文），沒有
// 標題的節接續上一段的內文——不是每節都各自一個 <p>，是照標題分段落，段落
// 內部才是連續的文字流。interactive 開著時每一節都能點（toggle 選取）。
export function VerseList({
  verses,
  interactive = false,
  selected,
  highlighted,
  onToggleVerse,
  // 閱讀模式（掛在 root post 底下）要跟貼文本身的字級一致（text-sm
  // leading-relaxed，見 root-content.tsx 的內文），自由模式維持原本比較
  // 好讀的 text-base leading-loose——預設值就是自由模式那組，閱讀模式
  // 由 passage-card.tsx 一路往下傳 textClassName 覆寫。
  textClassName = "text-base leading-loose",
}: {
  verses: BibleVerse[]
  interactive?: boolean
  selected?: Set<number>
  highlighted?: Set<number>
  onToggleVerse?: (verse: number) => void
  textClassName?: string
}) {
  const sections = groupByHeading(verses)

  return (
    <div className="flex min-w-0 w-full flex-col gap-3">
      {sections.map((section, i) => (
        <div key={i} className="min-w-0">
          {section.heading && <p className="mb-1 text-sm font-semibold break-words">{section.heading}</p>}
          <p className={cn("min-w-0 break-words", textClassName)}>
            {section.verses.map((v) => (
              <span
                key={v.verse}
                onClick={interactive ? () => onToggleVerse?.(v.verse) : undefined}
                className={cn(
                  interactive && "cursor-pointer rounded",
                  // 選取中（還沒按動作列）：虛線底線＋比 bg-muted 明顯的灰
                  // （bg-muted 在卡片底色上幾乎看不出來，見使用者回報）。
                  selected?.has(v.verse) && "bg-foreground/10 underline decoration-2 decoration-dashed decoration-muted-foreground underline-offset-4",
                  highlighted?.has(v.verse) && "bg-primary/25"
                )}
              >
                <sup className="mr-0.5 text-[0.7em] text-muted-foreground">{v.verse}</sup>
                {v.text}{" "}
              </span>
            ))}
          </p>
        </div>
      ))}
    </div>
  )
}

function groupByHeading(verses: BibleVerse[]) {
  const sections: { heading?: string; verses: BibleVerse[] }[] = []
  for (const v of verses) {
    if (v.heading || sections.length === 0) {
      sections.push({ heading: v.heading, verses: [v] })
    } else {
      sections[sections.length - 1].verses.push(v)
    }
  }
  return sections
}
