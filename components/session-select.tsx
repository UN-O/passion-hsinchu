"use client"

import { useRouter } from "next/navigation"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// CAMP／CONFERENCE 共用的場次切換選單。只列出已經輪到過的場次（items 已經是
// 篩選過的 unlocked 清單），還沒開始的場次不會出現在選單裡。只剩一個選項時
// 乾脆不顯示選單，避免無用的 UI。
//
// 場次網址用路徑而不是 query（basePath/id，不是 basePath?session=id）：直接
// 用 id 定位每一場活動的討論，而不是一個可以被拿掉/亂改的查詢參數。
export function SessionSelect({
  items,
  activeId,
  basePath,
}: {
  items: { id: string; label: string }[]
  activeId: string
  basePath: string
}) {
  const router = useRouter()

  if (items.length <= 1) return null

  return (
    <Select value={activeId} onValueChange={(id) => router.push(`${basePath}/${id}`)}>
      <SelectTrigger size="sm" aria-label="切換場次">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
