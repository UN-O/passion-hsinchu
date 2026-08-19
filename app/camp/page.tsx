import type { Metadata } from "next"

import { CampMissionHome } from "@/components/camp-mission-home"
import { ProgramPortal } from "@/components/program-portal"
import { requireFlowAccess } from "@/lib/session"
import { camp } from "@/lib/site-config"

export const metadata: Metadata = {
  title: camp.label,
  robots: { index: false, follow: false },
}

export default async function CampPage() {
  const session = await requireFlowAccess("camp")

  // 做完開場（點過「開始冒險」）之後，/camp 換成任務主頁；
  // 還沒做完的人繼續看原本的活動資訊頁，引導去開場。
  if (session.completedFlows.includes("camp")) {
    return <CampMissionHome heroName={session.campQuizResult?.heroName || session.user.name} />
  }

  return <ProgramPortal flow="camp" program={camp} session={session} />
}
