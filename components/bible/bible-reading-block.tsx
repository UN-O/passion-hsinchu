import { PassagePanel } from "./passage-panel"
import type { BibleReference, BibleVersionKey } from "@/lib/bible"

// 閱讀模式：只用在 root post，管理者選好的段落，獨立於內文之外顯示
// （不是 markdown content 的一部分）。讀的人可以點經文互動——見
// passage-panel.tsx／passage-body.tsx。這裡本身不管資料怎麼存，呼叫端
// （RootContent）決定要不要顯示、傳什麼段落進來。
export function BibleReadingBlock({ version, reference }: { version: BibleVersionKey; reference: BibleReference }) {
  return <PassagePanel version={version} reference={reference} interactive />
}
