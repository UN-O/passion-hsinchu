import { redirect } from "next/navigation"

import { DEVOTION_ENTRIES } from "@/lib/devotion-content"
import { requireFlowAccess } from "@/lib/session"

// 沒帶天數進來：導去第一天（Day 2）的正式網址。真正的頁面在
// [day]/page.tsx。
export default async function CampDevotionIndexPage() {
  await requireFlowAccess("camp")
  redirect(`/camp/devotion/${DEVOTION_ENTRIES[0].id}`)
}
