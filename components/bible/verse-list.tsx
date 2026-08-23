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
}: {
  verses: BibleVerse[]
  interactive?: boolean
  selected?: Set<number>
  highlighted?: Set<number>
  onToggleVerse?: (verse: number) => void
}) {
  const sections = groupByHeading(verses)

  return (
    <div className="flex min-w-0 w-full flex-col gap-3">
      {sections.map((section, i) => (
        <div key={i} className="min-w-0">
          {section.heading && <p className="mb-1 text-sm font-semibold break-words">{section.heading}</p>}
          <p className="min-w-0 text-base leading-loose break-words">
            {section.verses.map((v) => (
              <span
                key={v.verse}
                onClick={interactive ? () => onToggleVerse?.(v.verse) : undefined}
                className={cn(
                  interactive && "cursor-pointer rounded",
                  selected?.has(v.verse) && "bg-muted",
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
