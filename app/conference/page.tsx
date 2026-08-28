import type { Metadata } from "next"

import { ConferenceMissionHome } from "@/components/conference-mission-home"
import { ProgramPortal } from "@/components/program-portal"
import { getFullWorkshopSlots, getWorkshopRegistration } from "@/lib/conference-workshop"
import { requireFlowAccess } from "@/lib/session"
import { conference } from "@/lib/site-config"

export const metadata: Metadata = {
  title: conference.label,
  robots: { index: false, follow: false },
}

export default async function ConferencePage() {
  const session = await requireFlowAccess("conference")

  // 做完開場之後，/conference 換成任務主頁；還沒做完的人繼續看原本的
  // 活動資訊頁，引導去開場（跟 /camp 的邏輯一致）。
  if (session.completedFlows.includes("conference")) {
    // enrollmentId 一定有值：走到這裡代表 assertFlowAccess 已經確認
    // session.enrollment.conference 是 true。
    const [workshopRegistration, fullWorkshopSlots] = await Promise.all([
      getWorkshopRegistration(session.user.enrollmentId!),
      getFullWorkshopSlots(),
    ])

    return (
      <ConferenceMissionHome
        initialWorkshopRegistration={workshopRegistration}
        fullWorkshopSlots={[...fullWorkshopSlots]}
      />
    )
  }

  return <ProgramPortal flow="conference" program={conference} session={session} />
}
