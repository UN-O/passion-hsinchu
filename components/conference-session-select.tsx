"use client"

import { useRouter } from "next/navigation"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { ConferenceSession } from "@/lib/opening-conference-content"

// 只列出已經輪到過的場次（sessions 已經是篩選過的 unlocked 清單），還沒開始
// 顯示的場次不會出現在選單裡。只剩一個選項時乾脆不顯示選單，避免無用的 UI。
export function ConferenceSessionSelect({
  sessions,
  activeId,
  basePath,
}: {
  sessions: ConferenceSession[]
  activeId: string
  basePath: string
}) {
  const router = useRouter()

  if (sessions.length <= 1) return null

  return (
    <Select value={activeId} onValueChange={(id) => router.push(`${basePath}?session=${id}`)}>
      <SelectTrigger size="sm" aria-label="切換場次">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {sessions.map((session) => (
          <SelectItem key={session.id} value={session.id}>
            {session.dateLabel}・{session.typeLabel}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
