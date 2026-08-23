"use client"

import { useEffect, useRef, useState } from "react"

import { getPassageAction } from "@/lib/bible/actions"
import { referenceToLabel } from "@/lib/bible"
import type { BiblePassage, BibleReference, BibleVersionKey } from "@/lib/bible"
import { PassageCard } from "./passage-card"

// PassagePanel 的 client 版本：參照是 client state 決定的時候用這個
// （React 不准 client component 直接渲染 async server component，
// 見 passage-panel.tsx 開頭的說明）。
//
// initialPassage 有給的話（伺服器端已經先抓好資料、當 prop 傳進來），
// 第一次渲染直接用，不會多打一次 API、也不會閃一下「查詢中」；使用者
// 自己換版本（版本徽章變下拉選單，見 passage-card.tsx）之後才會重新查詢。
export function PassageCardClient({
  version: initialVersion,
  reference,
  interactive = true,
  initialPassage,
  allowVersionChange = true,
}: {
  version: BibleVersionKey
  reference: BibleReference
  interactive?: boolean
  initialPassage?: BiblePassage | null
  allowVersionChange?: boolean
}) {
  const [version, setVersion] = useState(initialVersion)
  const [passage, setPassage] = useState<BiblePassage | null>(initialPassage ?? null)
  const [loading, setLoading] = useState(initialPassage === undefined)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      // 伺服器已經把這個版本／參照的資料傳進來了，不用重抓一次。
      if (initialPassage !== undefined && version === initialVersion) return
    }

    let cancelled = false
    setLoading(true)
    getPassageAction(version, reference).then((result) => {
      if (!cancelled) {
        setPassage(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initialPassage/initialVersion 只在第一次渲染那次判斷要不要跳過，之後版本改變只看 version/reference
  }, [version, reference])

  if (loading) return <p className="text-sm text-muted-foreground">查詢中…</p>
  if (!passage) return <p className="text-sm text-muted-foreground">尚未連接，或查無 {referenceToLabel(reference)}。</p>

  return <PassageCard passage={passage} interactive={interactive} onVersionChange={allowVersionChange ? setVersion : undefined} />
}
