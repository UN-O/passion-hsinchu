import { fetchPassage, referenceToLabel } from "@/lib/bible"
import type { BibleReference, BibleVersionKey } from "@/lib/bible"
import { BIBLE_VERSIONS } from "@/lib/bible"
import { PassageCard } from "./passage-card"

// 伺服器端直接抓好資料再渲染的版本——只能用在 server component 的樹裡
// （不能被 client component 直接渲染，Next.js 不允許 client 樹裡出現
// async server component）。真正的資料來源已經在伺服器端手上時用這個；
// client state 驅動（換章節、選段落之類）要用 passage-card-client.tsx。
export async function PassagePanel({
  version,
  reference,
  interactive = false,
}: {
  version: BibleVersionKey
  reference: BibleReference
  interactive?: boolean
}) {
  const passage = await fetchPassage(version, reference)

  if (!passage) {
    return (
      <p className="text-sm text-muted-foreground">
        {BIBLE_VERSIONS[version].label} 尚未連接，或查無 {referenceToLabel(reference)}。
      </p>
    )
  }

  return <PassageCard passage={passage} interactive={interactive} />
}
