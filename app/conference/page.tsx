import type { Metadata } from "next"

import { ProgramPortal } from "@/components/program-portal"
import { requireFlowAccess } from "@/lib/session"
import { conference } from "@/lib/site-config"

export const metadata: Metadata = {
  title: conference.label,
  robots: { index: false, follow: false },
}

export default async function ConferencePage() {
  const session = await requireFlowAccess("conference")

  return <ProgramPortal flow="conference" program={conference} session={session} />
}
