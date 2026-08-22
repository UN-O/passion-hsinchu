"use client"

import { CAMP_ZONE_META } from "@/lib/camp-zones"
import type { ExpRegion } from "@/lib/exp-regions"

// 名字後面的分區徽章：計分表上那顆區域 icon 的縮小版。
//
// 尺寸用 1em、垂直對齊用 align-middle：徽章的高度就等於旁邊那行字的字級，
// 不會比名字高，而且跟著字一起置中——寫死 px 的話，之後名字的字級一改就
// 會突出來一塊。
export function ZoneBadge({ zone }: { zone: ExpRegion }) {
  const meta = CAMP_ZONE_META[zone]
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 尺寸跟著字級走（1em），next/image 需要固定尺寸
    <img
      src={meta.icon}
      alt={meta.title}
      title={meta.title}
      className="inline-block h-[1em] w-auto shrink-0 select-none align-middle"
      draggable={false}
    />
  )
}
